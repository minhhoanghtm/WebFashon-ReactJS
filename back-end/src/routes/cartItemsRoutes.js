import express from "express";
import {
    addCartItem,
    deleteCartItem,
    getCartItems,
    updateCartItem
} from "../controllers/cartItemController.js";

const router = express.Router();

router.get("/:cartId", getCartItems);
router.post("/", addCartItem);
router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

export default router;