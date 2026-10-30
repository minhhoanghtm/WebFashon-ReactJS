import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import logger from "./common/logger.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Trust reverse proxy (Nginx) for accurate client IP detection & rate limiting
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].filter(Boolean);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Match any localhost or 127.0.0.1 port in dev
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-anonymous-id",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
); // secure HTTP headers
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
