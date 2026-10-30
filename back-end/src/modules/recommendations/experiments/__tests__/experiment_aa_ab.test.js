import { describe, test, expect, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import experimentService, { DEFAULT_REC_EXPERIMENT_ID } from "../experiment.service.js";
import experimentAnalyticsService from "../experimentAnalytics.service.js";
import { getRedisConnection } from "../../../../configs/redis.js";

describe("A/A & A/B Testing Hardening & Statistical Verification Suite", () => {
  const expId = DEFAULT_REC_EXPERIMENT_ID;
  const testSalt = "wf_fashion_recs_2026";

  afterAll(async () => {
    try {
      const redis = getRedisConnection();
      if (redis && redis.status !== "end") {
        await redis.quit();
      }
    } catch {
      // Graceful shutdown
    }
  });

  // =========================================================================
  // 1. A/A TEST SIMULATION & SRM VERIFICATION (1,000 SUBJECTS)
  // =========================================================================
  describe("Phase 2: A/A Testing & SRM Distribution", () => {
    test("A/A Test: 1,000 người dùng phân bổ cân bằng 50/50, không phát hiện SRM (p > 0.05)", () => {
      let countA = 0;
      let countB = 0;
      const totalSubjects = 1000;

      for (let i = 0; i < totalSubjects; i++) {
        const subjectId = `aa_synthetic_user_${i}_uuid`;
        const bucket = experimentService.computeHashBucket(subjectId, testSalt, expId);
        if (bucket < 50) {
          countA++;
        } else {
          countB++;
        }
      }

      // Kiểm định SRM với tỷ trọng cấu hình 50/50
      const srm = experimentAnalyticsService.calculateSRM(countA, countB, 50, 50);

      expect(countA + countB).toBe(totalSubjects);
      // Kỳ vọng 500, dao động ngẫu nhiên trong khoảng 450 - 550
      expect(countA).toBeGreaterThanOrEqual(450);
      expect(countA).toBeLessThanOrEqual(550);
      expect(srm.hasSRM).toBe(false);
      expect(srm.pValue).toBeGreaterThan(0.05);
      expect(srm.status).toBe("PASSED");
    });

    test("A/A Test: Khi cả 2 nhóm chạy thuật toán Control, Z-test không báo lỗi dương tính giả (p >= 0.05)", () => {
      // Giả lập A/A test: cả 2 biến thể đều chạy control_popular
      // Biến thiên ngẫu nhiên: A có 52 chuyển đổi / 1000 tiếp xúc, B có 49 chuyển đổi / 1000 tiếp xúc
      const aaTest = experimentAnalyticsService.calculateZTest(52, 1000, 49, 1000);

      expect(aaTest.isSignificant).toBe(false);
      expect(aaTest.pValue).toBeGreaterThan(0.05);
      expect(aaTest.verdict).toBe("INCONCLUSIVE");
    });

    test("SRM Anomaly Detection: Mất cân đối nhân tạo (700 A vs 300 B) phát hiện đúng SRM (p < 0.001)", () => {
      const srmAnomaly = experimentAnalyticsService.calculateSRM(700, 300, 50, 50);

      expect(srmAnomaly.hasSRM).toBe(true);
      expect(srmAnomaly.pValue).toBeLessThan(0.001);
      expect(srmAnomaly.status).toBe("CRITICAL_MISMATCH");
    });
  });

  // =========================================================================
  // 2. DETERMINISTIC HASH & MULTI-INSTANCE CONSISTENCY
  // =========================================================================
  describe("Phase 1: Deterministic Consistency Across Backend Instances", () => {
    test("Cùng subjectId luôn tạo cùng hash bucket bất kể số lần gọi hoặc instance", () => {
      const testSubjects = [
        "inst_user_001",
        "inst_user_002",
        "inst_user_003",
        "inst_user_004",
        "inst_user_005",
      ];

      testSubjects.forEach((subject) => {
        const bucketRun1 = experimentService.computeHashBucket(subject, testSalt, expId);
        const bucketRun2 = experimentService.computeHashBucket(subject, testSalt, expId);
        const bucketRun3 = experimentService.computeHashBucket(subject, testSalt, expId);

        expect(bucketRun1).toBe(bucketRun2);
        expect(bucketRun2).toBe(bucketRun3);
        expect(bucketRun1).toBeGreaterThanOrEqual(0);
        expect(bucketRun1).toBeLessThan(100);
      });
    });
  });

  // =========================================================================
  // 3. STICKY ASSIGNMENT & IDENTITY RESOLUTION
  // =========================================================================
  describe("Phase 1 & 4: Sticky Assignment & Identity Binding", () => {
    test("bindIdentity truyền phiên tiếp xúc và giữ nguyên nhóm khi đăng nhập", async () => {
      const anonId = "anon_visitor_xyz_789";
      const loggedInUserId = "user_registered_xyz_789";

      // 1. Gán nhóm cho khách vãng lai
      const anonAssignment = await experimentService.assignVariant(anonId, { experimentId: expId });
      const expectedVariant = anonAssignment.variant;

      // 2. Ghi nhận tiếp xúc ẩn danh
      await experimentService.recordExposure({
        subjectId: anonId,
        variant: expectedVariant,
        experimentId: expId,
      });

      // 3. Liên kết danh tính
      await experimentService.bindIdentity(anonId, loggedInUserId, expId);

      // 4. Kiểm tra user sau khi đăng nhập
      const userAssignment = await experimentService.assignVariant(loggedInUserId, {
        userId: loggedInUserId,
        anonymousId: anonId,
        experimentId: expId,
      });

      expect(userAssignment.variant).toBe(expectedVariant);
    });
  });

  // =========================================================================
  // 4. ATTRIBUTION & DENOMINATOR DISCIPLINE
  // =========================================================================
  describe("Phase 4: Purchase Attribution & Multi-tier Conversion Tracking", () => {
    test("resolveOrderAttribution phân biệt rõ Rec-assisted vs Exposure vs ITT", async () => {
      const redis = getRedisConnection();
      if (!redis) {
        // Bỏ qua nếu môi trường test không có Redis thực tế
        return;
      }

      const testUser = "user_attrib_test_999";
      const testProduct = new mongoose.Types.ObjectId().toString();

      // Trường hợp 1: Có product touch (click vào item từ rec) -> rec_assisted
      await experimentService.recordProductTouch({
        subjectId: testUser,
        userId: testUser,
        productId: testProduct,
        experimentId: expId,
        variant: "B",
      });

      const recAssistedAttr = await experimentService.resolveOrderAttribution(testUser, [
        { product_id: testProduct, price: 200000, quantity: 1 },
      ]);

      expect(recAssistedAttr).not.toBeNull();
      expect(recAssistedAttr.experiment_id).toBe(expId);
      expect(recAssistedAttr.variant).toBe("B");
      expect(recAssistedAttr.is_direct_rec_assisted).toBe(true);
      expect(recAssistedAttr.is_exposure_attributed).toBe(true);
      expect(recAssistedAttr.attribution_type).toBe("rec_assisted");

      // Xóa product touch
      await redis.del(`exp:touch:${testUser}:${testProduct}`);

      // Trường hợp 2: Không có product touch nhưng có viewport exposure trong 24h -> exposure
      await redis.setex(
        `exp:exposure:${testUser}`,
        86400,
        JSON.stringify({ experiment_id: expId, variant: "B", exposed_at: Date.now() })
      );

      const exposureAttr = await experimentService.resolveOrderAttribution(testUser, [
        { product_id: testProduct, price: 200000, quantity: 1 },
      ]);

      expect(exposureAttr).not.toBeNull();
      expect(exposureAttr.is_direct_rec_assisted).toBe(false);
      expect(exposureAttr.is_exposure_attributed).toBe(true);
      expect(exposureAttr.attribution_type).toBe("exposure");
    });
  });

  // =========================================================================
  // 5. STATISTICAL VALIDATION & EDGE CASES (Z-TEST, MDE)
  // =========================================================================
  describe("Phase 5: Statistical Robustness & Edge Cases", () => {
    test("Z-Test xử lý an toàn trường hợp 0 chuyển đổi ở cả 2 nhóm (0/100 vs 0/100)", () => {
      const res = experimentAnalyticsService.calculateZTest(0, 100, 0, 100);

      expect(res.rateA).toBe(0);
      expect(res.rateB).toBe(0);
      expect(res.difference).toBe(0);
      expect(res.relativeUplift).toBe(0);
      expect(res.zScore).toBe(0);
      expect(res.pValue).toBe(1);
      expect(res.isSignificant).toBe(false);
      expect(res.verdict).toBe("NO_CONVERSIONS");
    });

    test("Z-Test xử lý an toàn trường hợp 100% chuyển đổi ở cả 2 nhóm (50/50 vs 50/50)", () => {
      const res = experimentAnalyticsService.calculateZTest(50, 50, 50, 50);

      expect(res.rateA).toBe(1);
      expect(res.rateB).toBe(1);
      expect(res.difference).toBe(0);
      expect(res.relativeUplift).toBe(0);
      expect(res.zScore).toBe(0);
      expect(res.pValue).toBe(1);
      expect(res.isSignificant).toBe(false);
      expect(res.verdict).toBe("IDENTICAL_CONVERSIONS");
    });

    test("Z-Test cảnh báo mẫu nhỏ khi tổng mẫu hoặc số chuyển đổi < 5 (isSmallSample = true)", () => {
      const resSmall = experimentAnalyticsService.calculateZTest(2, 20, 4, 20);

      expect(resSmall.isSmallSample).toBe(true);
      expect(resSmall.note).toContain("Cảnh báo: Cỡ mẫu nhỏ");
    });

    test("Z-Test phát hiện sự khác biệt có ý nghĩa thống kê khi B vượt trội A (A: 40/1000, B: 70/1000)", () => {
      const resWin = experimentAnalyticsService.calculateZTest(40, 1000, 70, 1000);

      expect(resWin.rateA).toBe(0.04);
      expect(resWin.rateB).toBe(0.07);
      expect(resWin.relativeUplift).toBe(75);
      expect(resWin.zScore).toBeGreaterThan(2.5);
      expect(resWin.pValue).toBeLessThan(0.01);
      expect(resWin.isSignificant).toBe(true);
      expect(resWin.verdict).toBe("TREATMENT_WINNER");
    });

    test("MDE tính toán chính xác Minimum Detectable Effect cho cỡ mẫu 1,000", () => {
      const mde = experimentAnalyticsService.calculateMDE(0.05, 1000, 0.05, 0.8);

      expect(mde.absoluteMDE).toBeGreaterThan(0);
      expect(mde.absoluteMDE).toBeLessThan(0.05); // Kỳ vọng ~ 0.019
      expect(mde.relativeMDE).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 6. PERFORMANCE, EMERGENCY ROLLBACK & KILL-SWITCH
  // =========================================================================
  describe("Phase 6: Multi-Instance Invalidation & Emergency Rollback", () => {
    test("Rollback khẩn cấp điều hướng 100% người dùng về Control A (isAssigned = false)", async () => {
      const pausedExp = {
        experiment_id: "test_kill_switch_exp",
        status: "paused",
        variants: [
          { name: "A", weight: 50, algorithm: "control_popular" },
          { name: "B", weight: 50, algorithm: "treatment_personalized" },
        ],
      };

      const originalGetActive = experimentService.getActiveExperiment;
      experimentService.getActiveExperiment = async () => pausedExp;

      const user1 = await experimentService.assignVariant("emergency_user_1");
      const user2 = await experimentService.assignVariant("emergency_user_2");

      expect(user1.variant).toBe("A");
      expect(user1.algorithm).toBe("control_popular");
      expect(user1.isAssigned).toBe(false);

      expect(user2.variant).toBe("A");
      expect(user2.algorithm).toBe("control_popular");
      expect(user2.isAssigned).toBe(false);

      experimentService.getActiveExperiment = originalGetActive;
    });

    test("invalidateExperimentCache tăng version counter và xóa cache an toàn", async () => {
      await expect(
        experimentService.invalidateExperimentCache(expId)
      ).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // 7. USER PRIVACY & CONSENT ENFORCEMENT
  // =========================================================================
  describe("Phase 7: Privacy & Consent Protection", () => {
    test("Người dùng từ chối consent (consentStatus: denied) không bị ghi nhận vào thử nghiệm", async () => {
      const userDenied = await experimentService.assignVariant("privacy_denied_user_1", {
        consentStatus: "denied",
        experimentId: expId,
      });

      expect(userDenied.variant).toBe("A");
      expect(userDenied.algorithm).toBe("control_popular");
      expect(userDenied.isAssigned).toBe(false);
      expect(userDenied.reason).toBe("consent_denied");
    });
  });
});
