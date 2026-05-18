import express from "express";
import {
    createOrderItem,
    deleteOrderItem,
    getOrderItemsByOrderId,
    updateOrderItem
} from "../controllers/orderItemControllers.js";

const router = express.Router();

router.get("/:order_id", getOrderItemsByOrderId);
router.post("/", createOrderItem);
router.put("/:id", updateOrderItem);
router.delete("/:id", deleteOrderItem);

export default router;