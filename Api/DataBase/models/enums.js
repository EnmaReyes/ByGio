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

const CURRENCY = "COP";

// Dias habiles de entrega prometidos al cliente.
const DELIVERY_BUSINESS_DAYS = 10;

// Minutos que se reserva el stock de un pedido sin pagar.
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
  CURRENCY,
  DELIVERY_BUSINESS_DAYS,
  STOCK_RESERVATION_MINUTES,
};
