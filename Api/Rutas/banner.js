const express = require("express");
const {
  getBanner,
  addBanner,
  EditBanner,
  deleteBanner,
} = require("../Controllers/banner.js");

const router = express.Router();

router.post("/addbanner", addBanner);
router.put("/:id", EditBanner);
router.delete("/:id", deleteBanner);
router.get("/", getBanner);

module.exports = router;
