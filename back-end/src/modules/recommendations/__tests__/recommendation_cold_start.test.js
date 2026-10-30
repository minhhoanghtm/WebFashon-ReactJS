import { jest } from "@jest/globals";
import mongoose from "mongoose";

// ============================================================================
// IN-MEMORY MOCKS CHO RECOMMENDATION COLD-START TEST
// Không kết nối DB thật, không ghi/xóa Redis thật
// ============================================================================

// 1. Mock Redis (offline/null để tránh phụ thuộc network)
jest.unstable_mockModule("../../../configs/redis.js", () => ({
  getRedisConnection: jest.fn().mockReturnValue(null),
}));

// 2. Mock Order & OrderItem
jest.unstable_mockModule("../../orders/order.model.js", () => ({
  Order: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
  OrderItem: {
    find: jest.fn().mockReturnValue({
      distinct: jest.fn().mockResolvedValue([]),
    }),
  },
}));

// 3. Mock PricingService
const mockPricingService = {
  getActiveCampaignsBundle: jest.fn().mockResolvedValue({
    campaigns: [],
    campaignProducts: [],
  }),
  resolvePrice: jest.fn().mockImplementation((product) => ({
    finalPrice: product.new_price || product.price || 100000,
    originalPrice: product.old_price || product.price || 100000,
    campaignId: null,
    type: null,
    remainingQuota: null,
    isSale: false,
  })),
};
jest.unstable_mockModule("../../campaigns/pricing.service.js", () => ({
  default: mockPricingService,
}));

// 4. Mock UserInterestProfile
const mockProfileHolder = { current: null };
jest.unstable_mockModule("../userInterestProfile.model.js", () => ({
  default: {
    findOne: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(mockProfileHolder.current),
    })),
  },
}));

// 5. Mock Product Model & In-memory collection
let mockProductsDb = [];

jest.unstable_mockModule("../../products/product.model.js", () => ({
  default: {
    find: jest.fn().mockImplementation((filter = {}) => {
      let filtered = [...mockProductsDb];

      // Lọc is_active
      if (filter.is_active !== undefined) {
        if (typeof filter.is_active === "object" && filter.is_active.$ne !== undefined) {
          filtered = filtered.filter((p) => p.is_active !== filter.is_active.$ne);
        } else {
          filtered = filtered.filter((p) => p.is_active === filter.is_active);
        }
      }

      // Lọc $nin excludeObjectIds
      if (filter._id && filter._id.$nin) {
        const excludeStr = filter._id.$nin.map((id) => id.toString());
        filtered = filtered.filter((p) => !excludeStr.includes(p._id.toString()));
      }

      // Lọc is_featured
      if (filter.is_featured === true) {
        filtered = filtered.filter((p) => p.is_featured === true);
      }

      // Lọc $or matchConditions (cho personalized matching)
      if (filter.$or && Array.isArray(filter.$or)) {
        filtered = filtered.filter((p) => {
          return filter.$or.some((cond) => {
            if (cond.category_id && p.category_id) {
              const pCat = p.category_id._id?.toString() || p.category_id.toString();
              if (cond.category_id.$in) {
                const allowed = cond.category_id.$in.map((id) => id.toString());
                return allowed.includes(pCat);
              }
              const cCat = cond.category_id._id?.toString() || cond.category_id.toString();
              return pCat === cCat;
            }
            return false;
          });
        });
      }

      const queryMock = {
        _items: filtered,
        sort: jest.fn(function (sortObj) {
          const list = [...this._items];
          if (sortObj?.sold === -1) {
            list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
          } else if (sortObj?.createdAt === -1) {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          } else if (sortObj?.rating === -1) {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          }
          this._items = list;
          return this;
        }),
        limit: jest.fn(function (n) {
          this._items = this._items.slice(0, n);
          return this;
        }),
        populate: jest.fn(function () {
          return this;
        }),
        select: jest.fn(function () {
          return this;
        }),
        lean: jest.fn(function () {
          return Promise.resolve(
            this._items.map((item) => JSON.parse(JSON.stringify(item)))
          );
        }),
      };

      return queryMock;
    }),
  },
}));

// Import dynamic sau khi mock module xong
const { default: recommendationService } = await import("../recommendation.service.js");

// ============================================================================
// BỘ DỮ LIỆU MOCK CHUẨN ĐỂ KIỂM THỬ
// ============================================================================
const catFashion = new mongoose.Types.ObjectId("650000000000000000000001");
const catFootwear = new mongoose.Types.ObjectId("650000000000000000000002");
const catAccessory = new mongoose.Types.ObjectId("650000000000000000000003");

