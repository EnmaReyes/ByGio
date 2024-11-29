import express from "express";
import postRoutes from "./Rutas/posts.js";
import authRoutes from "./Rutas/auth.js";
import userRoutes from "./Rutas/user.js";
import { sequelize } from "./DataBase/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { FRONTEND_URL } from "./config.js";

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
async function main() {
  try {
    await sequelize.sync({ alter: false });
    app.listen(port, () => {
      console.log(`Conected!! app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
main();
