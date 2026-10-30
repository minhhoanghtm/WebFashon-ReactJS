import express from "express";
import rateLimit from "express-rate-limit";
import {
  protectedRoute,
  optionalProtectedRoute,
  adminOnly,
} from "../../middlewares/auth.middleware.js";
import {
  aiSearchSchema,
  aiChatSchema,
  aiSyncSchema,
  validateAiRequest,
} from "./ai.validator.js";
import {
  semanticSearchController,
  aiChatController,
  syncEmbeddingsController,
  getAiHealthController,
} from "./ai.controller.js";

const DISABLE_RATE_LIMIT_FOR_TESTS = process.env.DISABLE_RATE_LIMIT_FOR_TESTS === "true";

const createAiLimiter = (windowMs, max, message) => {
  if (DISABLE_RATE_LIMIT_FOR_TESTS || process.env.NODE_ENV === "test") {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      status: 429,
      message,
    },
  });
};

const aiSearchLimiter = createAiLimiter(
  60 * 1000,
  60,
  "Quá nhiều yêu cầu tìm kiếm AI. Vui lòng thử lại sau 1 phút."
);

const aiChatLimiter = createAiLimiter(
  60 * 1000,
  30,
  "Quá nhiều tin nhắn gửi tới AI. Vui lòng thử lại sau 1 phút."
);

const aiSyncLimiter = createAiLimiter(
  15 * 60 * 1000,
  10,
  "Quá nhiều yêu cầu đồng bộ dữ liệu Vector. Vui lòng thử lại sau."
);

const aiRouter = express.Router();

// Health & metrics check
aiRouter.get("/health", optionalProtectedRoute, getAiHealthController);

// Semantic Search (supports both POST /api/ai/search and GET /api/ai/search)
aiRouter.post(
  "/search",
  aiSearchLimiter,
  optionalProtectedRoute,
  validateAiRequest(aiSearchSchema, "auto"),
  semanticSearchController
);
aiRouter.get(
  "/search",
  aiSearchLimiter,
  optionalProtectedRoute,
  validateAiRequest(aiSearchSchema, "auto"),
  semanticSearchController
);

// RAG & Agentic AI Chat
aiRouter.post(
  "/chat",
  aiChatLimiter,
  optionalProtectedRoute,
  validateAiRequest(aiChatSchema, "body"),
  aiChatController
);

// Vector Synchronization (Admin Only)
aiRouter.post(
  "/embeddings/sync",
  aiSyncLimiter,
  protectedRoute,
  adminOnly,
  validateAiRequest(aiSyncSchema, "body"),
  syncEmbeddingsController
);

export default aiRouter;
