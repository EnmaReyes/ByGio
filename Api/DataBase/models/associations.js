// Asociaciones de los modelos del ecommerce.
//
// Se definen en un solo lugar para evitar el problema de los modelos
// actuales (asociaciones como efecto secundario del orden de importacion).
// Los modelos nuevos NO se importan entre si; solo este archivo los cruza.
//
// Las asociaciones historicas (Usuarios<->Articulos, Usuarios<->Banner,
// Category<->Dtf) siguen en sus propios archivos para no cambiar
// comportamiento existente.

const { Usuarios } = require("./Usuarios.js");
const { Order } = require("./Order.js");
const { OrderItem } = require("./OrderItem.js");
const { Payment } = require("./Payment.js");
const { OrderStatusHistory } = require("./OrderStatusHistory.js");

// ------------------------------- Pedidos -------------------------------
Usuarios.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
  sourceKey: "id",
});

Order.belongsTo(Usuarios, {
  foreignKey: "userId",
  as: "user",
  targetKey: "id",
});

Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

Order.hasMany(Payment, {
  foreignKey: "orderId",
  as: "payments",
});

Payment.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

Order.hasMany(OrderStatusHistory, {
  foreignKey: "orderId",
  as: "history",
});

OrderStatusHistory.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

OrderStatusHistory.belongsTo(Usuarios, {
  foreignKey: "changedByUserId",
  as: "changedBy",
});

// Los precios ya no cuelgan de un DTF: se resuelven desde price_variants
// (tarifa global) y product_prices (excepciones/combos). Los pedidos guardan
// su propio priceSnapshot, por eso OrderItem no tiene asociacion de precio.

module.exports = {
  Usuarios,
  Order,
  OrderItem,
  Payment,
  OrderStatusHistory,
};
