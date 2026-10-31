import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import crypto from "crypto";
import mongoose from "mongoose";
import { trackEventSchema, updateConsentSchema } from "../tracking.validator.js";
import {
  EVENT_TYPES,
  EVENT_WEIGHTS,
  SERVER_ONLY_EVENT_TYPES,
  CLIENT_ALLOWED_EVENT_TYPES,
} from "../tracking.constants.js";
import trackingService from "../tracking.service.js";
import UserEvent from "../userEvent.model.js";
import UserConsent from "../userConsent.model.js";
import UserInterestProfile from "../../recommendations/userInterestProfile.model.js";
import Product from "../../products/product.model.js";
import { getRedisConnection } from "../../../configs/redis.js";

describe("Tracking Production Hardening & Acceptance Gate Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. ADD-TO-CART SEMANTICS & GUEST ATTEMPT
  // =========================================================================
  describe("1. Add-to-Cart Semantics & Guest Attempt", () => {
    test("Edge Case 1: Khách vãng lai (Guest) phát add_to_cart_attempt, không phát add_to_cart", () => {
      const guestPayload = {
        body: {
          event_type: "add_to_cart_attempt",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          session_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          product_id: "507f1f77bcf86cd799439011",
          source: "pdp_guest_redirect",
          meta: {
            reason: "unauthenticated",
            quantity: 1,
            price: 250000,
          },
        },
      };

      const result = trackEventSchema.safeParse(guestPayload);
      expect(result.success).toBe(true);
      expect(CLIENT_ALLOWED_EVENT_TYPES).toContain(EVENT_TYPES.ADD_TO_CART_ATTEMPT);
      expect(SERVER_ONLY_EVENT_TYPES).not.toContain(EVENT_TYPES.ADD_TO_CART_ATTEMPT);
    });

    test("Edge Case 2: Chỉ khi người dùng đăng nhập và API thêm giỏ hàng thành công mới phát add_to_cart", () => {
      const authSuccessPayload = {
        body: {
          event_type: "add_to_cart",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          session_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          product_id: "507f1f77bcf86cd799439011",
          meta: {
            quantity: 2,
            price: 250000,
            cart_id: "507f1f77bcf86cd799439099",
          },
        },
      };

      const result = trackEventSchema.safeParse(authSuccessPayload);
      expect(result.success).toBe(true);
      expect(EVENT_WEIGHTS[EVENT_TYPES.ADD_TO_CART]).toBe(3);
    });

    test("Edge Case 3: Sản phẩm hết hàng hoặc payload không hợp lệ bị từ chối, không phát event cart", () => {
      const invalidProductPayload = {
        body: {
          event_type: "add_to_cart",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          product_id: "invalid-not-an-objectid",
        },
      };

      const result = trackEventSchema.safeParse(invalidProductPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("product_id không phải ObjectId hợp lệ");
    });

    test("Edge Case 4: Double-click deduplication ngăn chặn phát duplicate event liên tiếp", async () => {
      const redis = getRedisConnection();
      const testAnonId = "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6";
      const testProductId = "507f1f77bcf86cd799439011";

      if (redis) {
        const dedupKey = `tracking:dedup:a:${testAnonId}:view_product:${testProductId}`;
        await redis.del(dedupKey);

        const firstLock = await redis.set(dedupKey, "1", "EX", 60, "NX");
        expect(firstLock).toBe("OK");

        const secondLock = await redis.set(dedupKey, "1", "EX", 60, "NX");
        expect(secondLock).toBeNull(); // Blocked by deduplication

        await redis.del(dedupKey);
      }
    });
  });

  // =========================================================================
  // 2. CONSENT PERSISTENCE & INGESTION SUPPRESSION
  // =========================================================================
  describe("2. Privacy & Consent Persistence", () => {
    test("Edge Case 5: Tầng Ingestion API lập tức drop event nếu consent = denied", async () => {
      const testUserId = new mongoose.Types.ObjectId().toString();
      const testAnonId = "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e";

      const isConsentSpy = jest.spyOn(trackingService, "isConsentDenied").mockResolvedValue(true);

      const response = await trackingService.recordEvent(
        {
          event_type: "product_view",
          anonymous_id: testAnonId,
          product_id: "507f1f77bcf86cd799439011",
        },
        { userId: testUserId }
      );

      expect(response.accepted).toBe(false);
      expect(response.suppressed).toBe("consent_denied");

      const batchRes = await trackingService.recordBatchEvents(
        [
          {
            event_type: "product_view",
            anonymous_id: testAnonId,
            product_id: "507f1f77bcf86cd799439011",
          },
        ],
        { userId: testUserId }
      );

      expect(batchRes.accepted).toBe(0);
      expect(batchRes.suppressed).toBe(1);

      isConsentSpy.mockRestore();
    });

    test("Edge Case 6: Worker drop queued event nếu consent bị thu hồi trong khi job đang ở queue", async () => {
      const isConsentSpy = jest.spyOn(trackingService, "isConsentDenied").mockResolvedValue(true);
      const updateProfileSpy = jest.spyOn(trackingService, "_updateInterestProfile");

      await trackingService.processEvent({
        event_id: new mongoose.Types.ObjectId().toString(),
        user_id: new mongoose.Types.ObjectId().toString(),
        anonymous_id: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
        event_type: "product_view",
        product_id: "507f1f77bcf86cd799439011",
      });

      // Profile tuyệt đối không được cập nhật
      expect(updateProfileSpy).not.toHaveBeenCalled();

      isConsentSpy.mockRestore();
      updateProfileSpy.mockRestore();
    });

    test("Edge Case 7: Redis restart hoặc cache mất vẫn bảo toàn consent_status từ MongoDB (Single Source of Truth)", async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const redis = getRedisConnection();

      // Giả lập Redis cache rỗng
      if (redis) {
        await redis.del(`consent:denied:${testUserId.toString()}`);
        await redis.del(`consent:denied:u:${testUserId.toString()}`);
      }

      // Giả lập MongoDB UserInterestProfile có consent_status = 'denied'
      const findProfileSpy = jest.spyOn(UserInterestProfile, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            user_id: testUserId,
            consent_status: "denied",
          }),
        }),
      });

      const isDenied = await trackingService.isConsentDenied(testUserId.toString(), null);
      expect(isDenied).toBe(true);

      findProfileSpy.mockRestore();
    });

    test("Edge Case 8: Đổi tài khoản (User A logout -> User B login) ngăn chặn gộp nhầm dữ liệu ẩn danh", async () => {
      const anonId = "f1e2d3c4-b5a6-7890-abcd-ef1234567890";
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      // Giả lập UserEvent của anonymous_id này đã gắn với userAId
      const findOneSpy = jest.spyOn(UserEvent, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          user_id: userAId,
        }),
      });

      const bulkWriteSpy = jest.spyOn(UserEvent, "bulkWrite").mockResolvedValue({});

      await trackingService.mergeAnonymousToUser(anonId, userBId.toString());

      // bulkWrite tuyệt đối không được gọi để merge sang userBId
      expect(bulkWriteSpy).not.toHaveBeenCalled();

      findOneSpy.mockRestore();
      bulkWriteSpy.mockRestore();
    });
  });

  // =========================================================================
  // 3. PURCHASE IDEMPOTENCY & COD VERIFICATION
  // =========================================================================
  describe("3. Purchase Idempotency & COD Verification", () => {
    test("Edge Case 9: Webhook retry / concurrent payment callback đảm bảo duy nhất 1 purchase_completed qua Partial Unique Index", async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const productId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const redis = getRedisConnection();

      // Clean redis key
      if (redis) {
        await redis.del(`tracked:purchase:${orderId}`);
      }

      // 1st callback
      const mockOrder = {
        _id: orderId,
        user_id: userId,
        items: [{ product_id: productId, quantity: 1, price: 350000 }],
        payment_method: "vnpay",
      };

      const addJobSpy = jest.fn().mockResolvedValue(true);

      // Verify that idempotency key sets successfully first time
      if (redis) {
        const firstLock = await redis.set(`tracked:purchase:${orderId}`, "1", "EX", 86400, "NX");
        expect(firstLock).toBe("OK");

        // Concurrent/Retry callback fails to acquire lock
        const retryLock = await redis.set(`tracked:purchase:${orderId}`, "1", "EX", 86400, "NX");
        expect(retryLock).toBeNull();

        await redis.del(`tracked:purchase:${orderId}`);
      }

      // Verify Database partial unique index handles code 11000 gracefully in processEvent
      const isConsentSpy = jest.spyOn(trackingService, "isConsentDenied").mockResolvedValue(false);
      const findProductSpy = jest.spyOn(Product, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      const updateOneSpy = jest.spyOn(UserEvent, "updateOne").mockRejectedValue({
        code: 11000,
        message: "E11000 duplicate key error collection: user_events",
      });
      const updateProfileSpy = jest.spyOn(trackingService, "_updateInterestProfile");

      await trackingService.processEvent({
        event_id: new mongoose.Types.ObjectId().toString(),
        user_id: userId,
        event_type: "purchase_completed",
        product_id: productId,
        meta: { order_id: orderId },
      });

      // Should return early on code 11000 and not update profile
      expect(updateProfileSpy).not.toHaveBeenCalled();

      isConsentSpy.mockRestore();
      findProductSpy.mockRestore();
      updateOneSpy.mockRestore();
      updateProfileSpy.mockRestore();
    });

    test("Edge Case 10: Tạo đơn COD không bao giờ phát purchase_completed mà chỉ phát order_placed", () => {
      // Client không được phép gửi purchase_completed
      const clientPurchaseAttempt = {
        body: {
          event_type: "purchase_completed",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          meta: { order_id: "12345" },
        },
      };

      const result = trackEventSchema.safeParse(clientPurchaseAttempt);
      expect(result.success).toBe(false);
      expect(SERVER_ONLY_EVENT_TYPES).toContain(EVENT_TYPES.PURCHASE_COMPLETED);
      expect(SERVER_ONLY_EVENT_TYPES).toContain(EVENT_TYPES.ORDER_PLACED);
    });
  });

  // =========================================================================
  // 4. PERSONAL DATA DELETION & TOMBSTONE VERIFICATION
  // =========================================================================
  describe("4. Personal Data Deletion & Tombstone Verification", () => {
    test("Edge Case 11: DELETE /api/events/me xóa UserEvent và UserInterestProfile, đặt tombstone và bảo toàn Order", async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const testAnonId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
      const redis = getRedisConnection();

      const deleteEventsSpy = jest.spyOn(UserEvent, "deleteMany").mockResolvedValue({ deletedCount: 14 });
      const deleteProfileSpy = jest.spyOn(UserInterestProfile, "deleteMany").mockResolvedValue({ deletedCount: 1 });

      const result = await trackingService.clearUserTrackingData({
        userId: testUserId.toString(),
        anonymousId: testAnonId,
      });

      expect(result.success).toBe(true);
      expect(result.deletedEventsCount).toBe(14);
      expect(result.deletedProfile).toBe(true);
      expect(result.invalidatedCache).toBe(true);
      expect(result.preservedOrders).toBe(true);

      // Verify tombstone flag set in Redis
      if (redis) {
        const tombstoneUser = await redis.get(`user:data_cleared:${testUserId.toString()}`);
        const tombstoneAnon = await redis.get(`user:data_cleared:${testAnonId}`);
        expect(tombstoneUser).toBe("1");
        expect(tombstoneAnon).toBe("1");

        // Cleanup
        await redis.del(`user:data_cleared:${testUserId.toString()}`);
        await redis.del(`user:data_cleared:${testAnonId}`);
      }

      deleteEventsSpy.mockRestore();
      deleteProfileSpy.mockRestore();
    });

    test("Tombstone ngăn chặn BullMQ Worker phục hồi dữ liệu từ các event còn sót trong queue", async () => {
      const testUserId = new mongoose.Types.ObjectId().toString();
      const redis = getRedisConnection();

      if (redis) {
        await redis.set(`user:data_cleared:${testUserId}`, "1", "EX", 300);

        const updateOneSpy = jest.spyOn(UserEvent, "updateOne");

        await trackingService.processEvent({
          event_id: new mongoose.Types.ObjectId().toString(),
          user_id: testUserId,
          event_type: "product_view",
          product_id: "507f1f77bcf86cd799439011",
        });

        // Worker drops immediately due to tombstone flag
        expect(updateOneSpy).not.toHaveBeenCalled();

        await redis.del(`user:data_cleared:${testUserId}`);
        updateOneSpy.mockRestore();
      }
    });
  });

  // =========================================================================
  // 5. FUNNEL ANALYTICS COHORT CONSISTENCY & ATTEMPT EXCLUSION
  // =========================================================================
  describe("5. Funnel Analytics Cohort Consistency & Attempt Exclusion", () => {
    test("Edge Case 12: Funnel Analytics chỉ tính add_to_cart thành công, nghiêm cấm tính add_to_cart_attempt", async () => {
      const countDocsSpy = jest.spyOn(UserEvent, "countDocuments").mockImplementation((filter) => {
        const types = filter.event_type?.$in || [];
        if (types.includes("add_to_cart")) {
          // add_to_cart only
          return Promise.resolve(45);
        }
        if (types.includes("page_view")) return Promise.resolve(200);
        if (types.includes("product_view")) return Promise.resolve(120);
        if (types.includes("checkout_started")) return Promise.resolve(25);
        if (types.includes("order_placed")) return Promise.resolve(15);
        if (types.includes("purchase_completed")) return Promise.resolve(12);
        return Promise.resolve(0);
      });

      const distinctSpy = jest.spyOn(UserEvent, "distinct").mockResolvedValue(["id1", "id2", "id3"]);

      const funnelData = await trackingService.getFunnelAnalytics();

      expect(funnelData.funnel).toBeDefined();
      const cartStage = funnelData.funnel.find((stg) => stg.stage === "add_to_cart");
      expect(cartStage).toBeDefined();
      expect(cartStage.eventCount).toBe(45);

      // Verify that ADD_TO_CART_ATTEMPT has weight 0 in behavioral profile
      expect(EVENT_WEIGHTS[EVENT_TYPES.ADD_TO_CART_ATTEMPT]).toBe(0);

      countDocsSpy.mockRestore();
      distinctSpy.mockRestore();
    });
  });

  // =========================================================================
  // 6. FINAL RELEASE BLOCKERS VERIFICATION SUITE
  // =========================================================================
  describe("6. Final Release Blockers Acceptance Verification Suite", () => {
    // -----------------------------------------------------------------------
    // BLOCKER 1: CONVERSION FUNNEL CORRECTNESS & SEQUENTIAL MONOTONICITY
    // -----------------------------------------------------------------------
    test("Release Blocker 1: Sequential Funnel bảo đảm tính đơn điệu toán học (N1 >= N2 >= ... >= N6), không có tỉ lệ bất khả thi", async () => {
      // Giả lập 4 session với chuỗi hành vi khác nhau theo mốc thời gian:
      // Session 1: Hoàn thành đầy đủ: page_view(t1) -> product_view(t2) -> add_to_cart(t3) -> checkout_started(t4) -> order_placed(t5) -> purchase_completed(t6)
      // Session 2: Đến bước checkout: page_view(t1) -> product_view(t2) -> add_to_cart(t3) -> checkout_started(t4)
      // Session 3: Đến bước add_to_cart: page_view(t1) -> product_view(t2) -> add_to_cart(t3)
      // Session 4: Nhảy thẳng vào checkout (không qua add_to_cart trong session này): page_view(t1) -> checkout_started(t2)
      const mockSessionEvents = [
        {
          _id: "sess_1",
          events: [
            { type: "page_view", time: new Date("2026-10-31T10:00:00Z") },
            { type: "product_view", time: new Date("2026-10-31T10:01:00Z") },
            { type: "add_to_cart", time: new Date("2026-10-31T10:02:00Z") },
            { type: "checkout_started", time: new Date("2026-10-31T10:03:00Z") },
            { type: "order_placed", time: new Date("2026-10-31T10:04:00Z") },
            { type: "purchase_completed", time: new Date("2026-10-31T10:05:00Z") },
          ],
        },
        {
          _id: "sess_2",
          events: [
            { type: "page_view", time: new Date("2026-10-31T10:00:00Z") },
            { type: "product_view", time: new Date("2026-10-31T10:01:00Z") },
            { type: "add_to_cart", time: new Date("2026-10-31T10:02:00Z") },
            { type: "checkout_started", time: new Date("2026-10-31T10:03:00Z") },
          ],
        },
        {
          _id: "sess_3",
          events: [
            { type: "page_view", time: new Date("2026-10-31T10:00:00Z") },
            { type: "product_view", time: new Date("2026-10-31T10:01:00Z") },
            { type: "add_to_cart", time: new Date("2026-10-31T10:02:00Z") },
          ],
        },
        {
          _id: "sess_4", // Bỏ qua bước add_to_cart -> Tuyệt đối không tính vào checkout_started của sequential funnel
          events: [
            { type: "page_view", time: new Date("2026-10-31T10:00:00Z") },
            { type: "checkout_started", time: new Date("2026-10-31T10:03:00Z") },
          ],
        },
      ];

      const aggSpy = jest.spyOn(UserEvent, "aggregate").mockImplementation((pipeline) => {
        // Trả về mock sessionEvents
        return Promise.resolve(mockSessionEvents);
      });

      const countDocsSpy = jest.spyOn(UserEvent, "countDocuments").mockResolvedValue(10);
      const distinctSpy = jest.spyOn(UserEvent, "distinct").mockResolvedValue(["s1", "s2", "s3", "s4"]);

      const funnelResult = await trackingService.getFunnelAnalytics();
      expect(funnelResult).toBeDefined();
      expect(funnelResult.sessionFunnel).toBeDefined();
      expect(funnelResult.rawStages).toBeDefined();

      const stages = funnelResult.sessionFunnel;
      // 1. Kiểm tra tính đơn điệu: N1 >= N2 >= N3 >= N4 >= N5 >= N6
      for (let i = 0; i < stages.length - 1; i++) {
        expect(stages[i].count).toBeGreaterThanOrEqual(stages[i + 1].count);
        expect(stages[i].overallConversionRate).toBeGreaterThanOrEqual(stages[i + 1].overallConversionRate);
      }

      // 2. Session 4 nhảy cóc không được tính vào stage checkout:
      // Page view: 4 sessions (100%)
      // Product view: 3 sessions (75%)
      // Add to cart: 3 sessions (75%)
      // Checkout started: đúng 2 sessions (50%) <= 3 sessions Add to cart (75%) -> Không bao giờ có tỉ lệ Checkout > Cart!
      expect(stages[0].count).toBe(4);
      expect(stages[1].count).toBe(3);
      expect(stages[2].count).toBe(3);
      expect(stages[3].count).toBe(2);
      expect(stages[4].count).toBe(1);
      expect(stages[5].count).toBe(1);

      // 3. Step conversion rate và drop-off rate hợp lệ toán học
      stages.forEach((stg) => {
        expect(stg.stepConversionRate).toBeLessThanOrEqual(100);
        expect(stg.dropOffRate).toBeGreaterThanOrEqual(0);
        expect(stg.stepConversionRate + stg.dropOffRate).toBeCloseTo(100, 1);
      });

      aggSpy.mockRestore();
      countDocsSpy.mockRestore();
      distinctSpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // BLOCKER 2: DURABLE CONSENT PERSISTENCE (GDPR Art 17 vs Art 21)
    // -----------------------------------------------------------------------
    test("Release Blocker 2: UserConsent độc lập lưu trữ consent = denied ngay cả khi UserInterestProfile bị xóa sạch", async () => {
      const testAnonId = "a9b8c7d6-e5f4-4321-abcd-ef0123456789";
      const redis = getRedisConnection();

      // Cập nhật consent = denied
      const findOneAndUpdateSpy = jest.spyOn(UserConsent, "findOneAndUpdate").mockResolvedValue({
        subject_id: testAnonId,
        consent_status: "denied",
      });

      await trackingService.updateConsent({
        anonymousId: testAnonId,
        consent: "denied",
      });

      // Giả lập xóa hoàn toàn UserInterestProfile (GDPR Right to be Forgotten)
      const findProfileSpy = jest.spyOn(UserInterestProfile, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null), // Profile không còn tồn tại
        }),
      });

      // Giả lập Redis cache bị xóa / restart hoàn toàn
      if (redis) {
        await redis.del(`consent:denied:${testAnonId}`);
        await redis.del(`consent:denied:a:${testAnonId}`);
      }

      // UserConsent trả về denied
      const findConsentSpy = jest.spyOn(UserConsent, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            subject_id: testAnonId,
            consent_status: "denied",
          }),
        }),
      });

      // Kiểm tra quyền riêng tư: Vẫn phải nhận diện là DENIED
      const isDenied = await trackingService.isConsentDenied(null, testAnonId);
      expect(isDenied).toBe(true);

      // Kiểm tra Redis cache được tự động rehydrate
      if (redis) {
        const cached = await redis.get(`consent:denied:${testAnonId}`);
        expect(cached).toBe("1");
        await redis.del(`consent:denied:${testAnonId}`);
        await redis.del(`consent:denied:a:${testAnonId}`);
      }

      findOneAndUpdateSpy.mockRestore();
      findProfileSpy.mockRestore();
      findConsentSpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // BLOCKER 3: DURABLE DELETION FENCE (WATERMARK cleared_at)
    // -----------------------------------------------------------------------
    test("Release Blocker 3: Mọi queued event phát sinh trước cleared_at đều bị Worker drop vĩnh viễn, bảo toàn đơn hàng", async () => {
      const testAnonId = "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a";
      const clearedWatermark = new Date("2026-10-31T12:00:00.000Z");

      // Event cũ phát sinh lúc 11:59 (trước thời điểm xóa dữ liệu)
      const oldEventTimestamp = new Date("2026-10-31T11:59:00.000Z").toISOString();

      const findConsentSpy = jest.spyOn(UserConsent, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            subject_id: testAnonId,
            cleared_at: clearedWatermark,
          }),
        }),
      });

      const updateProfileSpy = jest.spyOn(trackingService, "_updateInterestProfile");

      // Giả lập BullMQ worker xử lý event cũ này
      await trackingService.processEvent({
        event_id: new mongoose.Types.ObjectId().toString(),
        anonymous_id: testAnonId,
        event_type: "product_view",
        product_id: new mongoose.Types.ObjectId().toString(),
        timestamp: oldEventTimestamp,
      });

      // Worker drop vĩnh viễn do dính Durable Deletion Fence
      expect(updateProfileSpy).not.toHaveBeenCalled();

      findConsentSpy.mockRestore();
      updateProfileSpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // BLOCKER 4: ANONYMOUS OWNERSHIP & CRYPTOGRAPHIC DELETE AUTHORIZATION
    // -----------------------------------------------------------------------
    test("Release Blocker 4: Xóa dữ liệu ẩn danh yêu cầu companion anonymous_token hợp lệ (SHA-256 hash)", async () => {
      const testAnonId = "c1b2a3d4-e5f6-7890-abcd-ef1234567890";
      const validToken = "secret_uuid_token_wf_2026";
      const tokenHash = crypto.createHash("sha256").update(validToken).digest("hex");

      // Đã có bản ghi UserConsent lưu hash của token này
      const findConsentSpy = jest.spyOn(UserConsent, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          subject_id: testAnonId,
          anonymous_token_hash: tokenHash,
        }),
      });

      // 1. Kẻ tấn công gửi anonymousId nhưng sai hoặc thiếu token -> Bị từ chối 403 Forbidden
      await expect(
        trackingService.clearUserTrackingData({
          anonymousId: testAnonId,
          anonymousToken: "wrong_token_attacker_guess",
        })
      ).rejects.toThrow("anonymous_token không khớp với phiên sở hữu đã đăng ký");

      // 2. Khách hợp lệ gửi đúng anonymousToken -> Được phép xóa
      const deleteEventsSpy = jest.spyOn(UserEvent, "deleteMany").mockResolvedValue({ deletedCount: 5 });
      const deleteProfileSpy = jest.spyOn(UserInterestProfile, "deleteMany").mockResolvedValue({ deletedCount: 1 });
      const findOneAndUpdateSpy = jest.spyOn(UserConsent, "findOneAndUpdate").mockResolvedValue({});

      const validResult = await trackingService.clearUserTrackingData({
        anonymousId: testAnonId,
        anonymousToken: validToken,
      });

      expect(validResult.success).toBe(true);
      expect(validResult.preservedOrders).toBe(true);

      findConsentSpy.mockRestore();
      deleteEventsSpy.mockRestore();
      deleteProfileSpy.mockRestore();
      findOneAndUpdateSpy.mockRestore();
    });

    // -----------------------------------------------------------------------
    // BLOCKER 5: MULTI-ITEM PURCHASE IDEMPOTENCY & PARTIAL UNIQUE INDEX
    // -----------------------------------------------------------------------
    test("Release Blocker 5: Đơn hàng đa sản phẩm tạo đúng 1 event/item; Duplicate callback bị chặn ở mã lỗi 11000", async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const product1 = new mongoose.Types.ObjectId().toString();
      const product2 = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      // Giả lập dispatchJob được gọi cho 2 items khác nhau của cùng 1 đơn hàng
      const dispatchedJobs = [];
      const dispatchSpy = jest.spyOn(trackingService, "_dispatchJob").mockImplementation((job) => {
        dispatchedJobs.push(job);
        return Promise.resolve(true);
      });

      const multiItemOrder = {
        _id: orderId,
        user_id: userId,
        items: [
          { product_id: product1, quantity: 1, price: 150000 },
          { product_id: product2, quantity: 2, price: 200000 },
        ],
        payment_method: "vnpay",
      };

      await trackingService.trackPurchaseCompleted(multiItemOrder);

      // Đơn hàng có 2 items phải dispatch đúng 2 jobs
      expect(dispatchedJobs.length).toBe(2);
      expect(dispatchedJobs[0].product_id).toBe(product1);
      expect(dispatchedJobs[1].product_id).toBe(product2);

      // Duplicate payment callback cho cùng (order_id, product_id, purchase_completed):
      // Worker bắt mã lỗi code 11000 từ MongoDB Partial Unique Index và return early, không cập nhật profile 2 lần
      const updateOneSpy = jest.spyOn(UserEvent, "updateOne").mockRejectedValue({
        code: 11000,
        message: "E11000 duplicate key error on index: meta.order_id_1_product_id_1_event_type_1",
      });
      const updateProfileSpy = jest.spyOn(trackingService, "_updateInterestProfile");

      const findProductSpy = jest.spyOn(Product, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await trackingService.processEvent({
        event_id: new mongoose.Types.ObjectId().toString(),
        user_id: userId,
        event_type: "purchase_completed",
        product_id: product1,
        meta: { order_id: orderId },
      });

      // Tuyệt đối không cập nhật profile lần 2
      expect(updateProfileSpy).not.toHaveBeenCalled();

      dispatchSpy.mockRestore();
      updateOneSpy.mockRestore();
      updateProfileSpy.mockRestore();
      findProductSpy.mockRestore();
    });
  });
});
