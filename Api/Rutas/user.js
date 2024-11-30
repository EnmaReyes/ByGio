const express = require("express");
const { updateUser, userById } = require("../Controllers/user.js");

const router = express.Router();

router.get("/edit", userById);
router.put("/edit", updateUser);

module.exports = router;
