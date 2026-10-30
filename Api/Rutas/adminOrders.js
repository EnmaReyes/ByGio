const express = require("express");
const { requireAuth, requireAdmin } = require("../Middleware/auth.js");
const {
  list,
  stats,
  detail,
  changeStatus,
  tracking,
  sales,
} = require("../Controllers/adminOrders.js");

const router = express.Router();

// Panel de administracion: toda la seccion exige sesion + rol admin.
router.use(requireAuth, requireAdmin);

// /stats va antes de /:id para que no lo capture el parametro.
router.get("/stats", stats);
router.get("/ventas", sales);
router.get("/", list);
router.get("/:id", detail);
router.patch("/:id/status", changeStatus);
router.patch("/:id/tracking", tracking);

module.exports = router;
