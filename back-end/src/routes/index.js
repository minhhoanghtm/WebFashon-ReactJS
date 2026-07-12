import express from "express";
import authRouter from "../modules/auth/auth.route.js";
import userRouter from "../modules/users/user.route.js";
import categoryRouter from "../modules/categories/category.route.js";
import { productRouter, productVariantRouter } from "../modules/products/product.route.js";
import reviewRouter from "../modules/reviews/review.route.js";
import { cartRouter, cartItemRouter } from "../modules/carts/cart.route.js";
import { orderRouter, orderItemRouter } from "../modules/orders/order.route.js";
import paymentRouter from "../modules/payments/payment.route.js";
import uploadRouter from "../modules/uploads/upload.route.js";
import voucherRouter from "../modules/vouchers/voucher.route.js";
import websiteSettingsRouter from "../modules/websiteSettings/websiteSettings.route.js";
import bannerRouter from "../modules/banners/banner.route.js";
import favoriteRouter from "../modules/favorites/favorite.route.js";
import { pageRouter, adminPageRouter, lookbookRouter } from "../modules/pages/page.route.js";
import { pageSectionRouter, adminPageSectionRouter } from "../modules/pageSections/pageSection.routes.js";
import {
  adminCommunicationRouter,
  customerCommunicationRouter,
} from "../modules/communication/communication.route.js";
import { protectedRoute, adminOnly, noAdmin } from "../middlewares/auth.middleware.js";
import { authGlobalLimiter } from "../middlewares/rateLimiter.middleware.js";
import shippingRouter from "../modules/shipping/shipping.routes.js";
import mongoose from "mongoose";
import { getRedisConnection } from "../configs/redis.js";

const rootRouter = express.Router();

<<<<<<< HEAD
// Health check endpoint
rootRouter.get("/health", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    let redisStatus = "disconnected";
    try {
      const redisClient = getRedisConnection();
      redisStatus = redisClient.status === "ready" || redisClient.status === "connect" ? "connected" : "disconnected";
    } catch (redisErr) {
      // Ignore redis retrieval errors
    }
    
    const isHealthy = mongoStatus === "connected" && redisStatus === "connected";
    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? "OK" : "ERROR",
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ status: "ERROR", message: error.message });
  }
=======
rootRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
>>>>>>> main
});

// Public routes
rootRouter.use("/auth", authGlobalLimiter, authRouter);
rootRouter.use("/categories", categoryRouter);
rootRouter.use("/products", productRouter);
rootRouter.use("/product_variants", productVariantRouter);
rootRouter.use("/reviews", reviewRouter);
rootRouter.use("/upload", uploadRouter);
rootRouter.use("/settings", websiteSettingsRouter);
rootRouter.use("/banners", bannerRouter);
rootRouter.use("/pages", pageRouter);
rootRouter.use("/lookbooks", lookbookRouter);
rootRouter.use("/page-sections", pageSectionRouter);
rootRouter.use("/admin/pages", protectedRoute, adminOnly, adminPageRouter);
rootRouter.use("/admin/page-sections", protectedRoute, adminOnly, adminPageSectionRouter);

// Private routes
rootRouter.use("/user", protectedRoute, userRouter);
rootRouter.use("/cart", protectedRoute, noAdmin, cartRouter);
rootRouter.use("/cart_items", protectedRoute, noAdmin, cartItemRouter);
rootRouter.use("/favorites", protectedRoute, favoriteRouter);
rootRouter.use("/order", protectedRoute, orderRouter);
rootRouter.use("/order_items", protectedRoute, orderItemRouter);
rootRouter.use("/payments", paymentRouter);
rootRouter.use("/vouchers", voucherRouter);

// Communication domain routes.
rootRouter.use("/admin", adminCommunicationRouter);
rootRouter.use("/chat", customerCommunicationRouter);


//Shipping domain routes
rootRouter.use("/shipping", shippingRouter);


export default rootRouter;
