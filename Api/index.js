const express = require("express");
const postRoutes = require("./Rutas/posts.js");
const authRoutes = require("./Rutas/auth.js");
const userRoutes = require("./Rutas/user.js");
const bannerRoutes = require("./Rutas/banner.js");

const { sequelize } = require("./DataBase/db.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { FRONTEND_URL } = require("./config.js");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  }),
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "ByGio API funcionando correctamente 🚀",
  });
});

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/banner", bannerRoutes);

(async () => {
  try {
    console.log("🔌 Intentando conectar a Neon...");

    await sequelize.authenticate();

    console.log("✅ Conexión inicial exitosa");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
    }
  } catch (error) {
    console.error("❌ Error conectando con la base de datos:");
    console.error(error);
  }
})();

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
}

module.exports = app;
