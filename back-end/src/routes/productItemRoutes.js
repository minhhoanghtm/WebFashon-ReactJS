import express from "express";
import {
    createProductVariant,
    deleteProductVariant,
    getProductVariantById,
    getProductVariantByProductId,
    updateProductVariant
} from "../controllers/productItemControllers.js";

const router = express.Router();

router.post("/", createProductVariant);
router.get("/:product_id", getProductVariantByProductId);
router.get("/:id", getProductVariantById);
router.put("/:id", updateProductVariant);
router.delete("/:id", deleteProductVariant);

export default router;
