// Etiquetas y helpers de pedidos compartidos por checkout, "mis pedidos"
// y el panel de administracion.

export const ORDER_STATUS_META = {
  pendiente_pago: { label: "Pendiente de pago", tone: "pending" },
  pagado: { label: "Pagado", tone: "paid" },
  en_preparacion: { label: "En preparación", tone: "preparing" },
  enviado: { label: "Enviado", tone: "shipped" },
  entregado: { label: "Entregado", tone: "delivered" },
  cancelado: { label: "Cancelado", tone: "cancelled" },
};

export const PAYMENT_STATUS_LABELS = {
  pendiente: "Pago pendiente",
  aprobado: "Pago aprobado",
  rechazado: "Pago rechazado",
  anulado: "Pago anulado",
  reembolsado: "Pago reembolsado",
  en_revision: "Pago en revisión",
};

export const ORDER_STATUS_FLOW = [
  "pendiente_pago",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
];

// Transiciones permitidas (espejo de Api/DataBase/models/enums.js).
export const ORDER_STATUS_TRANSITIONS = {
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["en_preparacion", "cancelado"],
  en_preparacion: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

export const getOrderStatusMeta = (status) =>
  ORDER_STATUS_META[status] || { label: status || "Sin estado", tone: "pendiente" };

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return DATE_FORMAT.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return DATETIME_FORMAT.format(date);
};

// Mensaje de error de la API: la mayoria de endpoints responden strings planos.
export const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  return fallback;
};
