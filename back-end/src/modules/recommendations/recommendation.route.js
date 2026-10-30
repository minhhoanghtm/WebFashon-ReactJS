import express from "express";
import recommendationController from "./recommendation.controller.js";
import { optionalProtectedRoute } from "../../middlewares/auth.middleware.js";

const recommendationRouter = express.Router();

// GET /api/recommendations?limit=12
recommendationRouter.get("/", optionalProtectedRoute, recommendationController.getRecommendations);

export default recommendationRouter;
