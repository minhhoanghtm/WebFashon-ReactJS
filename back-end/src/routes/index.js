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
<<<<<<< Updated upstream
=======
import favoriteRouter from "../modules/favorites/favorite.route.js";
import conversationRouter from "../modules/conversations/conversation.route.js";
import messageRouter from "../modules/messages/message.route.js";
>>>>>>> Stashed changes
import { pageRouter, adminPageRouter, lookbookRouter } from "../modules/pages/page.route.js";
import { pageSectionRouter, adminPageSectionRouter } from "../modules/pageSections/pageSection.routes.js";
import { protectedRoute, adminOnly } from "../middlewares/auth.middleware.js";

const rootRouter = express.Router();

// Public routes
rootRouter.use("/auth", authRouter);
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

// Private routes (strictly protected by auth middleware)
rootRouter.use("/user", protectedRoute, userRouter);
rootRouter.use("/cart", protectedRoute, cartRouter);
rootRouter.use("/cart_items", protectedRoute, cartItemRouter);
rootRouter.use("/order", protectedRoute, orderRouter);
rootRouter.use("/order_items", protectedRoute, orderItemRouter);
rootRouter.use("/payments", protectedRoute, paymentRouter);
rootRouter.use("/vouchers", protectedRoute, voucherRouter);
rootRouter.use("/conversations", protectedRoute, conversationRouter);
rootRouter.use("/messages", protectedRoute, messageRouter);

export default rootRouter;
