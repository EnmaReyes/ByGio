const express = require("express");
const postRoutes = require("./Rutas/posts.js");
const authRoutes = require("./Rutas/auth.js");
const userRoutes = require("./Rutas/user.js");
const bannerRoutes = require("./Rutas/banner.js");
const dtfRoutes = require("./Rutas/dtf.js");
const categoryRoutes = require("./Rutas/category.js");
const ordersRoutes = require("./Rutas/orders.js");
const shippingRoutes = require("./Rutas/shipping.js");
const adminOrdersRoutes = require("./Rutas/adminOrders.js");
const pricesRoutes = require("./Rutas/prices.js");

const { sequelize } = require("./DataBase/db.js");
const { ensurePricingSchema } = require("./DataBase/ensurePricing.js");

// Carga todos los modelos y asociaciones antes de cualquier consulta/sync.
require("./DataBase/models/index.js");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const { FRONTEND_URL } = require("./config.js");

const port = process.env.PORT || 3000;

const app = express();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Neon puede tardar unos segundos en despertar tras scale-to-zero. Un solo
// intento de 10s puede fallar en el primer request; reintentamos con backoff.
const connectWithRetry = async (attempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      return;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) break;

      // Limpia la conexión rota antes de volver a intentar.
      try {
        await sequelize.connectionManager.close();
      } catch {
        // Si no hay nada que cerrar, seguimos con el reintento.
      }

      const wait = 1000 * attempt;
      console.warn(
        `⚠️ Conexión a la base falló (intento ${attempt}/${attempts}). Reintentando en ${wait}ms...`,
      );
      await sleep(wait);
    }
  }

  throw lastError;
};

// Inicializacion de la base de datos. Se espera antes de atender cualquier
// request: en Vercel el modulo puede recibir trafico apenas arranca.
const dbReady = (async () => {
  console.log("🔌 Intentando conectar a Neon...");

  await connectWithRetry();
  console.log("✅ Conexión inicial exitosa");

  // Solo desarrollo: crea tablas que falten. No elimina columnas viejas.
  if (process.env.NODE_ENV !== "production") {
    await sequelize.sync();
  }

  // Local y produccion: migracion idempotente del esquema de precios.
  await ensurePricingSchema();
})();

// Evita un unhandled rejection si la base falla antes del primer request.
dbReady.catch((error) => {
  console.error("❌ Error inicializando la base de datos:", error);
});

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    console.error("❌ Base de datos no disponible:", error);
    res.status(503).json("Base de datos no disponible");
  }
});

// Middlewares
app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  }),
);

app.use(cookieParser());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    message: "ByGio API funcionando correctamente 🚀",
  });
});

// Rutas
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/dtf", dtfRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/prices", pricesRoutes);

// Servidor local: se escucha solo cuando la base ya esta lista.
if (process.env.NODE_ENV !== "production") {
  dbReady
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error("❌ No se pudo iniciar el servidor:", error);
      process.exit(1);
    });
}

module.exports = app;
