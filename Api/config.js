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

const isProduction = process.env.NODE_ENV === "production";

const DB_DIALECT = process.env.DB_DIALECT || "postgres";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Interpreta flags tipo "true/1/yes/on". Sin valor -> fallback.
const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(
    String(value).trim().toLowerCase(),
  );
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
  GOOGLE_MAIL_FROM: process.env.GOOGLE_MAIL_FROM || "bygionay.88@gmail.com",

  // Ecommerce
  // Precios por defecto de las variantes DTF (pesos COP)
  DTF_PRICE_BASICO: toNumber(process.env.DTF_PRICE_BASICO, 22000),
  DTF_PRICE_OVERSIZE: toNumber(process.env.DTF_PRICE_OVERSIZE, 32000),

  // Punto de despacho para calcular la distancia de envio (Medellin)
  WAREHOUSE_LAT: toNumber(process.env.WAREHOUSE_LAT, 6.2442),
  WAREHOUSE_LNG: toNumber(process.env.WAREHOUSE_LNG, -75.5812),

  // Reserva de stock (bloqueo temporal durante el pago).
  // Apagada por defecto: con stock booleano esconde el producto de un carrito
  // abandonado y permite bloquear el catalogo creando pedidos. Se activara
  // cuando el stock sea por cantidad.
  STOCK_RESERVATION_ENABLED: toBool(
    process.env.STOCK_RESERVATION_ENABLED,
    false,
  ),

  // ---------------------------------------------------------------------
  // Wompi (pagos en linea, Web Checkout)
  //
  // Los valores reales NUNCA van al repositorio: van en Api/.env.local
  // (local) o en las Environment Variables del proyecto en Vercel.
  // Sin WOMPI_PUBLIC_KEY ni WOMPI_INTEGRITY_SECRET los endpoints de pago en
  // linea responden 503 y el checkout sigue funcionando con el flujo manual
  // (transferencia/Nequi por WhatsApp).
  // ---------------------------------------------------------------------
  WOMPI_PUBLIC_KEY: (process.env.WOMPI_PUBLIC_KEY || "").trim(),
  WOMPI_PRIVATE_KEY: (process.env.WOMPI_PRIVATE_KEY || "").trim(),
  WOMPI_INTEGRITY_SECRET: (process.env.WOMPI_INTEGRITY_SECRET || "").trim(),
  WOMPI_EVENTS_SECRET: (process.env.WOMPI_EVENTS_SECRET || "").trim(),

  // "test" (sandbox) | "prod". Si no se indica se deduce del prefijo de la
  // llave publica (pub_test_ / pub_prod_).
  WOMPI_ENV: (() => {
    const explicit = (process.env.WOMPI_ENV || "").trim().toLowerCase();
    if (explicit === "test" || explicit === "prod") return explicit;
    return (process.env.WOMPI_PUBLIC_KEY || "").includes("_test_")
      ? "test"
      : "prod";
  })(),

  // API de Wompi (consulta de transacciones). Se puede sobreescribir para
  // pruebas locales. El checkout se sirve siempre desde checkout.wompi.co.
  WOMPI_BASE_URL: (
    process.env.WOMPI_BASE_URL || ""
  ).trim() ||
    ((process.env.WOMPI_PUBLIC_KEY || "").includes("_test_")
      ? "https://sandbox.wompi.co/v1"
      : "https://production.wompi.co/v1"),

  WOMPI_CHECKOUT_URL: "https://checkout.wompi.co/p/",

  // Los eventos vencidos (replay de una peticion vieja) se rechazan. Wompi
  // reintenta sus eventos durante horas, por eso la ventana es amplia.
  // 0 desactiva la comprobacion.
  WOMPI_EVENT_MAX_AGE_SECONDS: toNumber(
    process.env.WOMPI_EVENT_MAX_AGE_SECONDS,
    86400,
  ),

  // ---------------------------------------------------------------------
  // Endurecimiento HTTP (Fase E)
  // ---------------------------------------------------------------------

  // Sin esto, detras del proxy de Vercel todos los requests llegan con la IP
  // del proxy y el rate limit acabaria bloqueando a todo el mundo a la vez.
  TRUST_PROXY: (() => {
    const raw = String(process.env.TRUST_PROXY ?? "").trim();
    if (raw === "") return isProduction ? 1 : false;
    if (raw === "false" || raw === "0") return false;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  })(),

  // Permite apagar los limites en pruebas de carga.
  RATE_LIMIT_ENABLED: toBool(process.env.RATE_LIMIT_ENABLED, true),
};
