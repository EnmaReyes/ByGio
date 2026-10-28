const express = require("express");
const { requireAuth } = require("../Middleware/auth.js");
const {
  create,
  list,
  detail,
  cancel,
} = require("../Controllers/orders.js");

const router = express.Router();

// Todos los endpoints de pedidos requieren sesion iniciada.
// Los invitados pueden ver el catalogo y el carrito, pero no comprar.
router.use(requireAuth);

router.post("/", create);
router.get("/", list);
router.get("/:id", detail);
router.post("/:id/cancel", cancel);

module.exports = router;
