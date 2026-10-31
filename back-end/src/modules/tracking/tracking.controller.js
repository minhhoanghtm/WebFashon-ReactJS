import trackingService from "./tracking.service.js";
import { successResponse } from "../../common/responses/index.js";

const normalizeIncomingEvent = (rawEvent, headerAnonymousId, headerSessionId) => {
  let eventType = (rawEvent.event_type || rawEvent.event_name || "").trim().toLowerCase();
  if (eventType === "checkout_start") eventType = "checkout_started";
  if (eventType === "purchase_done" || eventType === "purchase") eventType = "purchase_completed";
  if (eventType === "view_product") eventType = "product_view";
  if (eventType === "favorite") eventType = "product_favorite";
  if (eventType === "search") eventType = "search_performed";

  return {
    ...rawEvent,
    event_type: eventType,
    anonymous_id: rawEvent.anonymous_id || headerAnonymousId || null,
    session_id: rawEvent.session_id || headerSessionId || null,
    timestamp: rawEvent.timestamp || rawEvent.created_at || rawEvent.createdAt || new Date().toISOString(),
  };
};

class TrackingController {
  async trackEvent(req, res, next) {
    try {
      const headerAnon = req.headers["x-anonymous-id"] || null;
      const headerSess = req.headers["x-session-id"] || null;

      // Hỗ trợ cả nhận đơn lẻ và nhận theo lô (batch)
      if (Array.isArray(req.body.events)) {
        const batchEvents = req.body.events.map((ev) =>
          normalizeIncomingEvent(ev, headerAnon, headerSess)
        );
        const batchResult = await trackingService.recordBatchEvents(batchEvents, req.user);
        return res.status(202).json({
          success: true,
          message: "Batch events accepted",
          data: batchResult,
        });
      }

      const body = normalizeIncomingEvent(req.body, headerAnon, headerSess);

      const result = await trackingService.recordEvent(body, req.user);

      return res.status(202).json({
        success: true,
        message: "Event accepted",
        deduplicated: result.deduplicated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConsent(req, res, next) {
    try {
      const userId = req.user?.userId;
      const anonymousId = req.body.anonymous_id || req.headers["x-anonymous-id"] || null;
      const anonymousToken = req.body.anonymous_token || req.headers["x-anonymous-token"] || null;
      const consent = req.body.consent;

      const result = await trackingService.updateConsent({
        userId,
        anonymousId,
        consent,
        anonymousToken,
      });

      return successResponse(res, result, "Cập nhật tùy chọn quyền riêng tư thành công");
    } catch (error) {
      next(error);
    }
  }

  async getSearchHistory(req, res, next) {
    try {
      const userId = req.user?.userId;
      const history = await trackingService.getSearchHistory(userId, 10);
      return successResponse(res, history, "Lấy lịch sử tìm kiếm thành công");
    } catch (error) {
      next(error);
    }
  }

  async clearSearchHistory(req, res, next) {
    try {
      const userId = req.user?.userId;
      await trackingService.clearSearchHistory(userId);
      return successResponse(res, null, "Đã xóa lịch sử tìm kiếm thành công");
    } catch (error) {
      next(error);
    }
  }

  async clearUserTrackingData(req, res, next) {
    try {
      const userId = req.user?.userId || null;
      const anonymousId = req.body?.anonymous_id || req.headers["x-anonymous-id"] || null;
      const anonymousToken = req.body?.anonymous_token || req.headers["x-anonymous-token"] || null;

      if (!userId && !anonymousId) {
        return res.status(400).json({
          success: false,
          message: "Cần cung cấp tài khoản đăng nhập hoặc header x-anonymous-id để xóa dữ liệu",
        });
      }

      const result = await trackingService.clearUserTrackingData({
        userId,
        anonymousId,
        anonymousToken,
        reqUser: req.user,
      });
      return successResponse(res, result, "Đã xóa toàn bộ lịch sử hành vi của bạn thành công");
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsOverview(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await trackingService.getAnalyticsOverview({ startDate, endDate });
      return successResponse(res, data, "Lấy thống kê tổng quan hành vi thành công");
    } catch (error) {
      next(error);
    }
  }

  async getFunnelAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await trackingService.getFunnelAnalytics({ startDate, endDate });
      return successResponse(res, data, "Lấy phân tích phễu chuyển đổi thành công");
    } catch (error) {
      next(error);
    }
  }
}

export default new TrackingController();
