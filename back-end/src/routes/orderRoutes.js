import express from "express";
import {
    createOrder,
    getOrdersByUser,
    updateOrder,
    deleteOrder
} from "../controllers/orderControllers.js";
const router = express.Router();

router.get("/:userId", getOrdersByUser);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;