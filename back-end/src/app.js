import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.options("*", cors());
app.use(helmet()); // secure HTTP headers
app.use(mongoSanitize()); // prevent NoSQL injection

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
