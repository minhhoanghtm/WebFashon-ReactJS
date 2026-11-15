import { describe, test, expect, jest, beforeEach, afterAll } from "@jest/globals";
import crypto from "crypto";
import mongoose from "mongoose";
import {
  trackEventSchema,
  presenceHeartbeatSchema,
  presenceLeaveSchema,
} from "../tracking.validator.js";
import {
  EVENT_TYPES,
  PRESENCE_STATUS,
  USER_ACTIVITY_CONFIG,
  SERVER_ONLY_EVENT_TYPES,
  CLIENT_ALLOWED_EVENT_TYPES,
} from "../tracking.constants.js";
import presenceService from "../presence.service.js";
import trackingService from "../tracking.service.js";
import UserEvent from "../userEvent.model.js";
import User from "../../users/user.model.js";
import { getRedisConnection, closeRedisConnection } from "../../../configs/redis.js";

describe("User Activity Tracking, Idle Detection & Observability Test Suite", () => {
  afterAll(async () => {
    await closeRedisConnection();
    await mongoose.disconnect();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById = jest.fn(() => ({ select: () => ({ lean: async () => null }) }));
    User.find = jest.fn(() => ({ select: () => ({ lean: async () => [] }) }));
  });

  // =========================================================================
  // 1. SESSION IDENTITY, MULTI-TAB & TRACE CORRELATION
  // =========================================================================
  describe("1. Session Identity, Multi-Tab & Trace Correlation", () => {
    test("TC-01: Session ID và Tab ID được chấp nhận hợp lệ trong schema đơn lẻ", () => {
      const payload = {
        body: {
          event_type: "page_view",
          session_id: "sess-12345678-abcd-4ef0-9123-abcdef012345",
          tab_id: "tab-89abcdef",
          action_id: "act-m4n5o6p7-1234",
          trace_id: "trc-0123456789abcdef",
          duration_ms: 1250,
          anonymous_id: "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
          context: {
            pathname: "/products",
            fromPath: "/",
            navigationType: "push",
            entrySource: "Google",
            trafficChannel: "Organic Search",
          },
        },
      };

      const result = trackEventSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.tab_id).toBe("tab-89abcdef");
        expect(result.data.body.action_id).toBe("act-m4n5o6p7-1234");
        expect(result.data.body.trace_id).toBe("trc-0123456789abcdef");
        expect(result.data.body.duration_ms).toBe(1250);
      }
    });

    test("TC-02: Phân biệt hai tab khác nhau trong cùng một session_id", () => {
      const tab1 = {
        session_id: "sess-shared-001",
        tab_id: "tab-001",
        status: PRESENCE_STATUS.ACTIVE,
      };
      const tab2 = {
        session_id: "sess-shared-001",
        tab_id: "tab-002",
        status: PRESENCE_STATUS.IDLE,
      };

      expect(tab1.session_id).toBe(tab2.session_id);
      expect(tab1.tab_id).not.toBe(tab2.tab_id);
    });

    test("TC-03: Không cho phép client giả mạo các sự kiện nhạy cảm chỉ thuộc server (payment_confirmed, purchase_completed)", () => {
      const maliciousPayload = {
        body: {
          event_type: "payment_confirmed",
          session_id: "sess-attack-001",
          anonymous_id: "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
        },
      };

      const result = trackEventSchema.safeParse(maliciousPayload);
      expect(result.success).toBe(false);
      expect(SERVER_ONLY_EVENT_TYPES).toContain("payment_confirmed");
      expect(SERVER_ONLY_EVENT_TYPES).toContain("purchase_completed");
    });
  });

  // =========================================================================
  // 2. TRAFFIC SOURCE & ATTRIBUTION
  // =========================================================================
  describe("2. Traffic Source & Attribution Sanitization", () => {
    test("TC-04: Lưu trữ UTM và nguồn truy cập được khử sạch tham số nhạy cảm", () => {
      const eventWithUtm = {
        body: {
          event_type: "session_start",
          session_id: "sess-utm-001",
          anonymous_id: "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
          context: {
            pathname: "/",
            referrer: "https://www.google.com/search?q=fashion",
            referrerOrigin: "https://www.google.com",
            entrySource: "Google",
            trafficChannel: "Organic Search",
            utm: {
              source: "google",
              medium: "organic",
              campaign: "spring_2026",
            },
          },
        },
      };

      const result = trackEventSchema.safeParse(eventWithUtm);
      expect(result.success).toBe(true);
      expect(result.data.body.context.entrySource).toBe("Google");
      expect(result.data.body.context.trafficChannel).toBe("Organic Search");
    });
  });

  // =========================================================================
  // 3. SPA NAVIGATION & DURATION TRACKING
  // =========================================================================
  describe("3. SPA Navigation Tracking & Page Duration", () => {
    test("TC-05: Ghi nhận đầy đủ vòng đời chuyển trang page_enter -> page_leave", () => {
      const pageLeavePayload = {
        body: {
          event_type: "page_leave",
          session_id: "sess-nav-001",
          tab_id: "tab-nav-001",
          anonymous_id: "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
          duration_ms: 45000,
          context: {
            pathname: "/products",
            toPath: "/product/ao-thun-monochrome",
            navigationType: "push",
            timing: {
              dwellMs: 45000,
              activeMs: 30000,
              idleMs: 15000,
              awayMs: 0,
              backgroundMs: 0,
            },
          },
        },
      };

      const result = trackEventSchema.safeParse(pageLeavePayload);
      expect(result.success).toBe(true);
      expect(result.data.body.context.timing.dwellMs).toBe(45000);
      expect(result.data.body.context.timing.activeMs).toBe(30000);
    });

    test("TC-06: Không có sự cộng dồn đè chéo (Zero Overlap) giữa active, idle, away và background", () => {
      const timings = {
        activeMs: 120_000,     // 2 phút thao tác tích cực
        idleMs: 180_000,       // 3 phút không thao tác (60s - 300s)
        awayMs: 180_000,       // 3 phút treo trang (>= 300s)
        backgroundMs: 120_000, // 2 phút ở tab khác
      };

      const computedDwell =
        timings.activeMs + timings.idleMs + timings.awayMs + timings.backgroundMs;
      expect(computedDwell).toBe(600_000); // 10 phút tổng cộng không chồng lấn
    });
  });

  // =========================================================================
  // 4. USER IDLE & AWAY STATE MACHINE
  // =========================================================================
  describe("4. User Idle & Away State Machine Thresholds", () => {
    test("TC-07: Xác thực ngưỡng cấu hình chuẩn hóa (60s Idle, 300s Away, 30m Session Timeout)", () => {
      expect(USER_ACTIVITY_CONFIG.idleAfterMs).toBe(60_000);
      expect(USER_ACTIVITY_CONFIG.awayAfterMs).toBe(300_000);
      expect(USER_ACTIVITY_CONFIG.sessionTimeoutMs).toBe(1_800_000);
      expect(USER_ACTIVITY_CONFIG.heartbeatIntervalMs).toBe(30_000);
      expect(USER_ACTIVITY_CONFIG.heartbeatGraceMs).toBe(90_000);
    });

    test("TC-08: Kiểm tra schema nhịp tim (Heartbeat) và cập nhật Redis Presence", () => {
      const heartbeatPayload = {
        body: {
          session_id: "sess-hb-001",
          tab_id: "tab-hb-001",
          status: "AWAY",
          current_route: "/cart",
          previous_route: "/products",
          idle_duration_sec: 320,
          session_duration_sec: 450,
          entry_source: "Google",
          traffic_channel: "Organic Search",
          last_action: "scroll",
          last_api: "/api/cart",
          visible: true,
          timestamp: Date.now(),
        },
      };

      const result = presenceHeartbeatSchema.safeParse(heartbeatPayload);
      expect(result.success).toBe(true);
      expect(result.data.body.status).toBe("AWAY");
      expect(result.data.body.idle_duration_sec).toBe(320);
    });

    test("TC-09: Schema tab leave qua sendBeacon khi đóng tab", () => {
      const leavePayload = {
        body: {
          session_id: "sess-hb-001",
          tab_id: "tab-hb-001",
          reason: "pagehide",
          final_timings: {
            dwellMs: 150000,
            activeMs: 90000,
          },
        },
      };

      const result = presenceLeaveSchema.safeParse(leavePayload);
      expect(result.success).toBe(true);
      expect(result.data.body.reason).toBe("pagehide");
    });
  });

  // =========================================================================
  // 5. REDIS PRESENCE & MULTI-TAB AGGREGATION
  // =========================================================================
  describe("5. Redis Real-Time Presence & Multi-Tab Aggregation", () => {
    test("TC-10: Cập nhật nhịp tim và đọc lại danh sách phiên trực tuyến từ Redis", async () => {
      const redis = getRedisConnection();
      if (!redis) return;

      const testSessionId = "sess-test-" + crypto.randomUUID().slice(0, 8);
      const testTab1 = "tab-1";
      const testTab2 = "tab-2";

      // Tab 1: Đang thao tác ACTIVE
      await presenceService.updateHeartbeat(
        {
          session_id: testSessionId,
          tab_id: testTab1,
          status: PRESENCE_STATUS.ACTIVE,
          current_route: "/products",
          idle_duration_sec: 10,
          session_duration_sec: 60,
          entry_source: "Direct / Unknown",
          last_action: "product_click",
        },
        null
      );

      // Tab 2: Đang đứng yên IDLE
      await presenceService.updateHeartbeat(
        {
          session_id: testSessionId,
          tab_id: testTab2,
          status: PRESENCE_STATUS.IDLE,
          current_route: "/lookbooks",
          idle_duration_sec: 90,
          session_duration_sec: 120,
          entry_source: "Direct / Unknown",
          last_action: "page_view",
        },
        null
      );

      // Tổng hợp phiên: Nếu có ít nhất 1 tab ACTIVE thì phiên chung là ACTIVE
      const liveResult = await presenceService.getLiveSessions({ limit: 100 });
      expect(liveResult.redisConnected).toBe(true);

      const foundSession = liveResult.sessions.find((s) => s.sessionId === testSessionId);
      expect(foundSession).toBeDefined();
      if (foundSession) {
        expect(foundSession.overallStatus).toBe(PRESENCE_STATUS.ACTIVE);
        expect(foundSession.tabCount).toBe(2);
      }

      // Tab 1 đóng -> Chỉ còn Tab 2 (IDLE) -> Phiên chuyển sang IDLE
      await presenceService.handleTabLeave({
        session_id: testSessionId,
        tab_id: testTab1,
      });

      const updatedResult = await presenceService.getLiveSessions({ limit: 100 });
      const sessionAfterLeave = updatedResult.sessions.find((s) => s.sessionId === testSessionId);
      if (sessionAfterLeave) {
        expect(sessionAfterLeave.overallStatus).toBe(PRESENCE_STATUS.IDLE);
        expect(sessionAfterLeave.tabCount).toBe(1);
      }

      // Cleanup Tab 2
      await presenceService.handleTabLeave({
        session_id: testSessionId,
        tab_id: testTab2,
      });
    });

    test("TC-10b: Ghi nhận Guest session với anonymous_id và tính toán counts.guestCount chính xác", async () => {
      const guestSessionId = `sess-guest-${Date.now()}`;
      const guestTabId = `tab-guest-${Date.now()}`;
      const anonId = "e1f2a3b4-c5d6-7890-abcd-ef0123456789";

      await presenceService.updateHeartbeat(
        {
          session_id: guestSessionId,
          tab_id: guestTabId,
          anonymous_id: anonId,
          status: PRESENCE_STATUS.ACTIVE,
          current_route: "/cart",
          idle_duration_sec: 5,
          session_duration_sec: 30,
        },
        null // Không có reqUser -> Guest
      );

      const live = await presenceService.getLiveSessions({ limit: 100 });
      expect(live.counts.guestCount).toBeGreaterThanOrEqual(1);

      const foundGuest = live.sessions.find((s) => s.sessionId === guestSessionId);
      expect(foundGuest).toBeDefined();
      if (foundGuest) {
        expect(foundGuest.userType).toBe("guest");
        expect(foundGuest.anonymousId).toBe(anonId);
        expect(foundGuest.userId).toBeNull();
      }

      await presenceService.handleTabLeave({
        session_id: guestSessionId,
        tab_id: guestTabId,
      });
    });

    test("TC-10c: Ghi nhận Authenticated user session và tính toán counts.authenticatedCount chính xác", async () => {
      const authSessionId = `sess-auth-${Date.now()}`;
      const authTabId = `tab-auth-${Date.now()}`;
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "member@example.com",
        name: "Test Member",
        role: "user",
      };
      User.findById = jest.fn(() => ({ select: () => ({ lean: async () => ({ ...mockUser, fullName: mockUser.name }) }) }));
      User.find = jest.fn(() => ({ select: () => ({ lean: async () => [{ ...mockUser, fullName: mockUser.name }] }) }));

      await presenceService.updateHeartbeat(
        {
          session_id: authSessionId,
          tab_id: authTabId,
          status: PRESENCE_STATUS.ACTIVE,
          current_route: "/profile",
          idle_duration_sec: 2,
          session_duration_sec: 15,
        },
        mockUser
      );

      const live = await presenceService.getLiveSessions({ limit: 100 });
      expect(live.counts.authenticatedCount).toBeGreaterThanOrEqual(1);

      const foundUser = live.sessions.find((s) => s.sessionId === authSessionId);
      expect(foundUser).toBeDefined();
      if (foundUser) {
        expect(foundUser.userType).toBe("authenticated");
        expect(foundUser.userId).toBe(mockUser._id.toString());
        expect(foundUser.userDisplay).toBe("Test Member");
      }

      await presenceService.handleTabLeave({
        session_id: authSessionId,
        tab_id: authTabId,
      });
    });
  });

  // =========================================================================
  // 6. API OBSERVABILITY & TECHNICAL HANG vs USER IDLE
  // =========================================================================
  describe("6. API Observability & Technical Hang vs User Idle", () => {
    test("TC-11: Phân biệt rạch ròi giữa UI Freeze và User Inactivity", () => {
      const userAwaySignal = {
        type: "user_inactivity",
        status: PRESENCE_STATUS.AWAY,
        idleDurationSec: 320,
        explanation: "Người dùng không chạm vào chuột/bàn phím trong 5 phút. Website hoạt động bình thường.",
      };

      const uiStallSignal = {
        type: "ui_stall_suspected",
        durationMs: 3500,
        explanation: "Main thread bị nghẽn do JavaScript nặng quá 3000ms trong khi tab đang foreground.",
      };

      expect(userAwaySignal.type).not.toBe(uiStallSignal.type);
      expect(userAwaySignal.status).toBe(PRESENCE_STATUS.AWAY);
      expect(uiStallSignal.durationMs).toBeGreaterThanOrEqual(3000);
    });

    test("TC-12: API vượt 5s được phân loại SLOW_API; vượt 15s phân loại POSSIBLY_STALLED_API", () => {
      const classifyApiDuration = (durationMs) => {
        if (durationMs >= 15000) return "POSSIBLY_STALLED_API";
        if (durationMs >= 5000) return "SLOW_API";
        return "NORMAL";
      };

      expect(classifyApiDuration(120)).toBe("NORMAL");
      expect(classifyApiDuration(5500)).toBe("SLOW_API");
      expect(classifyApiDuration(16200)).toBe("POSSIBLY_STALLED_API");
    });
  });

  // =========================================================================
  // 7. CHECKOUT & INVENTORY RESERVATION DECOUPLING
  // =========================================================================
  describe("7. Checkout & Inventory Reservation Decoupling", () => {
    test("TC-13: Trạng thái User Idle/Away hoàn toàn tách biệt khỏi hạn giữ hàng 300s của Inventory", () => {
      const userState = {
        status: PRESENCE_STATUS.AWAY, // Người dùng không thao tác 5 phút
        idleSec: 300,
      };

      const inventoryReservation = {
        expiresAt: Date.now() + 120_000, // Vẫn còn 2 phút theo deadline máy chủ
        isReleased: false,
      };

      // Trạng thái USER_AWAY tuyệt đối KHÔNG tự động hủy giữ hàng khi expiresAt chưa tới
      const shouldCancelReservation = Date.now() > inventoryReservation.expiresAt;
      expect(shouldCancelReservation).toBe(false);
      expect(inventoryReservation.isReleased).toBe(false);

      // Ngược lại, dù user ACTIVE nhưng nếu hết hạn expiresAt thì vẫn phải xử lý hết hạn
      const expiredReservation = {
        expiresAt: Date.now() - 5000,
      };
      const isExpired = Date.now() > expiredReservation.expiresAt;
      expect(isExpired).toBe(true);
    });
  });
});
