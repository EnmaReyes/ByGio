const express = require("express");
const {
  addArticle,
  deleteArticle,
  getArticleByID,
  getArticleByTitle,
  getArticle,
  updateArticle,
} = require("../Controllers/posts.js");

const router = express.Router();

router.get("/", getArticle);
router.get("/search", getArticleByTitle);
router.get("/:id", getArticleByID);
router.post("/add", addArticle);
router.delete("/:id", deleteArticle);
router.put("/:id", updateArticle);

module.exports = router;
