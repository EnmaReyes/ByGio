const express = require("express");
const { register, login, logout, me } = require("../Controllers/auth.js");
const { googleLogin, facebookLogin } = require("../Controllers/socialAuth.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);

module.exports = router;
