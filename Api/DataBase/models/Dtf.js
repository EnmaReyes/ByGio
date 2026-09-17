const { DataTypes } = require("sequelize");
const { sequelize } = require("../db.js");
const { v4: uuidv4 } = require("uuid");

const Dtf = sequelize.define(
  "Dtf",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
    },
    category: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    img: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8000,
    },
    costwithShirtOversize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 32000,
    },
    costwithShirt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 22000,
    },
    stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
module.exports = { Dtf };
