const { Sequelize } = require("sequelize");

const { DATABASE_URL, DB_DIALECT } = require("../config.js");

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: DB_DIALECT || "postgres",
  dialectModule: require("pg"),

  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },

    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },

  pool: {
    max: 3,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
});

module.exports = { sequelize };