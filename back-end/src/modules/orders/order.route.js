import express from "express";
import {
  guestOrderLookup,
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
  getAdminOrders,
  updateOrderStatus,
  getOrderPayment,
  updateGuestOrder,
  deleteGuestOrder,
  payGuestOrder,
} from "./order.controller.js";
import { protectedRoute, adminOnly, noAdmin } from "../../middlewares/auth.middleware.js";
import { validateUpdateOrderStatus } from "./order.validator.js";

const orderRouter = express.Router();

orderRouter.get("/guest-lookup", guestOrderLookup);
orderRouter.post("/guest-lookup", guestOrderLookup);
orderRouter.get("/", protectedRoute, noAdmin, getOrdersByUser);
orderRouter.post("/", noAdmin, createOrder);
orderRouter.put("/guest/:id", updateGuestOrder);
orderRouter.delete("/guest/:id", deleteGuestOrder);
orderRouter.post("/guest/:id/payment", payGuestOrder);
orderRouter.put("/:id", protectedRoute, noAdmin, updateOrder);
orderRouter.delete("/:id", protectedRoute, noAdmin, deleteOrder);
orderRouter.post("/payment", protectedRoute, noAdmin, paymentOrder);
orderRouter.get("/payment/callback", noAdmin, paymentCallback);
orderRouter.get("/:id/payment", protectedRoute, noAdmin, getOrderPayment);

// Admin reports
orderRouter.get("/admin/kpi", protectedRoute, adminOnly, kpi);
orderRouter.get("/admin/revenue", protectedRoute, adminOnly, getRevenueOverview);
orderRouter.get("/admin/stats", protectedRoute, adminOnly, getOrderStats);
orderRouter.get("/admin/orders", protectedRoute, adminOnly, getAdminOrders);
orderRouter.patch("/admin/orders/:id/status", protectedRoute, adminOnly, validateUpdateOrderStatus, updateOrderStatus);
// User metrics
orderRouter.get("/user/revenue", dashboardUser);
orderRouter.get("/user/purchasing_performance", getPurchasePerformance);

const orderItemRouter = express.Router();

orderItemRouter.get("/:order_id", protectedRoute, getOrderItemsByOrderId);
orderItemRouter.post("/", noAdmin, createOrderItem);
orderItemRouter.put("/:id", noAdmin, updateOrderItem);
orderItemRouter.delete("/:id", noAdmin, deleteOrderItem);

export { orderRouter, orderItemRouter };
