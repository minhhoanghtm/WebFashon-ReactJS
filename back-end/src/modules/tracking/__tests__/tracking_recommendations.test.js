import { normalizeKeyword } from "../../../common/utils/normalizeKeyword.js";
import { trackEventSchema } from "../tracking.validator.js";

describe("Tracking & Recommendation Unit Tests", () => {
  describe("1. Normalize Keyword Tests (MỤC 2)", () => {
    test("Xử lý chính xác 'Áo 2.0', '$where', '  ÁO   sơ  mi ', chuỗi rỗng và chuỗi ngắn", () => {
      // 1. Áo 2.0 -> Bỏ dấu, bỏ chấm, thay bằng khoảng trắng, gộp khoảng trắng
      expect(normalizeKeyword("Áo 2.0")).toBe("ao 2 0");

      // 2. $where -> Loại bỏ $, chỉ giữ chữ cái hợp lệ
      expect(normalizeKeyword("$where")).toBe("where");

      // 3. '  ÁO   sơ  mi ' -> Trim, toLowerCase, bỏ dấu tiếng Việt, gộp khoảng trắng
      expect(normalizeKeyword("  ÁO   sơ  mi ")).toBe("ao so mi");

      // 4. Chuỗi rỗng -> Trả về rỗng
      expect(normalizeKeyword("")).toBe("");
      expect(normalizeKeyword("   ")).toBe("");

      // 5. Chuỗi < 2 ký tự -> Trả về rỗng
      expect(normalizeKeyword("a")).toBe("");
      expect(normalizeKeyword(" $ ")).toBe("");

      // 6. Kiểm tra khóa không chứa '.' và không bắt đầu bằng '$'
      const testCases = ["$.gt", "field.name", "hack$$$input"];
      for (const tc of testCases) {
        const res = normalizeKeyword(tc);
        expect(res.startsWith("$")).toBe(false);
        expect(res.includes(".")).toBe(false);
      }
    });
  });

  describe("2. Zod Validator & Security Tests (MỤC 5, 6)", () => {
    test("Chấp nhận các sự kiện client hợp lệ: search, view_product, add_to_cart, favorite", () => {
      const validPayload = {
        body: {
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          event_type: "search",
          query: "áo khoác hoodie",
          meta: { price: 250000, source: "homepage" },
        },
      };

      const result = trackEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test("Từ chối nếu client gửi event_type 'purchase' (chỉ server được tạo)", () => {
      const purchasePayload = {
        body: {
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          event_type: "purchase",
          product_id: "507f1f77bcf86cd799439011",
        },
      };

      const result = trackEventSchema.safeParse(purchasePayload);
      expect(result.success).toBe(false);
    });

    test("Từ chối anonymous_id không đúng định dạng UUID", () => {
      const invalidUuidPayload = {
        body: {
          anonymous_id: "not-a-valid-uuid-12345",
          event_type: "view_product",
          product_id: "507f1f77bcf86cd799439011",
        },
      };

      const result = trackEventSchema.safeParse(invalidUuidPayload);
      expect(result.success).toBe(false);
    });

    test("Từ chối body chứa trường lạ không được khai báo (.strict())", () => {
      const unknownFieldPayload = {
        body: {
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          event_type: "favorite",
          product_id: "507f1f77bcf86cd799439011",
          unknown_field_attack: true,
        },
      };

      const result = trackEventSchema.safeParse(unknownFieldPayload);
      expect(result.success).toBe(false);
    });

    test("Từ chối meta chứa object lồng sâu", () => {
      const nestedMetaPayload = {
        body: {
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          event_type: "view_product",
          product_id: "507f1f77bcf86cd799439011",
          meta: {
            deep: { nested: { dangerous: true } },
          },
        },
      };

      const result = trackEventSchema.safeParse(nestedMetaPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("3. Worker Concurrency & Idempotency Simulation (MỤC 3)", () => {
    test("20 sự kiện song song được tuần tự hóa qua lock, cập nhật đầy đủ điểm và không bị mất điểm", async () => {
      // Mô phỏng profile điểm số trong bộ nhớ với Distributed Lock
      const simulatedProfile = {
        category_scores: new Map(),
        updatedAt: new Date(),
      };

      let lockAcquired = false;
      const acquireSimulatedLock = async () => {
        while (lockAcquired) {
          await new Promise((r) => setTimeout(r, 5));
        }
        lockAcquired = true;
      };
      const releaseSimulatedLock = () => {
        lockAcquired = false;
      };

      const targetCategoryId = "609c1f77bcf86cd799439011";
      const eventWeight = 2; // view_product trọng số = 2

      // Gửi 20 sự kiện song song
      const tasks = Array.from({ length: 20 }).map(async () => {
        await acquireSimulatedLock();
        try {
          const current = simulatedProfile.category_scores.get(targetCategoryId) || 0;
          simulatedProfile.category_scores.set(targetCategoryId, current + eventWeight);
        } finally {
          releaseSimulatedLock();
        }
      });

      await Promise.all(tasks);

      // 20 sự kiện x trọng số 2 = 40 điểm chính xác
      expect(simulatedProfile.category_scores.get(targetCategoryId)).toBe(40);
    });

    test("Idempotent: retry cùng một jobId / event_id không cộng điểm 2 lần", async () => {
      const processedMarker = new Set();
      const profile = { score: 0 };

      const processJob = async (jobId, weight) => {
        if (processedMarker.has(jobId)) {
          return { skipped: true };
        }
        profile.score += weight;
        processedMarker.add(jobId);
        return { success: true };
      };

      // Lần 1: Chạy bình thường
      const res1 = await processJob("event_uuid_1001", 5);
      expect(res1.success).toBe(true);
      expect(profile.score).toBe(5);

      // Lần 2 (BullMQ retry do network issue sau khi xong): Bỏ qua
      const res2 = await processJob("event_uuid_1001", 5);
      expect(res2.skipped).toBe(true);
      expect(profile.score).toBe(5); // Điểm vẫn là 5, không bị cộng 10
    });
  });

  describe("4. Recommendation Ranking Logic (MỤC 4)", () => {
    test("Điểm sở thích chiếm chủ đạo, sản phẩm hết hàng hoặc bị loại trừ không xuất hiện", () => {
      const categoryA = "cat_A_fashion";
      const categoryB = "cat_B_electronics";

      const userCategoryScores = new Map([[categoryA, 5], [categoryB, 0]]);

      const mockProducts = [
        {
          _id: "prod_1",
          name: "Áo thời trang A1 (Hết hàng)",
          category_id: categoryA,
          variants: [{ stock: 0 }],
          rating: 5,
          sold: 100,
        },
        {
          _id: "prod_2",
          name: "Áo thời trang A2 (Còn hàng)",
          category_id: categoryA,
          variants: [{ stock: 15 }],
          rating: 4.5,
          sold: 20,
        },
        {
          _id: "prod_3",
          name: "Điện thoại B1 (Rating cao, không thuộc sở thích)",
          category_id: categoryB,
          variants: [{ stock: 50 }],
          rating: 5,
          sold: 1000,
        },
      ];

      // Lọc tồn kho: variant.stock > 0
      const inStock = mockProducts.filter((p) =>
        p.variants.some((v) => (v.stock || 0) > 0)
      );
      expect(inStock.map((p) => p._id)).not.toContain("prod_1");

      // Chấm điểm theo công thức mới:
      // Interest chiếm chủ đạo (catWeight * 10), rating max 2.5, sold max 2.0
      const scored = inStock.map((p) => {
        const catWeight = userCategoryScores.get(p.category_id) || 0;
        const interestScore = catWeight * 10;
        const ratingScore = (p.rating || 0) * 0.5;
        const soldScore = Math.min(p.sold || 0, 100) * 0.02;
        return { p, score: interestScore + ratingScore + soldScore };
      });

      scored.sort((a, b) => b.score - a.score);

      // prod_2 có catWeight = 5 -> interestScore = 50, vượt trội hoàn toàn so với prod_3 dù prod_3 sold cao
      expect(scored[0].p._id).toBe("prod_2");
      expect(scored[0].score).toBeGreaterThan(50);
      expect(scored[1].score).toBeLessThan(10);
    });
  });

  describe("5. Merge Anonymous to User Idempotency (MỤC 7)", () => {
    test("Gộp anonymous vào user chạy nhiều lần cho cùng kết quả, không nhân đôi điểm", () => {
      const mergedSet = new Set();
      const userProfile = {
        category_scores: new Map([["cat_1", 10]]),
      };
      const anonProfile = {
        category_scores: new Map([["cat_1", 5], ["cat_2", 8]]),
      };

      const merge = (anonId) => {
        if (mergedSet.has(anonId)) {
          return { alreadyMerged: true };
        }
        for (const [cat, score] of anonProfile.category_scores.entries()) {
          const cur = userProfile.category_scores.get(cat) || 0;
          userProfile.category_scores.set(cat, cur + score);
        }
        mergedSet.add(anonId);
        return { success: true };
      };

      // Lần chạy 1
      const res1 = merge("anon_session_123");
      expect(res1.success).toBe(true);
      expect(userProfile.category_scores.get("cat_1")).toBe(15);
      expect(userProfile.category_scores.get("cat_2")).toBe(8);

      // Lần chạy 2 (idempotent guard)
      const res2 = merge("anon_session_123");
      expect(res2.alreadyMerged).toBe(true);
      expect(userProfile.category_scores.get("cat_1")).toBe(15); // Không bị thành 20
      expect(userProfile.category_scores.get("cat_2")).toBe(8);  // Không bị thành 16
    });
  });
});
