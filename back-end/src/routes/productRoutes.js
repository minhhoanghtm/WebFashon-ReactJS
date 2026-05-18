import express from "express";
import {
    addProduct,
    deleteProduct,
    getAllProduct,
    getProductByCategory,
    getProductBySlug,
    getProductDetail,
    getSlugByProductId,
    searchProducts,
    suggestProducts,
    updateProduct
} from "../controllers/productControllers.js";

const router = express.Router();

router.get("/suggestions", suggestProducts);
router.get("/search", searchProducts);
router.get("/category/:categoryid", getProductByCategory);
router.get("/detail/:id", getProductDetail);
// CRUD
router.post("/", addProduct);
router.get("/", getAllProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

router.get("/:slug", getProductBySlug);
router.get("/slug/:productId", getSlugByProductId);

export default router;