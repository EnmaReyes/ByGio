const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");
const {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  SALE_CHANNEL,
  SALE_CHANNEL_VALUES,
  PAYMENT_METHOD_VALUES,
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

    // Puede ser NULL: las ventas externas (presencial/WhatsApp) se registran
    // a mano y no requieren una cuenta de usuario en la tienda.
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    // Canal por el que entro la venta: 'web' (checkout) o los externos que
    // registra un administrador.
    channel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: SALE_CHANNEL.WEB,
      validate: { isIn: [SALE_CHANNEL_VALUES] },
    },

    // Metodo de pago de las ventas manuales (efectivo, Nequi, ...). Null en
    // los pedidos web, que se cobran por Wompi.
    paymentMethod: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        // Se permite null; solo se valida cuando hay valor.
        isInOrNull(value) {
          if (value === null || value === undefined) return;
          if (!PAYMENT_METHOD_VALUES.includes(value)) {
            throw new Error("Método de pago inválido");
          }
        },
      },
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

    // Montos en pesos COP (enteros), igual que la tarifa de precios
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

    // Snapshot de envio. En ventas externas solo el nombre y el telefono son
    // obligatorios; el correo y la direccion pueden faltar (entrega en mano).
    recipientName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmailOrNull(value) {
          if (value === null || value === undefined) return;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error("Correo electrónico inválido");
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
      { fields: ["channel"], name: "orders_channel_idx" },
      { fields: ["createdAt"], name: "orders_created_at_idx" },
    ],
  },
);

module.exports = { Order };
