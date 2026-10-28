const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");

// Variantes de precio de un diseno DTF.
// Ej: { tipo: "oversize", medidas: "20x30", color: "negra", precio: 65000 }
// El precio SIEMPRE se valida en el backend contra esta tabla: nunca se
// confia en el precio que envia el carrito.
const DtfPriceVariant = sequelize.define(
  "DtfPriceVariant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },

    dtfId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "dtfs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true },
    },

    // Pesos colombianos (entero), igual que articulos.cost
    precio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },

    medidas: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "dtf_price_variants",
    timestamps: true,
    indexes: [{ fields: ["dtfId"], name: "dtf_price_variants_dtf_id_idx" }],
  },
);

module.exports = { DtfPriceVariant };
