import express from "express";
import {
  addArticle,
  deleteArticle,
  getArticleByID,
  getArticleByTitle,
  getArticle,
  updateArticle,
} from "../Controllers/posts.js";

const router = express.Router();

router.get("/", getArticle);
router.get("/search", getArticleByTitle);
router.get("/:id", getArticleByID);
router.post("/add", addArticle);
router.delete("/:id", deleteArticle);
router.put("/:id", updateArticle);

export default router;
