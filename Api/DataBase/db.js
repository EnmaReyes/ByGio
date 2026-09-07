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
  },

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = { sequelize };