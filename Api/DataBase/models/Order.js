const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");
const {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  CURRENCY,
} = require("./enums.js");

// Pedido. Los datos del comprador/envio son un snapshot: el pedido no
// depende de que el usuario o el producto sigan existiendo igual.
// status (logistico) y paymentStatus (pago) viven separados a proposito.
const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },

    orderNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ORDER_STATUS.PENDIENTE_PAGO,
      validate: { isIn: [ORDER_STATUS_VALUES] },
    },

    paymentStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: PAYMENT_STATUS.PENDIENTE,
      validate: { isIn: [PAYMENT_STATUS_VALUES] },
    },

    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: CURRENCY,
    },

    // Montos en pesos COP (enteros), igual que articulos.cost
    subtotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    shippingCost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    discountTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },

    // Snapshot de envio
    recipientName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // 'medellin' | 'antioquia' | 'nacional' — determina la tarifa de envio
    shippingZone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Logistica / seguimiento
    trackingCarrier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Stock booleano reservado con expiracion (sin cantidades)
    stockReservedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    indexes: [
      { fields: ["userId"], name: "orders_user_id_idx" },
      { fields: ["status"], name: "orders_status_idx" },
      { fields: ["paymentStatus"], name: "orders_payment_status_idx" },
      { fields: ["createdAt"], name: "orders_created_at_idx" },
    ],
  },
);

module.exports = { Order };
