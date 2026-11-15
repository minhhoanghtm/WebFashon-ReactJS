import express from "express";
import trackingController from "./tracking.controller.js";
import { optionalProtectedRoute, protectedRoute } from "../../middlewares/auth.middleware.js";
import { dataSubjectRequestLimiter } from "../../middlewares/rateLimiter.middleware.js";
import validate from "../../middlewares/validateZod.js";
import { updateConsentSchema } from "./tracking.validator.js";

const privacyRouter = express.Router();

// GET /api/privacy/policy - nguồn duy nhất cho phiên bản chính sách trên web
privacyRouter.get("/policy", trackingController.getPolicyMetadata);

// GET /api/privacy/consent - Lấy trạng thái đồng thuận
privacyRouter.get(
  "/consent",
  optionalProtectedRoute,
  trackingController.getConsent
);

// PUT /api/privacy/consent - Cập nhật tùy chọn quyền riêng tư
privacyRouter.put(
  "/consent",
  optionalProtectedRoute,
  validate(updateConsentSchema),
  trackingController.updateConsent
);

// POST /api/privacy/consent - Hỗ trợ POST
privacyRouter.post(
  "/consent",
  optionalProtectedRoute,
  validate(updateConsentSchema),
  trackingController.updateConsent
);

// Authenticated data-subject rights. Password re-authentication is required
// for export, restriction/objection, and erasure.
privacyRouter.post("/data-export", protectedRoute, dataSubjectRequestLimiter, trackingController.exportPersonalData);
privacyRouter.post("/data-requests", protectedRoute, dataSubjectRequestLimiter, trackingController.createDataSubjectRequest);
privacyRouter.get("/data-requests", protectedRoute, trackingController.listDataSubjectRequests);

// DELETE /api/privacy/data - Xóa lịch sử theo dõi
privacyRouter.delete(
  "/data",
  optionalProtectedRoute,
  trackingController.clearUserTrackingData
);

export default privacyRouter;
