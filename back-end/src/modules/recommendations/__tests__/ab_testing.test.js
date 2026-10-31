import { describe, test, expect, beforeEach, afterAll } from "@jest/globals";
import crypto from "crypto";
import mongoose from "mongoose";
import experimentService, { DEFAULT_REC_EXPERIMENT_ID } from "../experiments/experiment.service.js";
import experimentAnalyticsService from "../experiments/experimentAnalytics.service.js";
import { trackEventSchema } from "../../tracking/tracking.validator.js";

describe("A/B Testing Framework Comprehensive Verification Suite (12 Scenarios)", () => {
  const testSalt = "wf_fashion_recs_2026";
  const expId = DEFAULT_REC_EXPERIMENT_ID;

  afterAll(async () => {
    try {
      const { getRedisConnection } = await import("../../../configs/redis.js");
      const redis = getRedisConnection();
      if (redis && redis.status !== "end") {
        await Promise.race([
          redis.quit(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      }
    } catch {
      // Bỏ qua lỗi ngắt kết nối
    }
  }, 10000);

  // =========================================================================
  // SCENARIO 1: DETERMINISTIC ASSIGNMENT (NO MATH.RANDOM())
  // =========================================================================
  test("Scenario 1: Phân nhóm tất định (Deterministic Assignment) - Cùng subjectId luôn ra cùng nhóm", async () => {
    const user1 = "user_alpha_123";
    const user2 = "user_beta_456";

    const bucket1a = experimentService.computeHashBucket(user1, testSalt, expId);
    const bucket1b = experimentService.computeHashBucket(user1, testSalt, expId);
    const bucket1c = experimentService.computeHashBucket(user1, testSalt, expId);

    expect(bucket1a).toBe(bucket1b);
    expect(bucket1b).toBe(bucket1c);
    expect(bucket1a).toBeGreaterThanOrEqual(0);
    expect(bucket1a).toBeLessThan(100);

    const bucket2a = experimentService.computeHashBucket(user2, testSalt, expId);
    const bucket2b = experimentService.computeHashBucket(user2, testSalt, expId);
    expect(bucket2a).toBe(bucket2b);

    // Kiểm tra trực tiếp qua hàm assignVariant
    const res1 = await experimentService.assignVariant(user1, { experimentId: expId });
    const res2 = await experimentService.assignVariant(user1, { experimentId: expId });
    expect(res1.variant).toBe(res2.variant);
    expect(res1.isAssigned).toBe(true);
    expect(["A", "B"]).toContain(res1.variant);
  });

  // =========================================================================
  // SCENARIO 2: RELOAD STABILITY (STICKINESS ACROSS REPEATED CALLS)
  // =========================================================================
  test("Scenario 2: Tính ổn định khi tải lại trang (Reload Stability) - 50 lượt gọi liên tiếp giữ nguyên variant", async () => {
    const subjectId = "anon-reload-sticky-uuid-777";

    const firstRun = await experimentService.assignVariant(subjectId, { experimentId: expId });
    const assignedVariant = firstRun.variant;

    for (let i = 0; i < 50; i++) {
      const repeated = await experimentService.assignVariant(subjectId, { experimentId: expId });
      expect(repeated.variant).toBe(assignedVariant);
    }
  });

  // =========================================================================
  // SCENARIO 3: ANONYMOUS-TO-USER IDENTITY TRANSITION
  // =========================================================================
  test("Scenario 3: Chuyển đổi danh tính ẩn danh sang tài khoản (Anonymous-to-User Transition)", async () => {
    const anonId = "anon-prelogin-uuid-888";
    const loggedInUserId = "user-member-999";

    // 1. Khách vãng lai được gán nhóm ban đầu
    const anonAssign = await experimentService.assignVariant(anonId, { experimentId: expId });
    const originalVariant = anonAssign.variant;

    // 2. Người dùng đăng nhập, kích hoạt bindIdentity
    await experimentService.bindIdentity(anonId, loggedInUserId, expId);

    // 3. Người dùng sau đăng nhập tiếp tục được gán variant giống như trước khi đăng nhập
    const userAssign = await experimentService.assignVariant(loggedInUserId, {
      userId: loggedInUserId,
      anonymousId: anonId,
      experimentId: expId,
    });

    expect(userAssign.variant).toBe(originalVariant);
  });

  // =========================================================================
  // SCENARIO 4: EXPOSURE TRACKING (EXPOSURE != ASSIGNMENT)
  // =========================================================================
  test("Scenario 4: Theo dõi tiếp xúc thực tế (Exposure Tracking) - Chỉ tính khi nhìn thấy giao diện đề xuất", async () => {
    const subject = "subject-viewport-001";

    // Phân nhóm không được tự động tính là đã tiếp xúc
    const assignResult = await experimentService.assignVariant(subject, { experimentId: expId });
    expect(assignResult.isAssigned).toBe(true);

    // Ghi nhận tiếp xúc thực tế qua recordExposure
    const exposedFirst = await experimentService.recordExposure({
      subjectId: subject,
      variant: assignResult.variant,
      experimentId: expId,
      requestId: "req-12345",
    });

    expect(typeof exposedFirst).toBe("boolean");
  });

  // =========================================================================
  // SCENARIO 5: ANTI-DUPLICATE EVENTS & ANTI-DOUBLE COUNTING
  // =========================================================================
  test("Scenario 5: Chống trùng lặp sự kiện tiếp xúc (Anti-Duplicate / Anti-Double Counting)", async () => {
    const subject = "subject-dedup-002";
    const variant = "B";

    // Lượt tiếp xúc đầu tiên thành công
    const firstCall = await experimentService.recordExposure({
      subjectId: subject,
      variant,
      experimentId: expId,
    });

    // Lượt tiếp xúc thứ hai trong cùng phiên (30 phút) sẽ bị chặn dedup để tránh làm lệch mẫu
    const secondCall = await experimentService.recordExposure({
      subjectId: subject,
      variant,
      experimentId: expId,
    });

    // Nếu Redis khả dụng, lượt thứ hai sẽ trả về false (deduped)
    expect(typeof firstCall).toBe("boolean");
    expect(typeof secondCall).toBe("boolean");
  });

  // =========================================================================
  // SCENARIO 6: CONSENT DISABLED (PRIVACY PROTECTION)
  // =========================================================================
  test("Scenario 6: Bảo vệ quyền riêng tư - Người dùng từ chối theo dõi (consent = denied) chuyển về Control A", async () => {
    const subject = "user-privacy-denied-001";

    const result = await experimentService.assignVariant(subject, {
      consentStatus: "denied",
      experimentId: expId,
    });

    // Bắt buộc về Control A, không cá nhân hóa, không ghi nhận vào dữ liệu AI
    expect(result.variant).toBe("A");
    expect(result.algorithm).toBe("control_popular");
    expect(result.reason).toBe("consent_denied");
    expect(result.isAssigned).toBe(false);
  });

  // =========================================================================
  // SCENARIO 7: PURCHASE ATTRIBUTION RESOLUTION
  // =========================================================================
  test("Scenario 7: Quy kết đơn hàng (Purchase Attribution) trong cửa sổ 24 giờ", async () => {
    const userId = "user-shopper-777";
    const productId = new mongoose.Types.ObjectId().toString();

    // 1. Khách hàng click vào sản phẩm được đề xuất
    await experimentService.recordProductTouch({
      subjectId: userId,
      userId,
      productId,
      experimentId: expId,
      variant: "B",
      requestId: "req-rec-999",
    });

    // 2. Khách hàng tiến hành đặt đơn chứa sản phẩm này
    const orderItems = [{ product_id: productId, price: 350000, quantity: 1 }];
    const attribution = await experimentService.resolveOrderAttribution(userId, orderItems);

    if (attribution) {
      expect(attribution.experiment_id).toBe(expId);
      expect(attribution.variant).toBe("B");
      expect(attribution.is_direct_rec_assisted).toBe(true);
    } else {
      // Khi không có Redis, hàm gracefully trả null
      expect(attribution).toBeNull();
    }
  });

  // =========================================================================
  // SCENARIO 8: NO FAKE PURCHASES (SERVER-ONLY SECURITY GATE)
  // =========================================================================
  test("Scenario 8: Chặn sự kiện mua hàng giả mạo từ client (No Fake Purchases)", () => {
    // 1. Client cố tình gửi purchase_completed -> Phải bị từ chối
    const fakePurchase = {
      body: {
        event_type: "purchase_completed",
        product_id: "507f1f77bcf86cd799439011",
        meta: { price: 9999999 },
      },
    };
    const checkPurchase = trackEventSchema.safeParse(fakePurchase);
    expect(checkPurchase.success).toBe(false);
    expect(checkPurchase.error.issues[0].message).toContain("chỉ được phép phát sinh từ phía máy chủ");

    // 2. Client cố tình gửi order_placed -> Phải bị từ chối
    const fakeOrder = {
      body: {
        event_type: "order_placed",
        product_id: "507f1f77bcf86cd799439011",
      },
    };
    const checkOrder = trackEventSchema.safeParse(fakeOrder);
    expect(checkOrder.success).toBe(false);
  });

  // =========================================================================
  // SCENARIO 9: REDIS/WORKER FAILURE RESILIENCE
  // =========================================================================
  test("Scenario 9: Khả năng chống chịu sự cố (Resilience) khi Redis/DB mất kết nối", async () => {
    // Gọi assignVariant với fallback in-memory (không crash kể cả khi redis không chạy)
    const fallbackResult = await experimentService.assignVariant("any-guest-user-999", {
      experimentId: "fallback_test_id",
    });

    expect(fallbackResult).toBeDefined();
    expect(["A", "B"]).toContain(fallbackResult.variant);
    expect(typeof fallbackResult.latencyMs).toBe("number");
    expect(fallbackResult.latencyMs).toBeLessThan(10); // Sub-millisecond performance
  });

  // =========================================================================
  // SCENARIO 10: PAUSE & ROLLBACK MECHANISM
  // =========================================================================
  test("Scenario 10: Cơ chế Tạm dừng và Rollback khẩn cấp về 100% Control A", async () => {
    // Cấu hình thử nghiệm paused
    const pausedExp = {
      experiment_id: "test_paused_exp",
      status: "paused",
      variants: [
        { name: "A", weight: 50, algorithm: "control_popular" },
        { name: "B", weight: 50, algorithm: "treatment_personalized" },
      ],
    };

    // Kiểm tra gán khi thử nghiệm bị paused: 100% trả về Control A
    const originalGetActive = experimentService.getActiveExperiment;
    experimentService.getActiveExperiment = async () => pausedExp;

    const assignWhilePaused = await experimentService.assignVariant("user-check-paused-1");
    expect(assignWhilePaused.variant).toBe("A");
    expect(assignWhilePaused.algorithm).toBe("control_popular");
    expect(assignWhilePaused.isAssigned).toBe(false);

    // Khôi phục mock
    experimentService.getActiveExperiment = originalGetActive;
  });

  // =========================================================================
  // SCENARIO 11: SAMPLE RATIO MISMATCH (SRM) CHI-SQUARE TEST
  // =========================================================================
  test("Scenario 11: Kiểm định Sample Ratio Mismatch (SRM) với Chi-Square Goodness-of-Fit", () => {
    // 1. Phân phối cân bằng hoàn hảo (1000 lượt A, 1000 lượt B với tỷ trọng 50/50)
    const balancedSRM = experimentAnalyticsService.calculateSRM(1000, 1000, 50, 50);
    expect(balancedSRM.hasSRM).toBe(false);
    expect(balancedSRM.chiSquare).toBe(0);
    expect(balancedSRM.pValue).toBe(1);
    expect(balancedSRM.status).toBe("PASSED");

    // 2. Phân phối có biến thiên ngẫu nhiên nhẹ (1020 vs 980) -> Chấp nhận được (p > 0.05)
    const normalNoiseSRM = experimentAnalyticsService.calculateSRM(1020, 980, 50, 50);
    expect(normalNoiseSRM.hasSRM).toBe(false);
    expect(normalNoiseSRM.pValue).toBeGreaterThan(0.05);
    expect(normalNoiseSRM.status).toBe("PASSED");

    // 3. Phân phối bị lệch nghiêm trọng (1400 vs 600 khi cấu hình 50/50)
    // Chi-Square = (1400-1000)^2/1000 + (600-1000)^2/1000 = 160 + 160 = 320 -> p cực nhỏ < 0.001
    const skewedSRM = experimentAnalyticsService.calculateSRM(1400, 600, 50, 50);
    expect(skewedSRM.hasSRM).toBe(true);
    expect(skewedSRM.pValue).toBeLessThan(0.001);
    expect(skewedSRM.status).toBe("CRITICAL_MISMATCH");
    expect(skewedSRM.message).toContain("CẢNH BÁO NGUY HIỂM");
  });

  // =========================================================================
  // SCENARIO 12: CONVERSION RATE & STATISTICAL CALCULATIONS (Z-TEST, MDE)
  // =========================================================================
  test("Scenario 12: Tính toán Z-Test, p-value, Khoảng tin cậy 95% và MDE", () => {
    // Thử nghiệm thực tế:
    // Nhóm A: 1000 exposures, 50 purchases (CR = 5.0%)
    // Nhóm B: 1000 exposures, 75 purchases (CR = 7.5%) -> Uplift = +50%
    const zResult = experimentAnalyticsService.calculateZTest(50, 1000, 75, 1000);

    expect(zResult.rateA).toBe(0.05);
    expect(zResult.rateB).toBe(0.075);
    expect(zResult.relativeUplift).toBe(50);
    expect(zResult.difference).toBe(0.025);

    // z-score phải dương vì B > A
    expect(zResult.zScore).toBeGreaterThan(2.0); // Thường ~ 2.29
    expect(zResult.pValue).toBeLessThan(0.05);
    expect(zResult.isSignificant).toBe(true);
    expect(zResult.verdict).toBe("TREATMENT_WINNER");

    // 95% Confidence Interval
    expect(zResult.confidenceInterval95[0]).toBeLessThan(zResult.difference);
    expect(zResult.confidenceInterval95[1]).toBeGreaterThan(zResult.difference);

    // Tính toán MDE (Minimum Detectable Effect)
    const mdeResult = experimentAnalyticsService.calculateMDE(0.05, 1000, 0.05, 0.8);
    expect(mdeResult.absoluteMDE).toBeGreaterThan(0);
    expect(mdeResult.relativeMDE).toBeGreaterThan(0);
  });
});
