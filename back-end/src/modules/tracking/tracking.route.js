import express from "express";
import trackingController from "./tracking.controller.js";
import {
  optionalProtectedRoute,
  protectedRoute,
  adminOnly,
} from "../../middlewares/auth.middleware.js";
import { eventTrackingLimiter } from "../../middlewares/rateLimiter.middleware.js";
import validate from "../../middlewares/validateZod.js";
import {
  trackEventSchema,
  updateConsentSchema,
  presenceHeartbeatSchema,
  presenceLeaveSchema,
  presenceDisassociateSchema,
} from "./tracking.validator.js";

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

// GET /api/events/consent - Lấy trạng thái đồng thuận hiện tại
trackingRouter.get(
  "/consent",
  optionalProtectedRoute,
  trackingController.getConsent
);

// POST & PUT /api/events/consent - Cập nhật trạng thái đồng ý theo dõi (Privacy & Consent)
trackingRouter.post(
  "/consent",
  optionalProtectedRoute,
  validate(updateConsentSchema),
  trackingController.updateConsent
);

trackingRouter.put(
  "/consent",
  optionalProtectedRoute,
  validate(updateConsentSchema),
  trackingController.updateConsent
);

// DELETE /api/events/me - Xóa toàn bộ lịch sử hành vi & profile người dùng (Quyền riêng tư - hỗ trợ cả User và Guest)
trackingRouter.delete("/me", optionalProtectedRoute, trackingController.clearUserTrackingData);

// Real-time Presence & Observability endpoints
trackingRouter.post(
  "/presence/heartbeat",
  optionalProtectedRoute,
  validate(presenceHeartbeatSchema),
  trackingController.updatePresenceHeartbeat
);

trackingRouter.post(
  "/presence/leave",
  optionalProtectedRoute,
  validate(presenceLeaveSchema),
  trackingController.handlePresenceLeave
);

trackingRouter.post(
  "/presence/disassociate",
  optionalProtectedRoute,
  validate(presenceDisassociateSchema),
  trackingController.handlePresenceDisassociate
);

trackingRouter.get(
  "/presence/live",
  protectedRoute,
  adminOnly,
  trackingController.getLiveSessions
);

trackingRouter.get(
  "/presence/stream",
  protectedRoute,
  adminOnly,
  trackingController.streamLivePresence
);

trackingRouter.get(
  "/presence/session/:sessionId",
  protectedRoute,
  adminOnly,
  trackingController.getSessionTimeline
);

trackingRouter.get(
  "/analytics/activity",
  protectedRoute,
  adminOnly,
  trackingController.getActivityAnalytics
);

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
