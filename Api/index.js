import express from "express"
import { sequelize } from "./DataBase/db.js";
const port = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {
  res.send("hola mundo!");
});

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
