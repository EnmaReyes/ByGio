import { DataTypes } from "sequelize";
import { DB_DIALECT } from "../../config.js";
import { sequelize } from "../db.js";

const idConfig = {
  type: DataTypes.UUID,
  primaryKey: true,
  allowNull: false,
};

// Establecer valor predeterminado dependiendo del dialecto
if (DB_DIALECT === "mysql" || DB_DIALECT === "postgres") {
  idConfig.defaultValue = DataTypes.UUIDV4; // UUID autogenerado
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
      allowNull: false,
      defaultValue: true,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      
    },
    stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
  }
);
