const express = require("express");
const {
  addDtf,
  getDtf,
  updateDtf,
  getDtfByCategory,
} = require("../Controllers/dtf");

const router = express.Router();

router.post("/add", addDtf);
router.get("/", getDtf);
router.put("/:id", updateDtf);
router.get("/category", getDtfByCategory);

module.exports = router;
