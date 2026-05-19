import express from 'express';
import cors from 'cors';
import userRouters from './routes/userRouters.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productItemRoutes from './routes/productItemRoutes.js';
import cartItemsRouters from './routes/cartItemsRoutes.js';
import cartRouters from './routes/cartRoutes.js';
import orderItemRouters from './routes/orderItemsRoutes.js';
import orderRouters from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoute from './routes/uploadRoute.js';
import {
    connectDB
} from './config/db.js';
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js"
import cookieParser from 'cookie-parser';
import {
    protectedRoute
} from './middleware/authMiddlewares.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
].filter(Boolean);



// Wrap in async IIFE to await database connection
(async () => {
    try {
        await connectDB();
        
        //middleware - CORS must be first
        app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        "http://localhost:3000"
    ],
    credentials: true
}));
        app.options('*', cors());

        // Larger payload support (e.g. product forms with image URLs)
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({
            extended: true,
            limit: '10mb',
        }));
        app.use(cookieParser());
        //public routes
        app.use("/uploads", express.static("uploads"));
        app.use("/api/upload", uploadRoute);
        app.use("/api/auth", authRoutes);
        app.use("/api/categories", categoryRoutes);
        app.use("/api/products", productRoutes);
        app.use("/api/product_variants", productItemRoutes);
        app.use("/api/reviews", reviewRoutes); //chi co get duoc public
        //private routes
        app.use(protectedRoute);
        app.use("/api/user", userRouters);
        app.use("/api/cart", cartRouters);
        app.use("/api/cart_items", cartItemsRouters);
        app.use("/api/order", orderRouters);
        app.use("/api/order_items", orderItemRouters);

        app.listen(PORT, () => {
            console.log(`Server is running PORT: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
})();