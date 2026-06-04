import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.options("*", cors());

// Payload parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Static resources mapping
app.use("/uploads", express.static("uploads"));

// REST APIs mapping
app.use("/api", rootRouter);

// Centralized error routing
app.use(errorHandler);

export default app;
