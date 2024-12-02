const dotenv = require("dotenv");

dotenv.config();

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

const DB_HOST =
  process.env.NODE_ENV === "production" ? process.env.DB_HOST : "localhost";
const DB_USER =
  process.env.NODE_ENV === "production" ? process.env.DB_USER : "postgres";
const DB_NAME =
  process.env.NODE_ENV === "production" ? process.env.DB_NAME : "bygio";
const DB_PASSWORD =
  process.env.NODE_ENV === "production" ? process.env.DB_PASSWORD : "Enma2707";
const DB_PORT =
  process.env.NODE_ENV === "production" ? process.env.DB_PORT : 5432;
const DB_URL = process.env.NODE_ENV === "production" && process.env.DB_URL;

const DB_DIALECT = process.env.NODE_ENV === "production" ? "mysql" : "postgres";

module.exports = {
  FRONTEND_URL,
  DB_HOST,
  DB_USER,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_URL,
  DB_DIALECT,
};
