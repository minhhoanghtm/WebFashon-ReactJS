import express from "express";
import {
    createOrderItem,
    deleteOrderItem,
    getOrderItemsByOrder,
    updateOrderItem
} from "../controllers/orderItemControllers.js";

const router = express.Router();

router.get("/", getOrderItemsByOrder);
router.post("/", createOrderItem);
router.put("/:id", updateOrderItem);
router.delete("/:id", deleteOrderItem);

export default router;