import express from "express";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./category.controller.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", protectedRoute, adminOnly, createCategory);
router.put("/:id", protectedRoute, adminOnly, updateCategory);
router.delete("/:id", protectedRoute, adminOnly, deleteCategory);

export default router;
