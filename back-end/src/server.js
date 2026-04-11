import express from 'express';
import userRouters from './routes/userRouters.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productItemRoutes from './routes/productItemRoutes.js';
import cartItemsRouters from './routes/cartItemsRoutes.js';
import cartRouters from './routes/cartRoutes.js';
import orderItemRouters from './routes/orderItemsRoutes.js';
import orderRouters from './routes/orderRoutes.js';
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
const PORT = process.env.PORT || 5001;;

connectDB();
//middleware
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());
//public routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product_items", productItemRoutes);

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