const createMockProduct = (idStr, name, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(idStr),
  name,
  slug: `slug-${name.toLowerCase().replace(/\s+/g, "-")}`,
  is_active: true,
  is_featured: false,
  category_id: { _id: catFashion, name: "Thời trang" },
  variants: [{ _id: new mongoose.Types.ObjectId(), stock: 20, color: "Black", size: "M" }],
  price: 250000,
  new_price: 250000,
  old_price: 300000,
  sold: 50,
  rating: 4.5,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

describe("Cold-Start & Popular Recommendation In-Memory Tests", () => {
  beforeEach(() => {
    mockProfileHolder.current = null;
    mockProductsDb = [];
  });

  // ==========================================================================
  // KỊCH BẢN 1: Người mới hoàn toàn
  // - mode = popular
  // - đủ limit (8 sản phẩm)
  // - không trùng lặp
  // - không chứa sản phẩm hết hàng hoặc is_active = false
  // ==========================================================================
  test("1. Người mới hoàn toàn: trả mode = 'popular', đủ limit, không trùng, loại bỏ hết hàng/is_active=false", async () => {
    // Tạo 12 sản phẩm gồm các nhóm: bán chạy, mới về, nổi bật, hết hàng, inactive
    mockProductsDb = [
      // Nhóm bán chạy (sold cao)
      createMockProduct("651000000000000000000001", "Áo Bán Chạy 1", { sold: 500, createdAt: new Date("2026-01-01") }),
      createMockProduct("651000000000000000000002", "Áo Bán Chạy 2", { sold: 400, createdAt: new Date("2026-01-02") }),
      createMockProduct("651000000000000000000003", "Áo Bán Chạy 3", { sold: 300, createdAt: new Date("2026-01-03") }),

      // Nhóm mới về (createdAt gần)
      createMockProduct("651000000000000000000004", "Áo Mới Về 1", { sold: 10, createdAt: new Date("2026-10-25") }),
      createMockProduct("651000000000000000000005", "Áo Mới Về 2", { sold: 5, createdAt: new Date("2026-10-26") }),
      createMockProduct("651000000000000000000006", "Áo Mới Về 3", { sold: 2, createdAt: new Date("2026-10-27") }),

      // Nhóm nổi bật (is_featured: true)
      createMockProduct("651000000000000000000007", "Áo Nổi Bật 1", { is_featured: true, rating: 4.8 }),
      createMockProduct("651000000000000000000008", "Áo Nổi Bật 2", { is_featured: true, rating: 4.9 }),

      // Sản phẩm HẾT HÀNG (tổng variant.stock = 0) -> Bắt buộc bị loại bỏ!
      createMockProduct("651000000000000000000009", "Áo Hết Hàng", {
        variants: [{ stock: 0 }, { stock: 0 }],
        sold: 9999,
      }),

      // Sản phẩm INACTIVE (is_active = false) -> Bắt buộc bị loại bỏ!
      createMockProduct("651000000000000000000010", "Áo Đã Ngừng Bán", {
        is_active: false,
        sold: 8888,
      }),
    ];

    // Người mới hoàn toàn: profile = null
    const result = await recommendationService.getRecommendations({
      anonymousId: "anon-cold-start-001",
      limit: 8,
    });

    // 1. Kiểm tra mode
    expect(result.mode).toBe("popular");

    // 2. Kiểm tra đủ limit 8
    expect(result.products.length).toBe(8);

    // 3. Không trùng lặp
    const productIds = result.products.map((p) => p._id.toString());
    const uniqueIds = new Set(productIds);
    expect(uniqueIds.size).toBe(productIds.length);

    // 4. Không chứa sản phẩm hết hàng hoặc inactive
    expect(productIds).not.toContain("651000000000000000000009");
    expect(productIds).not.toContain("651000000000000000000010");
  });

  // ==========================================================================
  // KỊCH BẢN 2: Người có ít hành vi (1-2 sự kiện, totalScore < 3)
  // - mode = mixed
  // - phần sở thích đứng trước
  // - bù phần còn lại bằng sản phẩm phổ biến không trùng
  // ==========================================================================
  test("2. Người có 1-2 sự kiện: trả mode = 'mixed', sở thích đứng trước, bù phổ biến không trùng", async () => {
    // Sản phẩm thuộc danh mục catFootwear (sở thích của người dùng)
    const userInterestProduct = createMockProduct("652000000000000000000001", "Giày Sneaker Yêu Thích", {
      category_id: { _id: catFootwear, name: "Giày dép" },
      sold: 10,
    });

    // Các sản phẩm phổ biến khác
    const otherProducts = Array.from({ length: 10 }).map((_, i) =>
      createMockProduct(
        `6520000000000000000000${(i + 2).toString().padStart(2, "0")}`,
        `Sản phẩm phổ biến ${i + 1}`,
        {
          sold: 100 - i * 5,
          createdAt: new Date(`2026-05-${(i + 1).toString().padStart(2, "0")}`),
        }
      )
    );

    mockProductsDb = [userInterestProduct, ...otherProducts];

    // Profile chỉ có 1-2 sự kiện (ví dụ xem 1 sản phẩm -> 1 điểm < 3)
    mockProfileHolder.current = {
      user_id: new mongoose.Types.ObjectId("652999999999999999999999"),
      total_events: 1,
      total_score: 1,
      category_scores: new Map([[catFootwear.toString(), 1]]),
      keyword_scores: new Map(),
      price_preference: { min: 200000, max: 400000 },
    };

    const result = await recommendationService.getRecommendations({
      userId: "652999999999999999999999",
      limit: 8,
    });

    // 1. Mode phải là mixed
    expect(result.mode).toBe("mixed");

    // 2. Đủ 8 sản phẩm
    expect(result.products.length).toBe(8);

    // 3. Sản phẩm sở thích (Giày Sneaker) phải đứng đầu danh sách
    expect(result.products[0]._id.toString()).toBe("652000000000000000000001");

    // 4. Các sản phẩm còn lại không trùng lặp với sản phẩm sở thích
    const remainingIds = result.products.slice(1).map((p) => p._id.toString());
    expect(remainingIds).not.toContain("652000000000000000000001");
    expect(new Set(result.products.map((p) => p._id.toString())).size).toBe(8);
  });

  // ==========================================================================
  // KỊCH BẢN 3: Người có nhiều hành vi (totalScore >= 3)
  // - mode = personalized
  // - toàn bộ kết quả từ sản phẩm sở thích
  // ==========================================================================
  test("3. Người có nhiều hành vi (totalScore >= 3): trả mode = 'personalized'", async () => {
    // Chuẩn bị 10 sản phẩm đều thuộc danh mục thời trang catFashion
    mockProductsDb = Array.from({ length: 10 }).map((_, i) =>
      createMockProduct(
        `6530000000000000000000${(i + 1).toString().padStart(2, "0")}`,
        `Thời trang Fashion ${i + 1}`,
        {
          category_id: { _id: catFashion, name: "Thời trang" },
          sold: 50 + i * 10,
          rating: 4.0 + (i % 5) * 0.2,
        }
      )
    );

    // Profile người dùng tích cực: điểm catFashion = 15 >= 3
    mockProfileHolder.current = {
      user_id: new mongoose.Types.ObjectId("653999999999999999999999"),
      total_events: 5,
      total_score: 15,
      category_scores: new Map([[catFashion.toString(), 15]]),
      keyword_scores: new Map([["thời trang", 8]]),
      price_preference: { min: 200000, max: 400000 },
    };

    const result = await recommendationService.getRecommendations({
      userId: "653999999999999999999999",
      limit: 8,
    });

    // Kiểm tra mode là personalized
    expect(result.mode).toBe("personalized");
    expect(result.products.length).toBe(8);

    // Toàn bộ sản phẩm trả về thuộc sở thích
    for (const p of result.products) {
      expect(p.category_id.toString()).toBe(catFashion.toString());
    }
  });

  // ==========================================================================
  // KỊCH BẢN 4: Hệ thống ít sản phẩm (tổng khả dụng < limit)
  // - không lỗi / crash
  // - trả đúng số lượng có
  // ==========================================================================
  test("4. Hệ thống ít sản phẩm (3 sản phẩm < limit 8): không crash, trả đúng 3 sản phẩm", async () => {
    // Hệ thống chỉ có 3 sản phẩm còn hàng
    mockProductsDb = [
      createMockProduct("654000000000000000000001", "Sản phẩm A", { sold: 30 }),
      createMockProduct("654000000000000000000002", "Sản phẩm B", { sold: 20 }),
      createMockProduct("654000000000000000000003", "Sản phẩm C", { sold: 10 }),
    ];

    // Người dùng mới hoàn toàn yêu cầu limit = 8
    const result = await recommendationService.getRecommendations({
      anonymousId: "anon-few-products",
      limit: 8,
    });

    expect(result.mode).toBe("popular");
    // Trả đúng 3 sản phẩm hiện có mà không bị lỗi mảng hoặc undefined
    expect(result.products.length).toBe(3);
    const names = result.products.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["Sản phẩm A", "Sản phẩm B", "Sản phẩm C"]));
  });

  // ==========================================================================
  // KỊCH BẢN 5: Chưa có sản phẩm is_featured: fallback rating cao nhất
  // ==========================================================================
  test("5. Chưa có is_featured = true: fallback sang sản phẩm có rating cao nhất", async () => {
    // Tất cả sản phẩm đều có is_featured = false
    mockProductsDb = [
      createMockProduct("655000000000000000000001", "Áo Rating 5 sao", { is_featured: false, rating: 5.0, sold: 10 }),
      createMockProduct("655000000000000000000002", "Áo Rating 4.9 sao", { is_featured: false, rating: 4.9, sold: 15 }),
      createMockProduct("655000000000000000000003", "Áo Rating 3.0 sao", { is_featured: false, rating: 3.0, sold: 100 }),
      createMockProduct("655000000000000000000004", "Áo Rating 2.5 sao", { is_featured: false, rating: 2.5, sold: 200 }),
    ];

    const popular = await recommendationService.getPopularProducts({ limit: 4 });

    // Đảm bảo không lỗi và danh sách phổ biến vẫn lấy được sản phẩm
    expect(popular.length).toBeGreaterThan(0);

    // Sản phẩm rating cao (5.0 và 4.9) phải nằm trong danh sách trả về nhờ fallback
    const names = popular.map((p) => p.name);
    expect(names).toContain("Áo Rating 5 sao");
    expect(names).toContain("Áo Rating 4.9 sao");
  });
});
