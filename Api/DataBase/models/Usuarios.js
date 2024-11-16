import { DataTypes } from "sequelize";
import { DB_DIALECT } from "../../config.js";
import { sequelize } from "../db.js";
import { Articulos } from "./Articulos.js";

// Configuración para el campo `id`
const idConfig = {
  type: DataTypes.UUID,
  primaryKey: true,
  allowNull: false,
};

// Establecer valor predeterminado dependiendo del dialecto
if (DB_DIALECT === "mysql" || DB_DIALECT === "postgres") {
  idConfig.defaultValue = DataTypes.UUIDV4; // UUID autogenerado
}

export const Usuarios = sequelize.define(
  "usuarios",
  {
    id: idConfig,
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
