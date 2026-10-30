const { Op } = require("sequelize");
const {
  sequelize,
  Order,
  OrderItem,
  Payment,
  OrderStatusHistory,
  Articulos,
  Dtf,
} = require("../DataBase/models/index.js");
const {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS,
  HISTORY_KIND,
  STOCK_RESERVATION_MINUTES,
} = require("../DataBase/models/enums.js");
const { buildOrderLines } = require("./pricing.js");
const { quoteShipping } = require("./shipping.js");
const HttpError = require("../Utils/HttpError.js");

const REQUIRED_SHIPPING_FIELDS = [
  "recipientName",
  "email",
  "phone",
  "address",
  "city",
  "department",
];

const trim = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

// Valida y normaliza el snapshot de envio que envia el checkout.
const validateShipping = (shipping = {}) => {
  const data = {
    recipientName: trim(shipping.recipientName || shipping.name).slice(0, 150),
    email: trim(shipping.email).toLowerCase().slice(0, 255),
    phone: trim(shipping.phone).slice(0, 30),
    address: trim(shipping.address).slice(0, 255),
    city: trim(shipping.city).slice(0, 100),
    department: trim(shipping.department).slice(0, 100),
    postalCode: trim(shipping.postalCode).slice(0, 20) || null,
    notes: trim(shipping.notes) || null,
  };

  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!data[field]) {
      throw new HttpError(400, `Falta el dato de envío: ${field}`);
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new HttpError(400, "Correo electrónico inválido");
  }
  if (data.phone.replace(/\D/g, "").length < 7) {
    throw new HttpError(400, "Teléfono inválido");
  }

  return data;
};

const generateOrderNumber = async (transaction) => {
  const [rows] = await sequelize.query(
    "SELECT nextval('order_number_seq') AS n",
    { transaction },
  );
  const numero = String(rows[0].n).padStart(6, "0");
  return `BYG-${new Date().getFullYear()}-${numero}`;
};

const productModel = (productType) =>
  productType === "articulo" ? Articulos : Dtf;

// Libera el stock reservado por un pedido.
const releaseOrderStock = async (order, transaction) => {
  const items = await OrderItem.findAll({
    where: { orderId: order.id },
    transaction,
  });

  for (const item of items) {
    const Model = productModel(item.productType);
    await Model.update(
      { stock: true },
      { where: { id: item.productId }, transaction },
    );
  }
};

// Reserva el stock de cada producto del pedido. Los productos ya estan
// bloqueados y validados (stock = true) dentro de la misma transaccion.
const reserveOrderStock = async (lines, transaction) => {
  for (const line of lines) {
    const Model = productModel(line.productType);
    await Model.update(
      { stock: false },
      { where: { id: line.productId }, transaction },
    );
  }
};

// Libera las reservas vencidas (lazy: se ejecuta al crear un pedido).
// No hay cron en Vercel, por eso la expiracion se resuelve bajo demanda.
const releaseExpiredReservations = async (transaction) => {
  const expired = await Order.findAll({
    where: {
      status: ORDER_STATUS.PENDIENTE_PAGO,
      stockReservedUntil: { [Op.ne]: null, [Op.lt]: new Date() },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
    skipLocked: true,
  });

  for (const order of expired) {
    await releaseOrderStock(order, transaction);

    order.status = ORDER_STATUS.CANCELADO;
    order.cancelledAt = new Date();
    order.stockReservedUntil = null;
    await order.save({ transaction });

    await OrderStatusHistory.create(
      {
        orderId: order.id,
        kind: HISTORY_KIND.LOGISTICA,
        fromStatus: ORDER_STATUS.PENDIENTE_PAGO,
        toStatus: ORDER_STATUS.CANCELADO,
        note: "Reserva de stock expirada",
      },
      { transaction },
    );
  }

  return expired.length;
};

const ORDER_INCLUDE = [
  { model: OrderItem, as: "items" },
  { model: Payment, as: "payments" },
  { model: OrderStatusHistory, as: "history" },
];

const getOrderForUser = async ({ orderId, userId, admin = false, transaction }) => {
  const order = await Order.findOne({
    where: admin ? { id: orderId } : { id: orderId, userId },
    include: ORDER_INCLUDE,
    ...(transaction ? { transaction } : {}),
    order: [
      [{ model: OrderItem, as: "items" }, "createdAt", "ASC"],
      [{ model: Payment, as: "payments" }, "createdAt", "DESC"],
      [{ model: OrderStatusHistory, as: "history" }, "createdAt", "ASC"],
    ],
  });

  if (!order) {
    throw new HttpError(404, "Pedido no encontrado");
  }
  return order;
};

// Filtro opcional por uno o varios estados: "pagado,enviado".
// Se descartan los valores desconocidos para no exponer errores de SQL.
const parseStatusFilter = (status) => {
  if (!status) return null;
  const lista = String(status)
    .split(",")
    .map((valor) => valor.trim())
    .filter((valor) => ORDER_STATUS_VALUES.includes(valor));
  return lista.length ? lista : null;
};

const listOrdersForUser = async ({
  userId,
  admin = false,
  limit = 20,
  offset = 0,
  status,
}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const statusFilter = parseStatusFilter(status);

  const where = admin ? {} : { userId };
  if (statusFilter) where.status = { [Op.in]: statusFilter };

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: "items" }],
    order: [["createdAt", "DESC"]],
    limit: safeLimit,
    offset: safeOffset,
    distinct: true,
  });

  return { orders: rows, total: count, limit: safeLimit, offset: safeOffset };
};

