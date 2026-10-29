const { Sequelize } = require("sequelize");
const { DATABASE_URL, DB_DIALECT } = require("../config.js");

const isProduction = process.env.NODE_ENV === "production";

const options = {
  dialect: DB_DIALECT || "postgres",
  dialectModule: require("pg"),
  logging: false,

  pool: {
    // En Vercel cada instancia abre su propio pool. Mantenerlo pequeño evita
    // agotar las conexiones de Neon mientras varias funciones arrancan.
    max: isProduction ? 2 : 5,
    min: 0,
    idle: isProduction ? 5000 : 10000,
    acquire: 30000,
  },
};

if (isProduction) {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    // Neon puede tardar en despertar tras scale-to-zero. La app reintenta
    // la conexion; cada intento no debe quedarse colgado 30s.
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  // Aviso util: en Vercel conviene usar la cadena "pooled" de Neon
  // (host con -pooler), no la conexion directa.
  try {
    const host = new URL(DATABASE_URL).hostname;
    if (!host.includes("-pooler")) {
      console.warn(
        "⚠️ DATABASE_URL no parece ser la cadena pooled de Neon. En Vercel usa la URL con -pooler para evitar timeouts de conexión.",
      );
    }
  } catch {
    // Si DATABASE_URL no es una URL válida, Sequelize mostrará el error real.
  }
}

const sequelize = new Sequelize(DATABASE_URL, options);

module.exports = { sequelize };