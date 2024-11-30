const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { Articulos } = require("./Articulos.js");
const { v4: uuidv4 } = require("uuid");

const Usuarios = sequelize.define(
  "usuarios",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    image: {
      type: DataTypes.TEXT,
    },
    name: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  }
);

// Relaciones
Usuarios.hasMany(Articulos, {
  foreignKey: "uid",
  as: "user",
  sourceKey: "id",
});

Articulos.belongsTo(Usuarios, {
  foreignKey: "uid",
  as: "user",
  targetKey: "id",
});
module.exports = { Usuarios };
