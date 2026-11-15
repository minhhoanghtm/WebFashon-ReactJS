import trackingService from "./tracking.service.js";
import presenceService from "./presence.service.js";
import { successResponse } from "../../common/responses/index.js";
import { PRIVACY_POLICY_EFFECTIVE_DATE, PRIVACY_POLICY_VERSION } from "../../common/constants/privacyPolicy.js";
import dataSubjectService from "./dataSubject.service.js";

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
  async exportPersonalData(req, res, next) {
    try {
      const data = await dataSubjectService.exportData(req.user.userId, req.body.currentPassword);
      return successResponse(res, data, "Đã xuất dữ liệu cá nhân");
    } catch (error) { next(error); }
  }

  async createDataSubjectRequest(req, res, next) {
    try {
      const { type, currentPassword, reason } = req.body;
      if (!['ERASURE', 'RESTRICT', 'OBJECT'].includes(type)) {
        return res.status(400).json({ success: false, message: "Loại yêu cầu không hợp lệ" });
      }
      if (type === 'ERASURE') await dataSubjectService.erase(req.user.userId, currentPassword, reason);
      else await dataSubjectService.restrict(req.user.userId, currentPassword, type, reason);
      return successResponse(res, null, "Yêu cầu dữ liệu cá nhân đã được xử lý");
    } catch (error) { next(error); }
  }

  async listDataSubjectRequests(req, res, next) {
    try {
      return successResponse(res, await dataSubjectService.listRequests(req.user.userId));
    } catch (error) { next(error); }
  }

  async getPolicyMetadata(req, res, next) {
    try {
      return successResponse(res, {
        version: PRIVACY_POLICY_VERSION,
        effectiveDate: PRIVACY_POLICY_EFFECTIVE_DATE,
      }, "Lấy phiên bản chính sách thành công");
    } catch (error) {
      next(error);
    }
  }

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

  async getConsent(req, res, next) {
    try {
      const userId = req.user?.userId;
      const anonymousId = req.query.anonymous_id || req.headers["x-anonymous-id"] || null;
      const data = await trackingService.getConsent({ userId, anonymousId });
      return successResponse(res, data, "Lấy tùy chọn quyền riêng tư thành công");
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
      const choice = req.body.choice;
      const categories = req.body.categories;
      const policyVersion = req.body.policyVersion || req.body.policy_version;
      const source = req.body.source;

      const result = await trackingService.updateConsent({
        userId,
        anonymousId,
        consent,
        anonymousToken,
        choice,
        categories,
        policyVersion,
        source,
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

  // Real-time Presence & Observability Controllers
  async updatePresenceHeartbeat(req, res, next) {
    try {
      const result = await presenceService.updateHeartbeat(req.body, req.user);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async handlePresenceLeave(req, res, next) {
    try {
      const result = await presenceService.handleTabLeave(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async handlePresenceDisassociate(req, res, next) {
    try {
      const result = await presenceService.disassociateUserSession(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getLiveSessions(req, res, next) {
    try {
      const { statusFilter, routeFilter, limit } = req.query;
      const data = await presenceService.getLiveSessions({
        statusFilter,
        routeFilter,
        limit: limit ? parseInt(limit, 10) : 50,
      });
      return successResponse(res, data, "Lấy danh sách phiên trực tuyến thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * SSE Stream cho Real-time Observability trên Admin (Dự phòng cho WebSocket)
   */
  async streamLivePresence(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    let isClosed = false;

    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;
      clearInterval(interval);
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {}
      }
    };

    req.on("close", cleanup);
    req.on("end", cleanup);
    req.on("error", cleanup);
    res.on("error", cleanup);

    const safeWrite = (data) => {
      if (isClosed || res.writableEnded || res.destroyed) return;
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        cleanup();
      }
    };

    try {
      const initial = await presenceService.getLiveSessions({ limit: 100 });
      safeWrite({ type: "snapshot", data: initial });
    } catch {
      // ignore
    }

    const interval = setInterval(async () => {
      if (isClosed || res.writableEnded || res.destroyed) {
        clearInterval(interval);
        return;
      }
      try {
        const live = await presenceService.getLiveSessions({ limit: 100 });
        safeWrite({ type: "update", data: live });
      } catch {
        // ignore
      }
    }, 4000);
  }

  async getSessionTimeline(req, res, next) {
    try {
      const { sessionId } = req.params;
      const data = await presenceService.getSessionTimeline(sessionId);
      return successResponse(res, data, "Lấy dòng thời gian hành trình phiên thành công");
    } catch (error) {
      next(error);
    }
  }

  async getActivityAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await presenceService.getActivityAnalytics({ startDate, endDate });
      return successResponse(res, data, "Lấy thống kê hành vi và hiệu năng thành công");
    } catch (error) {
      next(error);
    }
  }
}

export default new TrackingController();
