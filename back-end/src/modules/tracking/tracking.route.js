import express from "express";
import trackingController from "./tracking.controller.js";
import {
  optionalProtectedRoute,
  protectedRoute,
  adminOnly,
} from "../../middlewares/auth.middleware.js";
import { eventTrackingLimiter } from "../../middlewares/rateLimiter.middleware.js";
import validate from "../../middlewares/validateZod.js";
import { trackEventSchema, updateConsentSchema } from "./tracking.validator.js";

const trackingRouter = express.Router();

// POST /api/events - Ghi nhận sự kiện người dùng (đơn lẻ hoặc theo lô)
trackingRouter.post(
  "/",
  eventTrackingLimiter,
  optionalProtectedRoute,
  validate(trackEventSchema),
  trackingController.trackEvent
);

// Hỗ trợ đường dẫn tường minh /track và /batch
trackingRouter.post(
  "/track",
  eventTrackingLimiter,
  optionalProtectedRoute,
  validate(trackEventSchema),
  trackingController.trackEvent
);

trackingRouter.post(
  "/batch",
  eventTrackingLimiter,
  optionalProtectedRoute,
  validate(trackEventSchema),
  trackingController.trackEvent
);

// POST /api/events/consent - Cập nhật trạng thái đồng ý theo dõi (Privacy & Consent)
trackingRouter.post(
  "/consent",
  optionalProtectedRoute,
  validate(updateConsentSchema),
  trackingController.updateConsent
);

// DELETE /api/events/me - Xóa toàn bộ lịch sử hành vi & profile người dùng (Quyền riêng tư)
trackingRouter.delete("/me", protectedRoute, trackingController.clearUserTrackingData);

// Analytics endpoints dành riêng cho Quản trị viên
trackingRouter.get(
  "/analytics/overview",
  protectedRoute,
  adminOnly,
  trackingController.getAnalyticsOverview
);

trackingRouter.get(
  "/analytics/funnel",
  protectedRoute,
  adminOnly,
  trackingController.getFunnelAnalytics
);

export default trackingRouter;
