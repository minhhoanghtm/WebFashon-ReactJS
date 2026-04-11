import express from "express";
import {
    addProduct,
    deleteProduct,
    getAllProduct,
    getProductBySlug,
    updateProduct
} from "../controllers/productControllers.js";

const router = express.Router();

router.post("/", addProduct);
router.get("/", getAllProduct);
router.get("/:slug", getProductBySlug);
router.get("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;