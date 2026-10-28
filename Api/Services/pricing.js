const {
  Articulos,
  Dtf,
  DtfPriceVariant,
  Category,
} = require("../DataBase/models/index.js");
const HttpError = require("../Utils/HttpError.js");

// El precio y la disponibilidad SIEMPRE se resuelven en el backend.
// Lo que envie el cliente (cost, precio, total) se ignora por completo.

const MAX_ITEMS = 50;
const MAX_QUANTITY = 20;

// El frontend envia "basic" | "oversize"; en la BD el tipo es "basico".
const DTF_TIPO_MAP = {
  basic: "basico",
  basico: "basico",
  oversize: "oversize",
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const firstImage = (value) => {
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value === "string" && value.trim()) return value;
  return null;
};

const parseQuantity = (quantity) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, "Cantidad inválida");
  }
  if (parsed > MAX_QUANTITY) {
    throw new HttpError(400, `Máximo ${MAX_QUANTITY} unidades por producto`);
  }
  return parsed;
};

// ------------------------------- Articulos -------------------------------
const resolveArticle = async (item, transaction) => {
  const quantity = parseQuantity(item.quantity);

  const articulo = await Articulos.findByPk(item.productId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!articulo) {
    throw new HttpError(404, "El producto ya no existe");
  }
  if (!articulo.stock) {
    throw new HttpError(409, `"${articulo.title}" está agotado`);
  }

  const sizes = toArray(articulo.sizes);
  const oversize = Boolean(articulo.oversize);
  let size = null;

  if (!oversize) {
    const requested = String(item.size || "").trim();
    if (!requested) {
      throw new HttpError(400, `Selecciona una talla para "${articulo.title}"`);
    }
    if (!sizes.includes(requested)) {
      throw new HttpError(400, `Talla inválida para "${articulo.title}"`);
    }
    size = requested;
  }

  const cost = Number(articulo.cost) || 0;
  const descuento = Number(articulo.descuento) || 0;
  // "descuento" en la BD es el precio final rebajado (no un porcentaje).
  const unitPrice = descuento > 0 ? descuento : cost;
  const discount = descuento > 0 && cost > descuento ? cost - descuento : 0;

  return {
    line: {
      productType: "articulo",
      productId: articulo.id,
      variantId: null,
      title: articulo.title,
      imageUrl: firstImage(articulo.img),
      size,
      oversize,
      shirtColor: null,
      shirtName: null,
      dtfSize: null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      productSnapshot: articulo.toJSON(),
    },
    discount: discount * quantity,
  };
};

// --------------------------------- DTF ----------------------------------
const resolveVariant = async (dtf, item, transaction) => {
  if (item.variantId) {
    const variant = await DtfPriceVariant.findOne({
      where: { id: item.variantId, dtfId: dtf.id, activo: true },
      transaction,
    });
    if (!variant) {
      throw new HttpError(409, "La variante de precio ya no está disponible");
    }
    return variant;
  }

  const tipo = DTF_TIPO_MAP[String(item.dtfSize || "").trim().toLowerCase()];
  if (!tipo) {
    throw new HttpError(400, "Selecciona el tamaño del DTF");
  }

  const variant = await DtfPriceVariant.findOne({
    where: {
      dtfId: dtf.id,
      tipo,
      activo: true,
      medidas: null,
      color: null,
    },
    transaction,
  });

  if (!variant) {
    throw new HttpError(409, "El diseño DTF no tiene precio configurado");
  }
  return variant;
};

const resolveDtf = async (item, transaction) => {
  const quantity = parseQuantity(item.quantity);

  // El lock se toma solo sobre "dtfs": Postgres no permite FOR UPDATE con
  // un LEFT JOIN (la categoria se consulta aparte).
  const dtf = await Dtf.findByPk(item.productId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!dtf) {
    throw new HttpError(404, "El diseño DTF ya no existe");
  }
  if (!dtf.stock) {
    throw new HttpError(409, "El diseño DTF está agotado");
  }

  const category = await Category.findByPk(dtf.categoryId, { transaction });
  const variant = await resolveVariant(dtf, item, transaction);
  const unitPrice = Number(variant.precio) || 0;

  if (unitPrice <= 0) {
    throw new HttpError(409, "El diseño DTF no tiene un precio válido");
  }

  const categoryName = category?.name || "Sin categoría";

  return {
    line: {
      productType: "dtf",
      productId: dtf.id,
      variantId: variant.id,
      title: `Diseño DTF · ${categoryName}`,
      imageUrl: dtf.img || null,
      size: null,
      oversize: variant.tipo === "oversize",
      shirtColor: item.shirtColor ? String(item.shirtColor).slice(0, 50) : null,
      shirtName: item.shirtName ? String(item.shirtName).slice(0, 100) : null,
      dtfSize: variant.tipo,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      productSnapshot: {
        ...dtf.toJSON(),
        category: category ? category.toJSON() : null,
        variant: variant.toJSON(),
      },
    },
    discount: 0,
  };
};

// ------------------------------ Carrito ---------------------------------
const buildOrderLines = async (items, transaction) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "El carrito está vacío");
  }
  if (items.length > MAX_ITEMS) {
    throw new HttpError(400, "Demasiados productos en el pedido");
  }

  const lines = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const rawItem of items) {
    const item = rawItem || {};
    const productType = String(
      item.productType || item.type || "",
    ).toLowerCase();
    const productId = item.productId || item.id;

    if (!productId) {
      throw new HttpError(400, "Falta el producto en uno de los ítems");
    }

    let resolved = null;

    if (productType === "articulo" || productType === "article") {
      resolved = await resolveArticle({ ...item, productId }, transaction);
    } else if (productType === "dtf") {
      resolved = await resolveDtf({ ...item, productId }, transaction);
    } else {
      throw new HttpError(400, "Tipo de producto inválido");
    }

    lines.push(resolved.line);
    subtotal += resolved.line.lineTotal;
    discountTotal += resolved.discount;
  }

  return { lines, subtotal, discountTotal };
};

module.exports = { buildOrderLines, DTF_TIPO_MAP, firstImage };
