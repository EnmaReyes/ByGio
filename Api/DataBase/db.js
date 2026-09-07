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
});

module.exports = { sequelize };