// Crea el pedido: precios y stock desde la BD, snapshot completo y reserva
// de stock por 30 minutos.
const createOrder = async ({ userId, items, shipping, notes }) => {
  const transaction = await sequelize.transaction();

  try {
    await releaseExpiredReservations(transaction);

    const shippingData = validateShipping(shipping);
    const { lines, subtotal, discountTotal } = await buildOrderLines(
      items,
      transaction,
    );

    const quote = await quoteShipping({
      department: shippingData.department,
      city: shippingData.city,
      lat: shipping?.lat,
      lng: shipping?.lng,
      transaction,
    });

    // subtotal ya incluye los descuentos: unitPrice es el precio final.
    const total = subtotal + quote.cost;

    if (total <= 0) {
      throw new HttpError(400, "El total del pedido es inválido");
    }

    await reserveOrderStock(lines, transaction);

    const order = await Order.create(
      {
        orderNumber: await generateOrderNumber(transaction),
        userId,
        status: ORDER_STATUS.PENDIENTE_PAGO,
        paymentStatus: PAYMENT_STATUS.PENDIENTE,
        currency: "COP",
        subtotal,
        shippingCost: quote.cost,
        discountTotal,
        total,
        ...shippingData,
        notes: notes ? trim(notes).slice(0, 1000) : shippingData.notes,
        shippingZone: quote.zone,
        stockReservedUntil: new Date(
          Date.now() + STOCK_RESERVATION_MINUTES * 60 * 1000,
        ),
      },
      { transaction },
    );

    await OrderItem.bulkCreate(
      lines.map((line) => ({ ...line, orderId: order.id })),
      { transaction, validate: true },
    );

    await OrderStatusHistory.create(
      {
        orderId: order.id,
        kind: HISTORY_KIND.LOGISTICA,
        fromStatus: null,
        toStatus: ORDER_STATUS.PENDIENTE_PAGO,
        note: `Pedido creado. Stock reservado por ${STOCK_RESERVATION_MINUTES} minutos.`,
      },
      { transaction },
    );

    const full = await getOrderForUser({
      orderId: order.id,
      userId,
      transaction,
    });

    await transaction.commit();

    // Notificacion para el cliente (no bloquea si falla).
    try {
      const { createNotification } = require("./notifications.js");
      await createNotification({
        userId,
        tipo: "pedido",
        titulo: `Pedido ${full.orderNumber} registrado`,
        texto:
          "Recibimos tu pedido. Te contactaremos para coordinar el pago y la entrega.",
        to: `/dashboard/pedidos/${full.id}`,
        clave: `pedido:${full.id}:creado`,
      });
    } catch (error) {
      console.error(
        "No se pudo crear la notificación del pedido:",
        error.message,
      );
    }

    return full;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Cancela un pedido pendiente de pago y libera su stock.
const cancelOrder = async ({ orderId, user }) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new HttpError(404, "Pedido no encontrado");
    }
    if (!user.admin && order.userId !== user.id) {
      throw new HttpError(403, "No tienes permisos sobre este pedido");
    }
    if (order.status !== ORDER_STATUS.PENDIENTE_PAGO) {
      throw new HttpError(409, "Solo se pueden cancelar pedidos pendientes de pago");
    }

    await releaseOrderStock(order, transaction);

    order.status = ORDER_STATUS.CANCELADO;
    order.cancelledAt = new Date();
    order.stockReservedUntil = null;
    await order.save({ transaction });

    await OrderStatusHistory.create(
      {
        orderId: order.id,
        kind: HISTORY_KIND.LOGISTICA,
        fromStatus: ORDER_STATUS.PENDIENTE_PAGO,
        toStatus: ORDER_STATUS.CANCELADO,
        changedByUserId: user.id,
        note: user.admin ? "Cancelado por administrador" : "Cancelado por el cliente",
      },
      { transaction },
    );

    const full = await getOrderForUser({
      orderId: order.id,
      userId: order.userId,
      admin: true,
      transaction,
    });

    await transaction.commit();

    try {
      const { createNotification } = require("./notifications.js");
      await createNotification({
        userId: order.userId,
        tipo: "pedido",
        titulo: `Pedido ${full.orderNumber} cancelado`,
        texto:
          "Cancelaste tu pedido. Los productos volvieron a estar disponibles.",
        to: `/dashboard/pedidos/${full.id}`,
        clave: `pedido:${full.id}:cancelado`,
      });
    } catch (error) {
      console.error(
        "No se pudo crear la notificación del pedido:",
        error.message,
      );
    }

    return full;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createOrder,
  cancelOrder,
  getOrderForUser,
  listOrdersForUser,
  releaseExpiredReservations,
  releaseOrderStock,
  validateShipping,
};
