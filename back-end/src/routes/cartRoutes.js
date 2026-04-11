import express from "express";
import {
    addCart,
    deleteCart,
    getCart,
    updateCart
} from "../controllers/cartControllers.js";

const router = express.Router();

router.get("/", getCart);
router.post("/", addCart);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

export default router;