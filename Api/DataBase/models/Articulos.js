import { DataTypes } from "sequelize";
import { DB_DIALECT } from "../../config.js";
import { sequelize } from "../db.js";

const idConfig = {
  type: DataTypes.UUID,
  primaryKey: true,
  allowNull: false,
};

if (DB_DIALECT === "mysql") {
  idConfig.defaultValue = DataTypes.UUIDV4;
}

export const Articulos = sequelize.define(
  "articulos",
  {
    id: idConfig,
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    img: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
    sizes: {
      type: DataTypes.JSON,
      defaultValue: ["S", "M", "L"],
    },
    oversize: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);
