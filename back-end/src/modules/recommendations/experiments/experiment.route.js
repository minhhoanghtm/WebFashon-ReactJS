import express from "express";
import experimentController from "./experiment.controller.js";
import {
  protectedRoute,
  adminOnly,
  optionalProtectedRoute,
} from "../../../middlewares/auth.middleware.js";

const experimentRouter = express.Router();

// 1. Endpoint Storefront ghi nhận tiếp xúc thực tế (exposed) khi người dùng lướt tới khu vực gợi ý
experimentRouter.post(
  "/exposed",
  optionalProtectedRoute,
  experimentController.recordExposure
);

// 2. Admin Endpoints: Quản lý & Giám sát Thử nghiệm A/B
experimentRouter.get(
  "/",
  protectedRoute,
  adminOnly,
  experimentController.listExperiments
);

experimentRouter.post(
  "/",
  protectedRoute,
  adminOnly,
  experimentController.createExperiment
);

experimentRouter.get(
  "/:id",
  protectedRoute,
  adminOnly,
  experimentController.getExperiment
);

experimentRouter.put(
  "/:id",
  protectedRoute,
  adminOnly,
  experimentController.updateExperiment
);

experimentRouter.post(
  "/:id/toggle",
  protectedRoute,
  adminOnly,
  experimentController.toggleExperiment
);

experimentRouter.get(
  "/:id/analytics",
  protectedRoute,
  adminOnly,
  experimentController.getAnalytics
);

export default experimentRouter;
