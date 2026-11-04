// Estados y constantes compartidas del ecommerce.
// Se centralizan aqui para que modelos, servicios y controladores usen
// exactamente los mismos valores (y coincidan con los CHECK del SQL).

const ORDER_STATUS = {
  PENDIENTE_PAGO: "pendiente_pago",
  PAGADO: "pagado",
  EN_PREPARACION: "en_preparacion",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
};

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

// Transiciones permitidas del estado logistico. Se validaran en el servicio
// de pedidos (fase de endpoints); aqui queda documentado el flujo.
const ORDER_STATUS_TRANSITIONS = {
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["en_preparacion", "cancelado"],
  en_preparacion: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

const PAYMENT_STATUS = {
  PENDIENTE: "pendiente",
  APROBADO: "aprobado",
  RECHAZADO: "rechazado",
  ANULADO: "anulado",
  REEMBOLSADO: "reembolsado",
  EN_REVISION: "en_revision",
  // Wompi reporta ERROR cuando la transaccion no pudo procesarse. La columna
  // ya lo acepta (migracion 005); sin esta constante la validacion isIn del
  // modelo rechazaria ese estado.
  ERROR: "error",
};

const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

const HISTORY_KIND = {
  LOGISTICA: "logistica",
  PAGO: "pago",
};

const HISTORY_KIND_VALUES = Object.values(HISTORY_KIND);

const PRODUCT_TYPE = {
  ARTICULO: "articulo",
  DTF: "dtf",
};

const PRODUCT_TYPE_VALUES = Object.values(PRODUCT_TYPE);

// Canal por el que entro la venta. 'web' lo asigna el checkout; los demas
// los registra un administrador para ventas externas (presencial/WhatsApp).
const SALE_CHANNEL = {
  WEB: "web",
  PRESENCIAL: "presencial",
  WHATSAPP: "whatsapp",
  OTRO: "otro",
};

const SALE_CHANNEL_VALUES = Object.values(SALE_CHANNEL);

// Metodo de pago. Solo aplica a ventas registradas a mano: el pago con
// Wompi vive en la tabla payments (provider = 'wompi').
const PAYMENT_METHOD = {
  EFECTIVO: "efectivo",
  NEQUI: "nequi",
  TRANSFERENCIA: "transferencia",
  TARJETA: "tarjeta",
  OTRO: "otro",
};

const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

const CURRENCY = "COP";

// Dias habiles de entrega prometidos al cliente. Se guardan como snapshot en
// el pedido (orders.estimatedDeliveryDays) al crearlo, para que un cambio de
// reglas no altere pedidos ya hechos.
//   - Medellin y el resto de Antioquia: 3 dias habiles
//   - Cualquier otro departamento: 10 dias habiles
const DELIVERY_DAYS = {
  ANTIOQUIA: 3,
  NACIONAL: 10,
};

// Minutos que se reserva el stock de un pedido sin pagar.
//
// HOY NO SE USA: con stock booleano el bloqueo de 30 minutos solo esconde el
// producto de un carrito abandonado (y permite bloquear el catalogo entero
// creando pedidos). La reserva se activa con STOCK_RESERVATION_ENABLED y se
// implementara de verdad cuando el stock sea por cantidad
// (tabla inventory_reservations). La estructura se conserva para no reescribir
// el flujo despues.
const STOCK_RESERVATION_MINUTES = 30;

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  HISTORY_KIND,
  HISTORY_KIND_VALUES,
  PRODUCT_TYPE,
  PRODUCT_TYPE_VALUES,
  SALE_CHANNEL,
  SALE_CHANNEL_VALUES,
  PAYMENT_METHOD,
  PAYMENT_METHOD_VALUES,
  CURRENCY,
  DELIVERY_DAYS,
  STOCK_RESERVATION_MINUTES,
};
