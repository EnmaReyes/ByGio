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
  })
);
app.use(cookieParser());

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/banner", bannerRoutes);

async function main() {
  try {
    await sequelize.sync({ alter: true });
    app.listen(port, () => {
      console.log(`Conected!! app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
main();
