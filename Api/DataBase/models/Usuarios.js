import { DataTypes } from "sequelize";
import { DB_DIALECT } from "../../config.js";
import { sequelize } from "../db.js";
import { Articulos } from "./Articulos.js";

const idConfig = {
  type: DataTypes.UUID,
  primaryKey: true,
  allowNull: false,
};

if (DB_DIALECT === "mysql") {
  idConfig.defaultValue = DataTypes.UUIDV4; // Para MySQL puedes usar UUID como CHAR(36)
}
export const Usuarios = sequelize.define(
  "usuarios",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id: idConfig,
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
