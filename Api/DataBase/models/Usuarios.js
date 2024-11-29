import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";
import { Articulos } from "./Articulos.js";
import { v4 as uuidv4 } from "uuid";

export const Usuarios = sequelize.define(
  "usuarios",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
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
