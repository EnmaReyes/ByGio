import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";
import { v4 as uuidv4 } from 'uuid';


export const Articulos = sequelize.define(
  "articulos",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4 ,
      allowNull: false,
      primaryKey: true,
    },
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
