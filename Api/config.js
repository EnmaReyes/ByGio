// config.js
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (err) {
    console.warn("dotenv no disponible:", err.message);
  }
}

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

const DB_DIALECT = process.env.DB_DIALECT || "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (() => {
    const DB_HOST = process.env.DB_HOST || "localhost";
    const DB_USER = process.env.DB_USER || "postgres";
    const DB_PASSWORD = process.env.DB_PASSWORD || "password";
    const DB_NAME = process.env.DB_NAME || "ByGio";
    const DB_PORT = process.env.DB_PORT || 5432;

    return `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  })();

console.log(
  "DATABASE_URL:",
  DATABASE_URL?.replace(/:[^:@]+@/, ":****@")
);

console.log("DB_DIALECT:", DB_DIALECT);

module.exports = {
  FRONTEND_URL,
  DATABASE_URL,
  DB_DIALECT,
};
