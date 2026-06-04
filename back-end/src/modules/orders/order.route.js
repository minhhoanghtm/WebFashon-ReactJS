import express from "express";
import {
  createOrder,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  paymentOrder,
  paymentCallback,
  kpi,
  dashboardUser,
  getRevenueOverview,
  getOrderStats,
  getPurchasePerformance,
  createOrderItem,
  deleteOrderItem,
  getOrderItemsByOrderId,
  updateOrderItem,
} from "./order.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const orderRouter = express.Router();

orderRouter.get("/", getOrdersByUser);
orderRouter.post("/", createOrder);
orderRouter.put("/:id", updateOrder);
orderRouter.delete("/:id", deleteOrder);
orderRouter.post("/payment", paymentOrder);
orderRouter.get("/payment/callback", paymentCallback);

// Admin reports
orderRouter.get("/admin/kpi", adminOnly, kpi);
orderRouter.get("/admin/revenue", adminOnly, getRevenueOverview);
orderRouter.get("/admin/stats", adminOnly, getOrderStats);

// User metrics
orderRouter.get("/user/revenue", dashboardUser);
orderRouter.get("/user/purchasing_performance", getPurchasePerformance);

const orderItemRouter = express.Router();

orderItemRouter.get("/:order_id", getOrderItemsByOrderId);
orderItemRouter.post("/", createOrderItem);
orderItemRouter.put("/:id", updateOrderItem);
orderItemRouter.delete("/:id", deleteOrderItem);

export { orderRouter, orderItemRouter };
