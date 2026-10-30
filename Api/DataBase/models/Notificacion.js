const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");

// Notificacion por usuario. Se genera desde el backend ante eventos de
// pedidos y de la cuenta, para que el panel muestre novedades sin
// depender del navegador.
const Notificacion = sequelize.define(
  "Notificacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    tipo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "cuenta",
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    to: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    leida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Clave de deduplicacion: si se repite el mismo evento, la
    // notificacion existente se conserva (no se duplica).
    clave: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "notificaciones",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["userId", "createdAt"], name: "notificaciones_user_created_idx" },
      { fields: ["userId", "leida"], name: "notificaciones_user_leida_idx" },
    ],
  },
);

module.exports = { Notificacion };
