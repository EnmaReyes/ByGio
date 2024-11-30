const { Sequelize } = require("sequelize");
const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
} = require("../config.js");

// Configuración de Sequelize
const sequelizeConfig = {
  host: DB_HOST,
  dialect: DB_DIALECT,
  port: DB_PORT,
};

// Instancia de Sequelize
const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  sequelizeConfig
);

// Probar la conexión
sequelize
  .authenticate()
  .then(() => console.log("Conexión exitosa con la base de datos"))
  .catch((err) => console.error("Error conectando con la base de datos:", err));
  module.exports = { sequelize };