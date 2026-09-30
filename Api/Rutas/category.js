const express = require("express");
const { addCategory, updateCategory, getCategories } = require("../Controllers/category.js");
const router = express.Router();

router.post("/addcategory", addCategory);
router.put("/updatecategory/:id", updateCategory);
router.get("/", getCategories);

module.exports = router;
