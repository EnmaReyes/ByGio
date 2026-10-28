const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");

const Articulos = sequelize.define(
  "articulos",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    img: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
    sizes: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: true,
    },
    oversize: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    descuento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    destacadas: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Articulo que se vende como combo (precio/conjunto especial)
    combo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Autor del articulo. Se declara explicitamente: antes solo existia como
    // efecto secundario de la asociacion belongsTo en Usuarios.js, lo que
    // hacia que el filtro por uid dependiera del orden de importacion.
    uid: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },

  {
    timestamps: false,
  },
);
module.exports = { Articulos };
