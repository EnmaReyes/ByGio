// config.js
if (process.env.NODE_ENV !== "production") {
  try {
    const dotenv = require("dotenv");
    dotenv.config(); // .env (plantilla versionada, sin secretos)
    // .env.local (NO versionado) tiene prioridad: aqui van los valores reales
    dotenv.config({ path: ".env.local", override: true });
  } catch (err) {
    console.warn("dotenv no disponible:", err.message);
  }
}

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

const DB_DIALECT = process.env.DB_DIALECT || "postgres";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

module.exports = {
  FRONTEND_URL,
  DATABASE_URL,
  DB_DIALECT,
  // Secreto JWT: en produccion DEBE venir de process.env.JWT_SECRET.
  JWT_SECRET: process.env.JWT_SECRET || "jwtkey",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",

  // Ecommerce
  // Precios por defecto de las variantes DTF (pesos COP)
  DTF_PRICE_BASICO: toNumber(process.env.DTF_PRICE_BASICO, 22000),
  DTF_PRICE_OVERSIZE: toNumber(process.env.DTF_PRICE_OVERSIZE, 32000),

  // Punto de despacho para calcular la distancia de envio (Medellin)
  WAREHOUSE_LAT: toNumber(process.env.WAREHOUSE_LAT, 6.2442),
  WAREHOUSE_LNG: toNumber(process.env.WAREHOUSE_LNG, -75.5812),
};
