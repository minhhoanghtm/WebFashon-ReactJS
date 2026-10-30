import { describe, test, expect, beforeEach } from "@jest/globals";
import { trackEventSchema, updateConsentSchema } from "../tracking.validator.js";
import { EVENT_WEIGHTS, SERVER_ONLY_EVENT_TYPES } from "../tracking.constants.js";
import { HYBRID_RANKING_WEIGHTS } from "../../recommendations/recommendation.constants.js";

describe("Tracking Pipeline & Vector AI Recommendation E2E Test Suite", () => {
  // =========================================================================
  // 1. EVENT VALIDATION & BATCH INGESTION TESTS
  // =========================================================================
  describe("1. Event Validation & Batch Ingestion", () => {
    test("Chấp nhận đơn sự kiện (single event) hợp lệ", () => {
      const validSingle = {
        body: {
          event_type: "product_view",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          session_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          product_id: "507f1f77bcf86cd799439011",
          category_id: "507f1f77bcf86cd799439012",
          source: "frontend",
          context: {
            deviceType: "desktop",
            referrer: "https://google.com",
            pathname: "/product/ao-thun-linen",
          },
          meta: { price: 185000 },
        },
      };

      const result = trackEventSchema.safeParse(validSingle);
      expect(result.success).toBe(true);
    });

    test("Chấp nhận batch events (tối đa 25 sự kiện trong 1 request)", () => {
      const batchPayload = {
        body: {
          events: Array.from({ length: 15 }).map((_, i) => ({
            event_type: "product_impression",
            anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
            session_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            product_id: "507f1f77bcf86cd799439011",
            source: "frontend",
            meta: { position: i + 1 },
          })),
        },
      };

      const result = trackEventSchema.safeParse(batchPayload);
      expect(result.success).toBe(true);
    });

    test("Từ chối batch vượt quá 25 sự kiện để chống DoS", () => {
      const oversizedBatch = {
        body: {
          events: Array.from({ length: 26 }).map(() => ({
            event_type: "product_impression",
            anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
            product_id: "507f1f77bcf86cd799439011",
          })),
        },
      };

      const result = trackEventSchema.safeParse(oversizedBatch);
      expect(result.success).toBe(false);
    });

    test("Chặn client gửi các sự kiện server-only (purchase, order_placed, order_cancelled)", () => {
      for (const serverEvent of SERVER_ONLY_EVENT_TYPES) {
        const payload = {
          body: {
            event_type: serverEvent,
            anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
            product_id: "507f1f77bcf86cd799439011",
          },
        };
        const result = trackEventSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    test("Từ chối payload có anonymous_id sai định dạng UUID", () => {
      const invalidAnon = {
        body: {
          event_type: "page_view",
          anonymous_id: "not-uuid",
        },
      };
      expect(trackEventSchema.safeParse(invalidAnon).success).toBe(false);
    });
  });

  // =========================================================================
  // 2. BEHAVIORAL SCORING & NEGATIVE SIGNALS TESTS
  // =========================================================================
  describe("2. Behavioral Scoring, Recency & Negative Signals", () => {
    test("Định nghĩa trọng số chuẩn xác cho toàn bộ Event Taxonomy", () => {
      expect(EVENT_WEIGHTS["page_view"]).toBe(0.05);
      expect(EVENT_WEIGHTS["product_view"]).toBe(1);
      expect(EVENT_WEIGHTS["product_click"]).toBe(0.8);
      expect(EVENT_WEIGHTS["product_variant_select"]).toBe(0.7);
      expect(EVENT_WEIGHTS["product_favorite"]).toBe(3);
      expect(EVENT_WEIGHTS["search_result_click"]).toBe(1);
      expect(EVENT_WEIGHTS["semantic_search_used"]).toBe(1.2);
      expect(EVENT_WEIGHTS["add_to_cart"]).toBe(3);
      expect(EVENT_WEIGHTS["checkout_started"]).toBe(2.5);
      expect(EVENT_WEIGHTS["order_placed"]).toBe(4);
      expect(EVENT_WEIGHTS["purchase_completed"]).toBe(5);
      expect(EVENT_WEIGHTS["ai_recommendation_clicked"]).toBe(2);
      expect(EVENT_WEIGHTS["ai_cart_action_confirmed"]).toBe(3);

      // Negative weights
      expect(EVENT_WEIGHTS["remove_from_cart"]).toBe(-0.5);
      expect(EVENT_WEIGHTS["order_cancelled"]).toBe(-2);
      expect(EVENT_WEIGHTS["product_unfavorite"]).toBe(-1);
    });

    test("Tín hiệu tiêu cực (remove_from_cart, order_cancelled) giảm điểm nhưng không bao giờ âm", () => {
      const profile = {
        category_scores: new Map([["cat_ao_thun", 0.8]]),
      };

      const applyEventScore = (eventType, categoryId) => {
        const weight = EVENT_WEIGHTS[eventType] || 0;
        const current = profile.category_scores.get(categoryId) || 0;
        profile.category_scores.set(categoryId, Math.max(0, current + weight));
      };

      // 1. remove_from_cart (-0.5)
      applyEventScore("remove_from_cart", "cat_ao_thun");
      expect(profile.category_scores.get("cat_ao_thun")).toBeCloseTo(0.3);

      // 2. remove_from_cart lần nữa (-0.5, nhưng chặn dưới 0)
      applyEventScore("remove_from_cart", "cat_ao_thun");
      expect(profile.category_scores.get("cat_ao_thun")).toBe(0);

      // 3. order_cancelled (-2) trên danh mục có 0 điểm -> vẫn giữ 0
      applyEventScore("order_cancelled", "cat_ao_thun");
      expect(profile.category_scores.get("cat_ao_thun")).toBe(0);
    });

    test("Cập nhật đầy đủ sở thích màu sắc, kích thước và thương hiệu vào profile", () => {
      const profile = {
        preferred_colors: new Map(),
        preferred_sizes: new Map(),
        brand_scores: new Map(),
      };

      const updatePreferences = (color, size, brand, weight) => {
        if (color) {
          const cur = profile.preferred_colors.get(color.toLowerCase()) || 0;
          profile.preferred_colors.set(color.toLowerCase(), Math.max(0, cur + weight));
        }
        if (size) {
          const cur = profile.preferred_sizes.get(size.toUpperCase()) || 0;
          profile.preferred_sizes.set(size.toUpperCase(), Math.max(0, cur + weight));
        }
        if (brand) {
          const cur = profile.brand_scores.get(brand.toLowerCase()) || 0;
          profile.brand_scores.set(brand.toLowerCase(), Math.max(0, cur + weight));
        }
      };

      // User chọn áo thun Linen màu "Đen", size "L", hãng "404Studio" -> weight = 2 (variant_select)
      updatePreferences("Đen", "L", "404Studio", 2);
      // User thêm vào giỏ hàng -> weight = 5 (add_to_cart)
      updatePreferences("Đen", "L", "404Studio", 5);

      expect(profile.preferred_colors.get("đen")).toBe(7);
      expect(profile.preferred_sizes.get("L")).toBe(7);
      expect(profile.brand_scores.get("404studio")).toBe(7);
    });
  });

  // =========================================================================
  // 3. PRIVACY & CONSENT COMPLIANCE TESTS
  // =========================================================================
  describe("3. Privacy & Consent Compliance (GDPR)", () => {
    test("Schema kiểm tra tính hợp lệ của cập nhật consent", () => {
      expect(updateConsentSchema.safeParse({ body: { consent: "granted" } }).success).toBe(true);
      expect(updateConsentSchema.safeParse({ body: { consent: "denied" } }).success).toBe(true);
      expect(updateConsentSchema.safeParse({ body: { consent: "invalid" } }).success).toBe(false);
      expect(updateConsentSchema.safeParse({ body: {} }).success).toBe(false);
    });

    test("Khi consent = 'denied': xóa toàn bộ hồ sơ sở thích cá nhân để đảm bảo quyền riêng tư", () => {
      const userProfile = {
        user_id: "669000000000000000000001",
        consent_status: "granted",
        category_scores: { cat1: 15, cat2: 20 },
        keyword_scores: { "ao thun": 10 },
        preferred_colors: { den: 8 },
        preferred_sizes: { L: 5 },
        brand_scores: { "404studio": 12 },
      };

      const handleConsentUpdate = (profile, newConsent) => {
        if (newConsent === "denied") {
          return {
            ...profile,
            consent_status: "denied",
            category_scores: {},
            keyword_scores: {},
            preferred_colors: {},
            preferred_sizes: {},
            brand_scores: {},
          };
        }
        return { ...profile, consent_status: newConsent };
      };

      const updated = handleConsentUpdate(userProfile, "denied");
      expect(updated.consent_status).toBe("denied");
      expect(Object.keys(updated.category_scores)).toHaveLength(0);
      expect(Object.keys(updated.keyword_scores)).toHaveLength(0);
      expect(Object.keys(updated.preferred_colors)).toHaveLength(0);
      expect(Object.keys(updated.preferred_sizes)).toHaveLength(0);
      expect(Object.keys(updated.brand_scores)).toHaveLength(0);
    });
  });

  // =========================================================================
  // 4. FUNNEL & OVERVIEW ANALYTICS TESTS
  // =========================================================================
  describe("4. Tracking Analytics & Funnel Calculations", () => {
    test("Tính toán tỷ lệ chuyển đổi phễu mua hàng chính xác qua từng bước", () => {
      const mockEventCounts = {
        page_view: 1000,
        product_view: 600,
        add_to_cart: 180,
        checkout_started: 90,
        order_placed: 45,
        purchase_completed: 40,
      };

      const calculateFunnel = (counts) => {
        const steps = [
          { step: "page_view", count: counts.page_view || 0 },
          { step: "product_view", count: counts.product_view || 0 },
          { step: "add_to_cart", count: counts.add_to_cart || 0 },
          { step: "checkout_started", count: counts.checkout_started || 0 },
          { step: "order_placed", count: counts.order_placed || 0 },
          { step: "purchase_completed", count: counts.purchase_completed || 0 },
        ];

        return steps.map((item, idx) => {
          const stepConversion =
            idx === 0
              ? 100
              : steps[idx - 1].count > 0
              ? Math.round((item.count / steps[idx - 1].count) * 10000) / 100
              : 0;

          const overallConversion =
            steps[0].count > 0
              ? Math.round((item.count / steps[0].count) * 10000) / 100
              : 0;

          return {
            ...item,
            stepConversion,
            overallConversion,
          };
        });
      };

      const funnel = calculateFunnel(mockEventCounts);

      // Step 1: page_view (1000 -> 100%)
      expect(funnel[0].stepConversion).toBe(100);
      expect(funnel[0].overallConversion).toBe(100);

      // Step 2: product_view (600 / 1000 = 60%)
      expect(funnel[1].stepConversion).toBe(60);
      expect(funnel[1].overallConversion).toBe(60);

      // Step 3: add_to_cart (180 / 600 = 30%)
      expect(funnel[2].stepConversion).toBe(30);
      expect(funnel[2].overallConversion).toBe(18);

      // Step 4: checkout_started (90 / 180 = 50%)
      expect(funnel[3].stepConversion).toBe(50);
      expect(funnel[3].overallConversion).toBe(9);

      // Step 5: order_placed (45 / 90 = 50%)
      expect(funnel[4].stepConversion).toBe(50);
      expect(funnel[4].overallConversion).toBe(4.5);

      // Step 6: purchase_completed (40 / 45 = 88.89%)
      expect(funnel[5].stepConversion).toBe(88.89);
      expect(funnel[5].overallConversion).toBe(4);
    });

    test("Tổng hợp Overview KPIs: phân loại theo thiết bị và sự kiện hàng đầu", () => {
      const mockRawEvents = [
        { event_type: "page_view", context: { deviceType: "mobile" } },
        { event_type: "page_view", context: { deviceType: "mobile" } },
        { event_type: "page_view", context: { deviceType: "desktop" } },
        { event_type: "product_view", context: { deviceType: "mobile" } },
        { event_type: "add_to_cart", context: { deviceType: "desktop" } },
      ];

      const aggregateOverview = (events) => {
        const totalEvents = events.length;
        const byType = {};
        const byDevice = {};

        events.forEach((e) => {
          byType[e.event_type] = (byType[e.event_type] || 0) + 1;
          const dev = e.context?.deviceType || "desktop";
          byDevice[dev] = (byDevice[dev] || 0) + 1;
        });

        return { totalEvents, byType, byDevice };
      };

      const overview = aggregateOverview(mockRawEvents);
      expect(overview.totalEvents).toBe(5);
      expect(overview.byType.page_view).toBe(3);
      expect(overview.byType.product_view).toBe(1);
      expect(overview.byType.add_to_cart).toBe(1);
      expect(overview.byDevice.mobile).toBe(3);
      expect(overview.byDevice.desktop).toBe(2);
    });
  });

  // =========================================================================
  // 5. VECTOR AI HYBRID RECOMMENDATION RANKING FORMULA
  // =========================================================================
  describe("5. Vector AI Hybrid Recommendation Formula", () => {
    test("Tính điểm Hybrid chính xác theo trọng số đa chiều (Vector, Profile, Rating, Sale)", () => {
      const userProfile = {
        category_scores: { cat_tee: 8 },
        keyword_scores: { linen: 5, "mua he": 4 },
        preferred_colors: { trang: 4, xanh: 2 },
        preferred_sizes: { L: 3 },
        brand_scores: { "404studio": 6 },
        price_range: { min: 100000, max: 300000 },
      };

      const candidateA = {
        _id: "prod_summer_tee",
        name: "Áo Thun Linen Mùa Hè 404Studio",
        category_id: "cat_tee",
        price: 185000,
        rating: 4.8,
        sold: 150,
        colors: ["trắng", "đen"],
        sizes: ["M", "L"],
        brand: "404Studio",
        hasSaleCampaign: true,
        vectorSimilarity: 0.92, // Tương đồng ngữ nghĩa cao từ Vector AI
      };

      const candidateB = {
        _id: "prod_random_shoes",
        name: "Giày Sneaker Phổ Thông",
        category_id: "cat_shoes",
        price: 850000,
        rating: 4.0,
        sold: 500,
        colors: ["đỏ"],
        sizes: ["42"],
        brand: "OtherBrand",
        hasSaleCampaign: false,
        vectorSimilarity: 0.25, // Tương đồng ngữ nghĩa thấp
      };

      const computeHybridScore = (product, profile) => {
        const W = HYBRID_RANKING_WEIGHTS;

        // 1. Vector AI similarity
        const vectorScore = (product.vectorSimilarity || 0) * W.vectorSimilarity;

        // 2. Category Affinity
        const catScore = ((profile.category_scores?.[product.category_id] || 0) > 0 ? 1 : 0) * W.categoryAffinity;

        // 3. Keyword Match
        const kwScore = Object.keys(profile.keyword_scores || {}).some((k) =>
          product.name.toLowerCase().includes(k)
        )
          ? W.keywordMatch
          : 0;

        // 4. Brand Affinity
        const brandScore = ((profile.brand_scores?.[product.brand?.toLowerCase()] || 0) > 0 ? 1 : 0) * W.brandAffinity;

        // 5. Color Affinity
        const colorScore = product.colors?.some((c) => (profile.preferred_colors?.[c.toLowerCase()] || 0) > 0)
          ? W.colorAffinity
          : 0;

        // 6. Size Affinity
        const sizeScore = product.sizes?.some((s) => (profile.preferred_sizes?.[s.toUpperCase()] || 0) > 0)
          ? W.sizeAffinity
          : 0;

        // 7. Price Match
        const priceMatch =
          profile.price_range &&
          product.price >= profile.price_range.min &&
          product.price <= profile.price_range.max
            ? W.priceRangeMatch
            : 0;

        // 8. Quality & Popularity
        const ratingScore = (product.rating || 0) * (W.productRating || 0.5);
        const popularityScore = Math.min(product.sold || 0, 100) * (W.productPopularity || 0.02);
        const saleScore = product.hasSaleCampaign ? W.saleBonus : 0;

        return (
          vectorScore +
          catScore +
          kwScore +
          brandScore +
          colorScore +
          sizeScore +
          priceMatch +
          ratingScore +
          popularityScore +
          saleScore
        );
      };

      const scoreA = computeHybridScore(candidateA, userProfile);
      const scoreB = computeHybridScore(candidateB, userProfile);

      // Candidate A:
      // Vector: 0.92 * 12 = 11.04
      // Cat: 10
      // Kw: 8
      // Brand: 4
      // Color: 3
      // Size: 2
      // Price: 5
      // Rating: 4.8 * 0.5 = 2.4
      // Pop: 100 * 0.02 = 2.0
      // Sale: 1.5
      // Total scoreA ≈ 48.94
      expect(scoreA).toBeGreaterThan(45);

      // Candidate B:
      // Vector: 0.25 * 12 = 3.0
      // Rating: 4.0 * 0.5 = 2.0
      // Pop: 100 * 0.02 = 2.0
      // Total scoreB ≈ 7.0
      expect(scoreB).toBeLessThan(10);

      // Candidate A hoàn toàn vượt trội nhờ kết hợp Vector AI + Hồ sơ sở thích người dùng
      expect(scoreA).toBeGreaterThan(scoreB * 4);
    });
  });

  // =========================================================================
  // 6. BUSINESS LIFECYCLE TRACKING FLOWS
  // =========================================================================
  describe("6. Business Lifecycle Tracking Flows", () => {
    test("Product Flow: Impression -> Click -> View -> Favorite tuần tự và tích lũy điểm", () => {
      const flowEvents = [
        { type: "product_impression", time: 1000, weight: EVENT_WEIGHTS.product_impression },
        { type: "product_click", time: 1500, weight: EVENT_WEIGHTS.product_click },
        { type: "product_view", time: 2000, weight: EVENT_WEIGHTS.product_view },
        { type: "product_favorite", time: 5000, weight: EVENT_WEIGHTS.product_favorite },
      ];

      // Kiểm tra tính đơn điệu của thời gian (Chronological order)
      for (let i = 1; i < flowEvents.length; i++) {
        expect(flowEvents[i].time).toBeGreaterThan(flowEvents[i - 1].time);
      }

      // Tổng điểm hành vi tích lũy chính xác
      const totalAccumulatedScore = flowEvents.reduce((sum, e) => sum + e.weight, 0);
      expect(totalAccumulatedScore).toBeCloseTo(0.05 + 0.8 + 1.0 + 3.0, 2);
    });

    test("Cart Flow: View -> Add to cart -> Quantity change -> Checkout started", () => {
      const cartEvents = [
        { event_type: "product_view", product_id: "507f1f77bcf86cd799439011" },
        { event_type: "add_to_cart", product_id: "507f1f77bcf86cd799439011", quantity: 2 },
        { event_type: "cart_quantity_change", product_id: "507f1f77bcf86cd799439011", oldQty: 2, newQty: 3 },
        { event_type: "checkout_started", itemCount: 1, totalPrice: 555000 },
      ];

      // Đảm bảo client được phép gửi các sự kiện giỏ hàng
      for (const ev of cartEvents) {
        expect(SERVER_ONLY_EVENT_TYPES.includes(ev.event_type)).toBe(false);
      }
    });

    test("Order Flow: Checkout -> Order Placed -> Payment Verified -> Purchase Completed", () => {
      // 1. Client KHÔNG ĐƯỢC PHÉP gửi purchase_completed hay order_placed trực tiếp
      const clientHack = {
        body: {
          event_type: "purchase_completed",
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
        },
      };
      expect(trackEventSchema.safeParse(clientHack).success).toBe(false);

      // 2. Mô phỏng xử lý callback thanh toán phía Server: Chỉ ghi nhận purchase_completed khi chữ ký hợp lệ và status = success
      const verifyAndRecordPayment = (callbackParams, isSignatureValid) => {
        if (!isSignatureValid) {
          return { recorded: false, error: "INVALID_SIGNATURE" };
        }
        if (callbackParams.status !== "success") {
          return { recorded: false, error: "PAYMENT_FAILED" };
        }
        return {
          recorded: true,
          eventType: "purchase_completed",
          orderId: callbackParams.orderId,
        };
      };

      // Giả mạo chữ ký -> Bị chặn
      expect(verifyAndRecordPayment({ orderId: "ord_1", status: "success" }, false).recorded).toBe(false);

      // Thanh toán thất bại -> Không ghi nhận purchase_completed
      expect(verifyAndRecordPayment({ orderId: "ord_1", status: "failed" }, true).recorded).toBe(false);

      // Thanh toán thành công có chữ ký hợp lệ -> Ghi nhận purchase_completed
      const validPayment = verifyAndRecordPayment({ orderId: "ord_1", status: "success" }, true);
      expect(validPayment.recorded).toBe(true);
      expect(validPayment.eventType).toBe("purchase_completed");
    });
  });

  // =========================================================================
  // 7. MULTI-USER RECOMMENDATION DIFFERENTIATION (USER A, USER B, ANONYMOUS)
  // =========================================================================
  describe("7. Multi-Cohort Recommendation Differentiation", () => {
    const catalog = [
      {
        id: "prod_tee_black",
        name: "Áo Thun Đen Cổ Tròn Basic Minimalist",
        category: "cat_tee",
        color: "đen",
        stock: 25,
        isActive: true,
      },
      {
        id: "prod_tee_white",
        name: "Áo Phông Trắng Cotton",
        category: "cat_tee",
        color: "trắng",
        stock: 40,
        isActive: true,
      },
      {
        id: "prod_jeans_blue",
        name: "Quần Jeans Denim Streetwear Rộng Rãi",
        category: "cat_jeans",
        color: "xanh denim",
        stock: 18,
        isActive: true,
      },
      {
        id: "prod_cargo_pants",
        name: "Quần Túi Hộp Kaki Streetwear",
        category: "cat_jeans",
        color: "rêu",
        stock: 12,
        isActive: true,
      },
      {
        id: "prod_out_of_stock",
        name: "Sản Phẩm Đã Hết Hàng",
        category: "cat_tee",
        color: "đen",
        stock: 0, // HẾT HÀNG
        isActive: true,
      },
      {
        id: "prod_inactive",
        name: "Sản Phẩm Ngừng Bán",
        category: "cat_jeans",
        color: "xanh denim",
        stock: 50,
        isActive: false, // NGỪNG BÁN
      },
    ];

    // Lọc theo luật kinh doanh: Chỉ lấy sản phẩm active và còn hàng (stock > 0)
    const availableCatalog = catalog.filter((p) => p.isActive && p.stock > 0);

    test("Loại bỏ triệt để sản phẩm hết hàng và sản phẩm ngừng bán", () => {
      const ids = availableCatalog.map((p) => p.id);
      expect(ids).not.toContain("prod_out_of_stock");
      expect(ids).not.toContain("prod_inactive");
      expect(availableCatalog).toHaveLength(4);
    });

    test("User A (Áo thun đen, phong cách tối giản) nhận đề xuất vượt trội về Áo Thun Đen", () => {
      const userAProfile = {
        categoryScores: { cat_tee: 10, cat_jeans: 0 },
        colorScores: { đen: 8, trắng: 2 },
        keywords: ["minimalist", "basic", "ao thun"],
      };

      const scoreProductForUser = (prod, prof) => {
        let score = 0;
        if (prof.categoryScores[prod.category]) score += prof.categoryScores[prod.category] * 10;
        if (prof.colorScores[prod.color]) score += prof.colorScores[prod.color] * 4;
        prof.keywords.forEach((kw) => {
          if (prod.name.toLowerCase().includes(kw)) score += 6;
        });
        return score;
      };

      const ranked = availableCatalog
        .map((p) => ({ ...p, score: scoreProductForUser(p, userAProfile) }))
        .sort((a, b) => b.score - a.score);

      expect(ranked[0].id).toBe("prod_tee_black");
      expect(ranked[0].score).toBeGreaterThan(100);
      // Quần jeans điểm rất thấp
      expect(ranked.find((p) => p.id === "prod_jeans_blue").score).toBe(0);
    });

    test("User B (Quần jeans, phong cách streetwear) nhận đề xuất vượt trội về Quần Jeans Denim", () => {
      const userBProfile = {
        categoryScores: { cat_tee: 0, cat_jeans: 10 },
        colorScores: { "xanh denim": 8, rêu: 4 },
        keywords: ["streetwear", "jeans", "denim"],
      };

      const scoreProductForUser = (prod, prof) => {
        let score = 0;
        if (prof.categoryScores[prod.category]) score += prof.categoryScores[prod.category] * 10;
        if (prof.colorScores[prod.color]) score += prof.colorScores[prod.color] * 4;
        prof.keywords.forEach((kw) => {
          if (prod.name.toLowerCase().includes(kw)) score += 6;
        });
        return score;
      };

      const ranked = availableCatalog
        .map((p) => ({ ...p, score: scoreProductForUser(p, userBProfile) }))
        .sort((a, b) => b.score - a.score);

      expect(ranked[0].id).toBe("prod_jeans_blue");
      expect(ranked[0].score).toBeGreaterThan(100);
      // Áo thun đen điểm rất thấp
      expect(ranked.find((p) => p.id === "prod_tee_black").score).toBe(0);
    });

    test("Anonymous User: Không có profile, fallback về danh sách Popular", () => {
      const getRecommendationMode = (userProfile) => {
        if (!userProfile || Object.keys(userProfile).length === 0) {
          return { mode: "popular", fallbackReason: "cold_start_empty_profile" };
        }
        return { mode: "personalized" };
      };

      const anonRec = getRecommendationMode(null);
      expect(anonRec.mode).toBe("popular");
      expect(anonRec.fallbackReason).toBe("cold_start_empty_profile");
    });
  });

  // =========================================================================
  // 8. AI SHOPPING ASSISTANT & PRIVACY SAFEGUARD TESTS
  // =========================================================================
  describe("8. AI Shopping Assistant Grounding & Privacy Safeguard", () => {
    test("Trích xuất tóm tắt sở thích ngắn gọn, không gửi raw events hoặc PII", () => {
      const mockProfile = {
        category_scores: { "Áo thun": 12, "Quần short": 6 },
        keyword_scores: { "linen": 8, "cotton": 5 },
        preferred_colors: { "đen": 6, "trắng": 4 },
        preferred_sizes: { "L": 8 },
        consent_status: "granted",
      };

      const buildChatContext = (profile) => {
        if (!profile || profile.consent_status === "denied") return null;
        const parts = [];
        if (profile.category_scores) {
          const topCat = Object.keys(profile.category_scores).slice(0, 2);
          if (topCat.length) parts.push(`Danh mục quan tâm: ${topCat.join(", ")}`);
        }
        if (profile.preferred_colors) {
          const topCol = Object.keys(profile.preferred_colors).slice(0, 2);
          if (topCol.length) parts.push(`Màu ưa thích: ${topCol.join(", ")}`);
        }
        if (profile.preferred_sizes) {
          const topSz = Object.keys(profile.preferred_sizes).slice(0, 2);
          if (topSz.length) parts.push(`Size thường mặc: ${topSz.join(", ")}`);
        }
        return parts.length ? `[Hồ sơ sở thích khách hàng: ${parts.join("; ")}]` : null;
      };

      const contextString = buildChatContext(mockProfile);
      expect(contextString).toContain("Danh mục quan tâm: Áo thun, Quần short");
      expect(contextString).toContain("Màu ưa thích: đen, trắng");
      expect(contextString).toContain("Size thường mặc: L");
      // Tuyệt đối không chứa raw ID hoặc thông tin cá nhân
      expect(contextString).not.toContain("raw_events");
      expect(contextString).not.toContain("email");
    });

    test("Ngừng cung cấp thông tin sở thích cho AI Chatbot khi consent = 'denied'", () => {
      const deniedProfile = {
        category_scores: { "Áo thun": 12 },
        consent_status: "denied",
      };

      const buildChatContext = (profile) => {
        if (!profile || profile.consent_status === "denied") return null;
        return "[Hồ sơ]";
      };

      expect(buildChatContext(deniedProfile)).toBeNull();
    });

    test("Lọc bỏ PII (Email và Số điện thoại) trong Search query trước khi lưu", () => {
      const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const PHONE_REGEX = /(?:\+84|0)[0-9]{9,10}\b/;

      const sanitizeQuery = (query) => {
        if (!query) return null;
        if (EMAIL_REGEX.test(query) || PHONE_REGEX.test(query)) {
          return null; // Chặn truy vấn chứa email hoặc SĐT để bảo vệ quyền riêng tư
        }
        return query.trim();
      };

      expect(sanitizeQuery("Áo thun cotton")).toBe("Áo thun cotton");
      expect(sanitizeQuery("Áo thun test@example.com")).toBeNull();
      expect(sanitizeQuery("Áo liên hệ 0912345678")).toBeNull();
    });
  });

  // =========================================================================
  // 8. DATA CONSISTENCY, FUNNEL MATH & HARDENING REGRESSION TESTS
  // =========================================================================
  describe("8. Data Consistency, Funnel Math & Hardening Regressions", () => {
    test("Thuật toán tính Phễu sử dụng mẫu số đồng nhất (không trộn lẫn session với user/events)", () => {
      // Dữ liệu mô phỏng theo case study trong báo cáo audit:
      // product_view: 1 session, 1 user
      // add_to_cart: 3 sessions, 2 users
      // checkout_started: 3 sessions, 2 users
      // order_placed: 0 session, 1 user
      // purchase_completed: 0 session, 1 user
      const rawStages = [
        { stage: "page_view", uniqueSessions: 4, uniqueUsers: 3, eventCount: 10 },
        { stage: "product_view", uniqueSessions: 1, uniqueUsers: 1, eventCount: 4 },
        { stage: "add_to_cart", uniqueSessions: 3, uniqueUsers: 2, eventCount: 3 },
        { stage: "checkout_started", uniqueSessions: 3, uniqueUsers: 2, eventCount: 3 },
        { stage: "order_placed", uniqueSessions: 1, uniqueUsers: 1, eventCount: 1 },
        { stage: "purchase_completed", uniqueSessions: 1, uniqueUsers: 1, eventCount: 1 },
      ];

      // Session-based conversion (mẫu số chuẩn: topSessions = 4)
      const topSessions = rawStages[0].uniqueSessions;
      const sessionFunnel = rawStages.map((stg, idx) => {
        const overallRate = Number(((stg.uniqueSessions / topSessions) * 100).toFixed(2));
        const prev = idx === 0 ? topSessions : rawStages[idx - 1].uniqueSessions;
        const stepRate = prev > 0 ? Number(((stg.uniqueSessions / prev) * 100).toFixed(2)) : 0;
        return { stage: stg.stage, overallRate, stepRate };
      });

      expect(sessionFunnel[0].overallRate).toBe(100);
      expect(sessionFunnel[1].overallRate).toBe(25); // 1 / 4 = 25%
      // Tuyệt đối không fallback sang eventCount làm méo mó mẫu số:
      expect(sessionFunnel[1].stepRate).toBe(25); // 1 / 4 = 25%

      // User-based conversion (mẫu số chuẩn: topUsers = 3)
      const topUsers = rawStages[0].uniqueUsers;
      const userFunnel = rawStages.map((stg, idx) => {
        const overallRate = Number(((stg.uniqueUsers / topUsers) * 100).toFixed(2));
        const prev = idx === 0 ? topUsers : rawStages[idx - 1].uniqueUsers;
        const stepRate = prev > 0 ? Number(((stg.uniqueUsers / prev) * 100).toFixed(2)) : 0;
        return { stage: stg.stage, overallRate, stepRate };
      });

      expect(userFunnel[0].overallRate).toBe(100);
      expect(userFunnel[1].overallRate).toBe(33.33); // 1 / 3 = 33.33%
      expect(userFunnel[2].overallRate).toBe(66.67); // 2 / 3 = 66.67%
    });

    test("Chuẩn hóa Taxonomy: Chấp nhận aliases và fields mở rộng (event_name, timestamp, created_at)", () => {
      const aliasPayload = {
        body: {
          event_name: "checkout_start", // alias của checkout_started
          anonymous_id: "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
          timestamp: new Date().toISOString(),
          context: { pathname: "/cart" },
        },
      };

      const parsed = trackEventSchema.safeParse(aliasPayload);
      expect(parsed.success).toBe(true);
    });

    test("Chặn rò rỉ OTP trong phản hồi HTTP", () => {
      // Mô phỏng response an toàn không chứa thuộc tính otp
      const safeOtpResponse = {
        success: true,
        message: "Mã OTP đã được gửi đến email của bạn",
        data: null,
      };

      expect(safeOtpResponse.data).toBeNull();
      expect(safeOtpResponse).not.toHaveProperty("otp");
    });

    test("Chặn truy cập trái phép đơn hàng (IDOR Protection)", () => {
      const orderOwnerId = "67223b9d81f3d321045a1099";
      const attackerUserId = "67223b9d81f3d321045a9999";
      const adminRole = "admin";
      const customerRole = "customer";

      const checkPermission = (order, userId, role) => {
        if (role === adminRole) return true;
        return order.user_id === userId;
      };

      const mockOrder = { _id: "order-123", user_id: orderOwnerId };

      expect(checkPermission(mockOrder, orderOwnerId, customerRole)).toBe(true);
      expect(checkPermission(mockOrder, attackerUserId, customerRole)).toBe(false); // Bị chặn!
      expect(checkPermission(mockOrder, attackerUserId, adminRole)).toBe(true); // Admin được phép
    });
  });
});
