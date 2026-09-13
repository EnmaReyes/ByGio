const { Sequelize } = require("sequelize");
const { DATABASE_URL, DB_DIALECT } = require("../config.js");

const isProduction = process.env.NODE_ENV === "production";

const options = {
  dialect: DB_DIALECT || "postgres",
  dialectModule: require("pg"),
  logging: false,

  pool: {
    max: isProduction ? 3 : 5,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
};

if (isProduction) {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
}

const sequelize = new Sequelize(DATABASE_URL, options);

module.exports = { sequelize };