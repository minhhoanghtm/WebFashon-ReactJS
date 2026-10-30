import express from "express";
import trackingController from "./tracking.controller.js";
import { protectedRoute } from "../../middlewares/auth.middleware.js";

const searchHistoryRouter = express.Router();

// GET /api/search/history - Trả về 10 từ khóa tìm kiếm gần nhất không trùng
searchHistoryRouter.get("/history", protectedRoute, trackingController.getSearchHistory);

// DELETE /api/search/history - Xóa lịch sử tìm kiếm và điểm từ khóa
searchHistoryRouter.delete("/history", protectedRoute, trackingController.clearSearchHistory);

export default searchHistoryRouter;
