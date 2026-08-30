// DataBase/db.js
const { Sequelize } = require("sequelize");
const { DATABASE_URL, DB_DIALECT } = require("../config.js");

const sequelizeOptions = {
  dialect: DB_DIALECT || "postgres",
  logging: false,
  dialectOptions: {},
};

if (process.env.NODE_ENV === "production") {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = new Sequelize(DATABASE_URL, sequelizeOptions);

sequelize
  .authenticate()
  .then(() => console.log("Conexión exitosa con la base de datos"))
  .catch((err) => console.error("Error conectando con la base de datos:", err));

module.exports = { sequelize };
