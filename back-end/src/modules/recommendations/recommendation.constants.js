/**
 * Recommendation System Constants
 */

// Ngưỡng điểm tối thiểu để đạt chế độ cá nhân hóa hoàn toàn (personalized)
export const PERSONALIZED_MIN_SCORE = 3;

// Cache Redis cho danh sách phổ biến (popular) dùng chung mọi người
export const POPULAR_CACHE_TTL = 600; // 10 phút (giây)
export const POPULAR_CACHE_KEY_PREFIX = "recommendations:popular";

// Tỉ lệ phân bổ 3 nguồn trong danh sách phổ biến (ví dụ limit 8: 3 bán chạy, 3 mới về, 2 nổi bật)
export const POPULAR_SOURCE_WEIGHTS = {
  bestSelling: 3 / 8,
  newArrivals: 3 / 8,
  featured: 2 / 8,
};

// Trọng số cho thuật toán xếp hạng hỗn hợp (Hybrid Ranking: Vector AI + Behavioral Profile + Business Rules)
export const HYBRID_RANKING_WEIGHTS = {
  vectorSimilarity: 12, // Độ tương đồng vector embedding (Cosine Similarity 0-1)
  categoryAffinity: 10, // Điểm thân thuộc theo danh mục
  keywordMatch: 8,      // Trùng khớp từ khóa tìm kiếm
  brandAffinity: 4,     // Trùng khớp thương hiệu yêu thích
  colorAffinity: 3,     // Trùng khớp màu sắc ưa thích
  sizeAffinity: 2,      // Có kích cỡ thường chọn
  priceRangeMatch: 5,   // Nằm trong khoảng giá quan tâm
  productRating: 0.5,   // Đánh giá sao của sản phẩm (0-5)
  productPopularity: 0.02, // Số lượng đã bán (capped tại 100)
  saleBonus: 1.5,       // Đang có chương trình Flash Sale / Giảm giá
};
