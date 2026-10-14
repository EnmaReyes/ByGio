const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { Articulos } = require("./Articulos.js");

const { v4: uuidv4 } = require("uuid");
const { Dtf } = require("./Dtf.js");

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
      // Nullable: las cuentas sociales no tienen username. El registro
      // tradicional lo sigue exigiendo a nivel de aplicacion.
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      // Nullable: las cuentas sociales no tienen password local.
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
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
  },
);

// Relaciones a Articulos
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
