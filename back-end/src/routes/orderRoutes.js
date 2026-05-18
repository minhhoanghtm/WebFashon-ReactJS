import express from "express";
import {
    createOrder,
    getOrdersByUser,
    updateOrder,
    deleteOrder,
    paymentOrder,
    kpi,
    dashboardUser,
    getRevenueOverview,
    getOrderStats,
    getPurchasePerformance,
    
} from "../controllers/orderControllers.js";
const router = express.Router();

router.get("/", getOrdersByUser);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
router.post("/payment", paymentOrder);
router.get("/admin/kpi", kpi);
router.get("/admin/revenue", getRevenueOverview);
router.get("/admin/stats", getOrderStats);
router.get("/user/revenue", dashboardUser);
router.get("/user/purchasing_performance", getPurchasePerformance);
export default router;