const express = require("express");

const {
  addDtf,
  getDtf,
  updateDtf,
  getDtfByCategory,
} = require("../Controllers/dtf");

const router = express.Router();

router.get("/", getDtf);
router.get("/category", getDtfByCategory);
router.post("/add", addDtf);
router.put("/:id", updateDtf);

module.exports = router;
