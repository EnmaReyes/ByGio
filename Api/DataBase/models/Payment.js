const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");
const { PAYMENT_STATUS, PAYMENT_STATUS_VALUES, CURRENCY } = require("./enums.js");

// Pago asociado a un pedido. Un pedido puede tener varios intentos de pago,
// pero solo uno aprobado.
//
// Idempotencia: reference y providerTransactionId son UNIQUE. Si Wompi
// reenvia el mismo evento (lo hace), el segundo INSERT falla y se trata
// como evento ya procesado.
const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },

    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    provider: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "wompi",
    },

    // Referencia enviada a Wompi (unica por intento)
    reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    // id de la transaccion en Wompi (unico -> idempotencia del webhook)
    providerTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: PAYMENT_STATUS.PENDIENTE,
      validate: { isIn: [PAYMENT_STATUS_VALUES] },
    },

    // Wompi maneja centavos: total COP * 100
    amountInCents: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: { min: 1 },
    },

    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: CURRENCY,
    },

    paymentMethodType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Estado crudo reportado por Wompi (APPROVED, DECLINED, VOIDED, ERROR...)
    wompiStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Payload original del webhook / consulta de transaccion
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    indexes: [
      { fields: ["orderId"], name: "payments_order_id_idx" },
      { fields: ["status"], name: "payments_status_idx" },
    ],
  },
);

module.exports = { Payment };
