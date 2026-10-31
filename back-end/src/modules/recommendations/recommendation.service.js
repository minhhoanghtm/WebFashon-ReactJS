import mongoose from "mongoose";
import UserInterestProfile from "./userInterestProfile.model.js";
import Product from "../products/product.model.js";
import { Order, OrderItem } from "../orders/order.model.js";
import { getRedisConnection } from "../../configs/redis.js";
import { RECOMMENDATION_CACHE_TTL } from "../tracking/tracking.constants.js";
import {
  PERSONALIZED_MIN_SCORE,
  POPULAR_CACHE_TTL,
  POPULAR_CACHE_KEY_PREFIX,
  HYBRID_RANKING_WEIGHTS,
} from "./recommendation.constants.js";
import { normalizeKeyword } from "../../common/utils/normalizeKeyword.js";
import pricingService from "../campaigns/pricing.service.js";
import VectorEmbedding from "../ai/models/vectorEmbedding.model.js";
import semanticSearchService, { cosineSimilarity } from "../ai/services/semanticSearch.service.js";
import experimentService, { DEFAULT_REC_EXPERIMENT_ID } from "./experiments/experiment.service.js";

/**
 * Xóa cache danh sách phổ biến (popular) trong Redis khi admin tạo/sửa/xóa sản phẩm
 */
export async function invalidatePopularRecommendationsCache() {
  try {
    const redis = getRedisConnection();
    if (!redis) return;
    const stream = redis.scanStream({ match: `${POPULAR_CACHE_KEY_PREFIX}:*` });
    for await (const keys of stream) {
      if (keys && keys.length) {
        await redis.del(...keys);
      }
    }
  } catch (err) {
    console.warn("[Recommendation] Lỗi khi xóa cache popular recommendations:", err.message);
  }
}

class RecommendationService {
  /**
   * Helper lọc tồn kho an toàn: kiểm tra tổng variant.stock > 0 hoặc product.stock > 0
   */
  filterInStock(rawProducts) {
    if (!Array.isArray(rawProducts)) return [];
    return rawProducts.filter((product) => {
      let totalStock = 0;
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      } else {
        totalStock = Number(product.stock) || 0;
      }
      product.calculatedStock = totalStock;
      return totalStock > 0;
    });
  }

  /**
   * Tạo danh sách phổ biến (popular) trộn từ 3 nguồn:
   * 1. Bán chạy: sort sold giảm dần
   * 2. Mới về: sort createdAt giảm dần
   * 3. Nổi bật: ưu tiên đang sale (nếu có campaign) -> is_featured: true -> fallback rating cao nhất
   * Trộn xen kẽ (interleaved) và loại trừ trùng lặp
   */
  async getPopularProducts({ limit = 8, excludeIds = new Set() }) {
    const finalLimit = Math.max(1, limit);
    const excludeObjectIds = [...excludeIds]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Tính quota cho 3 nhóm theo tỉ lệ limit
    const targetBestSelling = Math.max(1, Math.round((finalLimit * 3) / 8));
    const targetNewArrivals = Math.max(1, Math.round((finalLimit * 3) / 8));
    const targetFeatured = Math.max(1, finalLimit - targetBestSelling - targetNewArrivals);

    const baseFilter = {
      is_active: { $ne: false },
      _id: { $nin: excludeObjectIds },
    };

    // 1. Nhóm Bán chạy (Best Selling)
    let inStockBestSelling = [];
    try {
      const rawBestSelling = await Product.find(baseFilter)
        .sort({ sold: -1, rating: -1, createdAt: -1 })
        .limit(finalLimit * 3)
        .populate("variants")
        .populate("category_id", "name")
        .lean();
      inStockBestSelling = this.filterInStock(rawBestSelling);
    } catch (err) {
      console.warn("[Recommendation] Lỗi truy vấn best selling:", err.message);
    }

    // 2. Nhóm Mới về (New Arrivals)
    let inStockNewArrivals = [];
    try {
      const rawNewArrivals = await Product.find(baseFilter)
        .sort({ createdAt: -1, sold: -1 })
        .limit(finalLimit * 3)
        .populate("variants")
        .populate("category_id", "name")
        .lean();
      inStockNewArrivals = this.filterInStock(rawNewArrivals);
    } catch (err) {
      console.warn("[Recommendation] Lỗi truy vấn new arrivals:", err.message);
    }

    // 3. Nhóm Nổi bật (Featured):
    let inStockFeatured = [];
    try {
      const activeBundle = await pricingService.getActiveCampaignsBundle(new Date()).catch(() => null);
      const campaignProducts = activeBundle?.campaignProducts || [];

      if (campaignProducts.length > 0) {
        const saleProductIds = [
          ...new Set(
            campaignProducts
              .map((cp) => cp.product_id?.toString() || cp.product_id)
              .filter((id) => id && mongoose.Types.ObjectId.isValid(id) && !excludeIds.has(id.toString()))
          ),
        ].map((id) => new mongoose.Types.ObjectId(id));

        if (saleProductIds.length > 0) {
          const rawSale = await Product.find({
            ...baseFilter,
            _id: { $in: saleProductIds },
          })
            .limit(targetFeatured * 2)
            .populate("variants")
            .populate("category_id", "name")
            .lean();
          inStockFeatured.push(...this.filterInStock(rawSale));
        }
      }

      // Tìm sản phẩm có is_featured = true
      const rawFeaturedFlagged = await Product.find({
        ...baseFilter,
        is_featured: true,
      })
        .sort({ rating: -1, sold: -1, createdAt: -1 })
        .limit(targetFeatured * 3)
        .populate("variants")
        .populate("category_id", "name")
        .lean();
      inStockFeatured.push(...this.filterInStock(rawFeaturedFlagged));

      // Fallback: nếu chưa đủ nổi bật, lấy theo rating cao nhất
      const rawTopRated = await Product.find(baseFilter)
        .sort({ rating: -1, sold: -1, createdAt: -1 })
        .limit(finalLimit * 3)
        .populate("variants")
        .populate("category_id", "name")
        .lean();
      inStockFeatured.push(...this.filterInStock(rawTopRated));
    } catch (err) {
      console.warn("[Recommendation] Lỗi truy vấn featured:", err.message);
    }

    // Phân bổ vào 3 nhóm không trùng lặp
    const seenIds = new Set(excludeIds.values());
    const pickUnique = (pool, count) => {
      const picked = [];
      for (const item of pool) {
        const idStr = item._id.toString();
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          picked.push(item);
          if (picked.length >= count) break;
        }
      }
      return picked;
    };

    const bestSellingPicked = pickUnique(inStockBestSelling, targetBestSelling);
    const newArrivalsPicked = pickUnique(inStockNewArrivals, targetNewArrivals);
    const featuredPicked = pickUnique(inStockFeatured, targetFeatured);

    // Bù phần còn thiếu nếu một nhóm không đủ suất
    let totalPicked = bestSellingPicked.length + newArrivalsPicked.length + featuredPicked.length;
    if (totalPicked < finalLimit) {
      const remainingNeeded = finalLimit - totalPicked;
      const combinedPool = [...inStockBestSelling, ...inStockNewArrivals, ...inStockFeatured];
      const backfill = pickUnique(combinedPool, remainingNeeded);
      featuredPicked.push(...backfill);
    }

    // Trộn xen kẽ các nhóm (interleaved: B1, N1, F1, B2, N2, F2, ...)
    const interleaved = [];
    const pools = [bestSellingPicked, newArrivalsPicked, featuredPicked];
    let round = 0;
    let addedAny = true;

    while (interleaved.length < finalLimit && addedAny) {
      addedAny = false;
      for (let i = 0; i < pools.length; i++) {
        if (pools[i].length > round && interleaved.length < finalLimit) {
          interleaved.push(pools[i][round]);
          addedAny = true;
        }
      }
      round++;
    }

    return interleaved;
  }

  /**
   * Lấy danh sách phổ biến có cache Redis dùng chung mọi người (TTL 10 phút)
   */
  async getPopularProductsCached({ limit = 8, excludeIds = new Set() }) {
    const redis = getRedisConnection();
    const canUseCache = excludeIds.size === 0;
    const cacheKey = `${POPULAR_CACHE_KEY_PREFIX}:${limit}`;

    if (redis && canUseCache) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        // Bỏ qua lỗi đọc cache Redis
      }
    }

    const popular = await this.getPopularProducts({ limit, excludeIds });

    if (redis && canUseCache && Array.isArray(popular) && popular.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(popular), "EX", POPULAR_CACHE_TTL || 600);
      } catch (err) {
        // Bỏ qua lỗi ghi cache Redis
      }
    }

    return popular;
  }

  /**
   * Định dạng sản phẩm chuẩn hóa hiển thị đồng nhất cho ProductCard
   */
  async formatProducts(rawProducts, userId = null) {
    let activeBundle = null;
    try {
      activeBundle = await pricingService.getActiveCampaignsBundle(new Date());
    } catch {
      activeBundle = null;
    }

    return await Promise.all(
      rawProducts.map(async (product) => {
        let resolved = product.pricingResolved;
        if (!resolved) {
          try {
            resolved = await pricingService.resolvePrice(product, null, new Date(), userId, activeBundle);
          } catch {
            const rawPrice = Number(product.new_price ?? product.price ?? 0);
            resolved = {
              finalPrice: rawPrice,
              originalPrice: Number(product.old_price ?? product.oldPrice ?? rawPrice),
              isSale: false,
              discountPercentage: 0,
            };
          }
        }

        const variantsList = Array.isArray(product.variants) ? product.variants : [];
        const calcStock =
          product.calculatedStock !== undefined
            ? product.calculatedStock
            : variantsList.length > 0
            ? variantsList.reduce((sum, v) => sum + (v.stock || 0), 0)
            : Number(product.stock) || 0;

        const pIdStr = product._id ? product._id.toString() : "";

        return {
          _id: product._id,
          id: pIdStr,
          name: product.name || "Sản phẩm thời trang",
          slug: product.slug || pIdStr,
          displayProduct:
            Array.isArray(product.displayProduct) && product.displayProduct.length > 0
              ? product.displayProduct
              : product.image
              ? [product.image]
              : [],
          price: resolved?.finalPrice ?? Number(product.new_price ?? product.price ?? 0),
          new_price: resolved?.finalPrice ?? Number(product.new_price ?? product.price ?? 0),
          oldPrice: resolved?.isSale
            ? resolved.originalPrice
            : Number(product.old_price ?? product.oldPrice ?? 0),
          old_price: resolved?.isSale
            ? resolved.originalPrice
            : Number(product.old_price ?? product.oldPrice ?? 0),
          rating: Number(product.rating ?? 0),
          sold: Number(product.sold ?? 0),
          stock: calcStock,
          category: product.category_id?.name || "Thời trang",
          category_id: product.category_id?._id || product.category_id || null,
          variants: variantsList,
          brand: product.brand || "",
          campaign: resolved?.campaignId
            ? {
                id: resolved.campaignId,
                name: resolved.campaignName,
                type: resolved.type,
                remainingQuota: resolved.remainingQuota,
                discountPercentage: resolved.discountPercentage,
                isSale: resolved.isSale,
              }
            : null,
        };
      })
    );
  }

  /**
   * Tính toán Vector Centroid (tổng hợp vector đại diện sở thích) từ các sản phẩm người dùng tương tác gần đây
   */
  async _computeUserVectorCentroid(recentProductIds) {
    if (mongoose.connection?.readyState !== 1) {
      return null;
    }
    if (!Array.isArray(recentProductIds) || recentProductIds.length === 0) {
      return null;
    }

    try {
      const validIds = recentProductIds
        .map((id) => (id?._id || id).toString())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (validIds.length === 0) return null;

      const embeddings = await VectorEmbedding.find({
        sourceType: "product",
        sourceId: { $in: validIds },
        embedding: { $exists: true, $ne: [] },
      })
        .select("sourceId embedding")
        .lean();

      if (!embeddings || embeddings.length === 0) return null;

      const dim = embeddings[0].embedding.length;
      const centroid = new Array(dim).fill(0);

      for (const item of embeddings) {
        if (Array.isArray(item.embedding) && item.embedding.length === dim) {
          for (let i = 0; i < dim; i++) {
            centroid[i] += item.embedding[i];
          }
        }
      }

      for (let i = 0; i < dim; i++) {
        centroid[i] /= embeddings.length;
      }

      return centroid;
    } catch (err) {
      console.warn("[Recommendation] Lỗi tính vector centroid:", err.message);
      return null;
    }
  }

  /**
   * Lấy danh sách đề xuất cá nhân hóa tích hợp Vector AI & Hybrid Ranking:
   * 1. Ứng viên từ Behavioral Profile (Danh mục + Từ khóa + Kích cỡ + Màu sắc + Khoảng giá)
   * 2. Ứng viên từ Vector Semantic Search (Độ tương đồng ngữ nghĩa từ VectorEmbeddings)
   * 3. Hybrid Scoring kết hợp trọng số chuẩn hóa
   * 4. Fallback nhiều tầng đảm bảo luôn trả về sản phẩm nếu kho còn hàng
   */
  async getRecommendations({ userId, anonymousId, limit = 12 }) {
    const finalLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

    try {
      const redis = getRedisConnection();
      const requestId = new mongoose.Types.ObjectId().toString();

      // 1. Phân nhóm thử nghiệm A/B Testing tất định (Deterministic Assignment < 1ms)
      const targetExperimentId = process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID;
      const assignment = await experimentService.assignVariant(userId || anonymousId, {
        userId,
        anonymousId,
        experimentId: targetExperimentId,
      });

      // 2. Kiểm tra cache Redis riêng theo người dùng và nhóm thử nghiệm (Variant-differentiated Cache)
      const cacheIdentifier = userId ? `u:${userId}` : `a:${anonymousId || "guest"}`;
      const expPart = assignment?.experiment_id ? `:exp:${assignment.experiment_id}:var:${assignment.variant}` : "";
      const userCacheKey = `recommendations:${cacheIdentifier}${expPart}:limit:${finalLimit}`;

      if (redis) {
        try {
          const cached = await redis.get(userCacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.mode && Array.isArray(parsed.products) && parsed.products.length > 0) {
              return parsed;
            }
          }
        } catch {
          // Bỏ qua lỗi đọc Redis
        }
      }

      // 3. Tìm danh sách sản phẩm cần loại trừ (đã mua, đã tương tác rất gần):
      const excludeIds = new Set();
      let profile = null;

      try {
        const profileFilter = userId
          ? { user_id: new mongoose.Types.ObjectId(userId) }
          : anonymousId
          ? { anonymous_id: anonymousId }
          : null;

        if (profileFilter) {
          profile = await UserInterestProfile.findOne(profileFilter).lean();
        }
      } catch (err) {
        console.warn("Lỗi khi tìm UserInterestProfile:", err.message);
      }

      // Nếu người dùng đã từ chối theo dõi (consent = denied), chỉ trả về phổ biến không cá nhân hóa
      let isConsentDenied = profile?.consent_status === "denied" || assignment?.reason === "consent_denied";
      if (!isConsentDenied && redis) {
        const checkIdentities = [];
        if (userId) checkIdentities.push(userId.toString(), `u:${userId}`);
        if (anonymousId) checkIdentities.push(anonymousId.toString(), `a:${anonymousId}`);
        for (const cid of checkIdentities) {
          try {
            const deniedVal = await redis.get(`consent:denied:${cid}`);
            if (deniedVal === "1") {
              isConsentDenied = true;
              break;
            }
          } catch {}
        }
      }

      if (isConsentDenied) {
        const popularProducts = await this.getPopularProductsCached({ limit: finalLimit });
        const formatted = await this.formatProducts(popularProducts, userId);
        return {
          mode: "popular",
          products: formatted,
          experiment: {
            experiment_id: assignment?.experiment_id || null,
            variant: "A",
            request_id: requestId,
            reason: "consent_denied",
          },
        };
      }

      if (profile?.recent_product_ids && Array.isArray(profile.recent_product_ids)) {
        profile.recent_product_ids.slice(0, 3).forEach((id) => {
          if (id) excludeIds.add(id.toString());
        });
      }

      // Loại trừ các sản phẩm đã mua thành công
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const userOrders = await Order.find({
            user_id: new mongoose.Types.ObjectId(userId),
            status: { $nin: ["cancelled"] },
          })
            .select("_id")
            .lean();

          if (userOrders.length > 0) {
            const orderIds = userOrders.map((o) => o._id);
            const purchasedItems = await OrderItem.find({
              order_id: { $in: orderIds },
            })
              .select("product_id")
              .lean();

            purchasedItems.forEach((item) => {
              if (item.product_id) {
                const pIdStr = (item.product_id._id || item.product_id).toString();
                if (mongoose.Types.ObjectId.isValid(pIdStr)) {
                  excludeIds.add(pIdStr);
                }
              }
            });
          }
        } catch (err) {
          console.warn("Lỗi khi tìm sản phẩm đã mua của user:", err.message);
        }
      }

      // 4. NHÓM ĐỐI CHỨNG CONTROL (A) hoặc THỬ NGHIỆM A/A (Thuật toán truyền thống)
      // Chạy thuật toán phổ biến nếu là nhóm A hoặc cấu hình algorithm là 'control_popular' (hỗ trợ A/A Testing)
      const assignedVariantName = assignment?.variant || "A";
      const isControlAlgo = assignment?.algorithm === "control_popular" || assignedVariantName === "A";

      if (isControlAlgo) {
        const controlProducts = await this.getPopularProducts({
          limit: finalLimit,
          excludeIds,
        });

        const formatted = await this.formatProducts(controlProducts, userId);
        const result = {
          mode: "popular",
          algorithm: "control_popular",
          products: formatted,
          experiment: {
            experiment_id: assignment.experiment_id,
            variant: assignedVariantName,
            algorithm: "control_popular",
            request_id: requestId,
          },
        };

        if (redis && formatted.length > 0) {
          try {
            await redis.set(userCacheKey, JSON.stringify(result), "EX", RECOMMENDATION_CACHE_TTL || 180);
          } catch (_) {}
        }

        // Ghi nhận sự kiện experiment_assigned bất đồng bộ
        if (assignment.isAssigned) {
          import("../../../queues/tracking.queue.js")
            .then(({ addTrackingJob }) => {
              addTrackingJob({
                event_id: new mongoose.Types.ObjectId().toString(),
                user_id: userId ? userId.toString() : null,
                anonymous_id: anonymousId || (!userId ? (userId || anonymousId) : null),
                event_type: "experiment_assigned",
                source: "recommendation_service",
                meta: {
                  experiment_id: assignment.experiment_id,
                  variant: assignedVariantName,
                  request_id: requestId,
                },
                timestamp: new Date().toISOString(),
              }).catch(() => {});
            })
            .catch(() => {});
        }

        return result;
      }

      // 5. NHÓM THỬ NGHIỆM TREATMENT (B): Hybrid AI Personalized Recommendation
      const excludeObjectIds = [...excludeIds]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // 3. Phân tích điểm sở thích của người dùng
      const toScoreMap = (src) => {
        if (!src) return new Map();
        if (src instanceof Map) return src;
        if (typeof src === "object") return new Map(Object.entries(src));
        return new Map();
      };

      const categoryScores = toScoreMap(profile?.category_scores);
      const keywordScores = toScoreMap(profile?.keyword_scores);
      const preferredColors = toScoreMap(profile?.preferred_colors);
      const preferredSizes = toScoreMap(profile?.preferred_sizes);
      const brandScores = toScoreMap(profile?.brand_scores);

      let totalScore = 0;
      for (const score of categoryScores.values()) if (score > 0) totalScore += Number(score);
      for (const score of keywordScores.values()) if (score > 0) totalScore += Number(score);

      const topCategories = [...categoryScores.entries()]
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([catId]) => catId);

      const topKeywords = [...keywordScores.entries()]
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);

      let personalizedProducts = [];

      // 4. Sinh ứng viên nếu người dùng có lịch sử hành vi
      if (profile && (totalScore > 0 || topCategories.length > 0 || topKeywords.length > 0)) {
        const candidateMap = new Map(); // id -> product
        const priceMin = profile?.price_range?.min || 0;
        const priceMax = profile?.price_range?.max || 0;

        // --- NGUỒN 1: Category & Keyword DB Match ---
        const matchConditions = [];
        if (topCategories.length > 0) {
          const validCatObjectIds = topCategories
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
          if (validCatObjectIds.length > 0) {
            matchConditions.push({ category_id: { $in: validCatObjectIds } });
          }
        }

        if (topKeywords.length > 0) {
          const kwOrs = topKeywords.map((kw) => ({
            $or: [
              { name: { $regex: kw, $options: "i" } },
              { name_no_accents: { $regex: kw, $options: "i" } },
              { description: { $regex: kw, $options: "i" } },
            ],
          }));
          matchConditions.push({ $or: kwOrs });
        }

        if (matchConditions.length > 0) {
          const rawCandidates = await Product.find({
            is_active: { $ne: false },
            _id: { $nin: excludeObjectIds },
            $or: matchConditions,
          })
            .limit(100)
            .populate("variants")
            .populate("category_id", "name")
            .lean()
            .catch(() => []);

          for (const p of this.filterInStock(rawCandidates)) {
            candidateMap.set(p._id.toString(), p);
          }
        }

        // --- NGUỒN 2: Vector AI Semantic Search (nếu có từ khóa hoặc recent products) ---
        let vectorCentroid = null;
        const isDbConnected = Boolean(mongoose.connection?.readyState === 1);
        try {
          if (isDbConnected) {
            // Tính centroid vector từ recent_product_ids
            vectorCentroid = await this._computeUserVectorCentroid(profile.recent_product_ids);

            // Nếu có top keyword, gọi semantic search để lấy ứng viên ngữ nghĩa sâu
            if (topKeywords.length > 0 && candidateMap.size < 60) {
              const semanticRes = await semanticSearchService
                .search(
                  {
                    query: topKeywords[0],
                    sourceType: "product",
                    topK: 15,
                    inStock: true,
                  },
                  { userId }
                )
                .catch(() => ({ results: [] }));

              if (semanticRes?.results && semanticRes.results.length > 0) {
                const semProductIds = semanticRes.results
                  .map((r) => r.sourceId)
                  .filter((id) => id && !excludeIds.has(id) && mongoose.Types.ObjectId.isValid(id))
                  .map((id) => new mongoose.Types.ObjectId(id));

                if (semProductIds.length > 0) {
                  const semProducts = await Product.find({
                    _id: { $in: semProductIds },
                    is_active: { $ne: false },
                  })
                    .populate("variants")
                    .populate("category_id", "name")
                    .lean()
                    .catch(() => []);

                  for (const p of this.filterInStock(semProducts)) {
                    candidateMap.set(p._id.toString(), p);
                  }
                }
              }
            }
          }
        } catch (vecErr) {
          console.warn("[Recommendation] Lỗi tìm ứng viên vector:", vecErr.message);
        }

        // --- NGUỒN 3: Tải VectorEmbeddings của các ứng viên để chấm điểm tương đồng ---
        const candidateIds = [...candidateMap.keys()];
        const candidateVectorsMap = new Map();

        if (isDbConnected && vectorCentroid && candidateIds.length > 0) {
          try {
            const cEmbeddings = await VectorEmbedding.find({
              sourceType: "product",
              sourceId: { $in: candidateIds },
              embedding: { $exists: true, $ne: [] },
            })
              .select("sourceId embedding")
              .lean();

            for (const emb of cEmbeddings) {
              if (emb.sourceId && Array.isArray(emb.embedding)) {
                candidateVectorsMap.set(emb.sourceId.toString(), emb.embedding);
              }
            }
          } catch {
            // Bỏ qua lỗi đọc vector
          }
        }

        // --- CHẤM ĐIỂM HYBRID RANKING ---
        const candidatesList = [...candidateMap.values()];
        const activeBundle = await pricingService.getActiveCampaignsBundle(new Date()).catch(() => null);

        const scored = await Promise.all(
          candidatesList.map(async (product) => {
            const pIdStr = product._id.toString();

            // 1. Category Affinity
            let categoryScore = 0;
            if (product.category_id) {
              const catIdStr = (product.category_id._id || product.category_id).toString();
              const catWeight = categoryScores.get(catIdStr) || 0;
              categoryScore = catWeight * HYBRID_RANKING_WEIGHTS.categoryAffinity;
            }

            // 2. Keyword Match
            let keywordScore = 0;
            if (topKeywords.length > 0) {
              const textToSearch = `${product.name} ${product.name_no_accents || ""} ${
                product.description || ""
              }`.toLowerCase();
              for (const [kw, kwWeight] of keywordScores.entries()) {
                const normKw = normalizeKeyword(kw);
                if (normKw && textToSearch.includes(normKw)) {
                  keywordScore += kwWeight * HYBRID_RANKING_WEIGHTS.keywordMatch;
                }
              }
            }

            // 3. Vector Similarity (Cosine Similarity từ Centroid Vector)
            let vectorSimilarityScore = 0;
            const candidateVector = candidateVectorsMap.get(pIdStr);
            if (vectorCentroid && candidateVector) {
              const sim = cosineSimilarity(vectorCentroid, candidateVector);
              if (sim > 0.4) {
                vectorSimilarityScore = sim * HYBRID_RANKING_WEIGHTS.vectorSimilarity;
              }
            }

            // 4. Attribute Affinity (Màu sắc, kích cỡ, thương hiệu)
            let attributeScore = 0;
            const productVariants = Array.isArray(product.variants) ? product.variants : [];

            if (preferredColors.size > 0) {
              for (const v of productVariants) {
                const vColor = String(v.color || "").trim().toLowerCase();
                if (vColor && preferredColors.has(vColor)) {
                  attributeScore += (preferredColors.get(vColor) || 0) * HYBRID_RANKING_WEIGHTS.colorAffinity * 0.2;
                  break;
                }
              }
            }

            if (preferredSizes.size > 0) {
              for (const v of productVariants) {
                const vSize = String(v.size || "").trim().toUpperCase();
                if (vSize && preferredSizes.has(vSize)) {
                  attributeScore += (preferredSizes.get(vSize) || 0) * HYBRID_RANKING_WEIGHTS.sizeAffinity * 0.2;
                  break;
                }
              }
            }

            if (brandScores.size > 0 && product.brand) {
              const pBrand = String(product.brand).trim().toLowerCase();
              if (pBrand && brandScores.has(pBrand)) {
                attributeScore += (brandScores.get(pBrand) || 0) * HYBRID_RANKING_WEIGHTS.brandAffinity * 0.3;
              }
            }

            // 5. Price Range Match
            let priceMatchScore = 0;
            const productPrice = Number(product.new_price || product.price || 0);
            if (priceMin > 0 && priceMax > 0 && productPrice >= priceMin * 0.8 && productPrice <= priceMax * 1.2) {
              priceMatchScore = HYBRID_RANKING_WEIGHTS.priceRangeMatch;
            }

            // 6. Popularity & Rating
            const ratingScore = (product.rating || 0) * HYBRID_RANKING_WEIGHTS.productRating;
            const soldScore = Math.min(product.sold || 0, 100) * HYBRID_RANKING_WEIGHTS.productPopularity;

            // 7. Pricing & Flash Sale Bonus
            let priceInfo = null;
            try {
              priceInfo = await pricingService.resolvePrice(product, null, new Date(), userId, activeBundle);
            } catch {
              priceInfo = { finalPrice: productPrice, originalPrice: productPrice, isSale: false };
            }
            product.pricingResolved = priceInfo;
            const saleBonus = priceInfo.isSale ? HYBRID_RANKING_WEIGHTS.saleBonus : 0;

            const finalScore =
              categoryScore +
              keywordScore +
              vectorSimilarityScore +
              attributeScore +
              priceMatchScore +
              ratingScore +
              soldScore +
              saleBonus +
              Math.random() * 0.3;

            return { product, finalScore };
          })
        );

        scored.sort((a, b) => b.finalScore - a.finalScore);
        personalizedProducts = scored.map((item) => item.product);
      }

      // Xác định chế độ hiển thị (mode)
      let mode = "popular";
      if (totalScore >= PERSONALIZED_MIN_SCORE && personalizedProducts.length >= finalLimit) {
        mode = "personalized";
      } else if (personalizedProducts.length > 0) {
        mode = "mixed";
      }

      // BƯỚC 2: Trộn danh sách phổ biến nếu danh sách cá nhân hóa chưa đủ limit
      let collectedProducts = [...personalizedProducts.slice(0, finalLimit)];

      if (collectedProducts.length < finalLimit) {
        const needed = finalLimit - collectedProducts.length;
        const currentExcluded = new Set([
          ...excludeIds,
          ...collectedProducts.map((p) => p._id.toString()),
        ]);

        const popularFill = await this.getPopularProducts({
          limit: needed,
          excludeIds: currentExcluded,
        });

        collectedProducts.push(...popularFill);
      }

      // BƯỚC 3: Nếu vẫn thiếu, bù sản phẩm mới nhất còn hàng
      if (collectedProducts.length < finalLimit) {
        const currentIds = new Set([
          ...excludeIds,
          ...collectedProducts.map((p) => p._id.toString()),
        ]);
        const excludeObjIds = [...currentIds]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const rawBackfill = await Product.find({
          is_active: { $ne: false },
          _id: { $nin: excludeObjIds },
        })
          .sort({ createdAt: -1 })
          .limit(finalLimit * 2)
          .populate("variants")
          .populate("category_id", "name")
          .lean()
          .catch(() => []);

        const inStockBackfill = this.filterInStock(rawBackfill);
        const needed = finalLimit - collectedProducts.length;
        collectedProducts.push(...inStockBackfill.slice(0, needed));
      }

      // BƯỚC 4: Fallback cho phép sản phẩm hết hàng nếu kho quá ít
      if (collectedProducts.length < finalLimit) {
        const currentIds = new Set([
          ...excludeIds,
          ...collectedProducts.map((p) => p._id.toString()),
        ]);
        const excludeObjIds = [...currentIds]
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const needed = finalLimit - collectedProducts.length;
        const rawAny = await Product.find({
          is_active: { $ne: false },
          _id: { $nin: excludeObjIds },
        })
          .sort({ createdAt: -1 })
          .limit(needed)
          .populate("variants")
          .populate("category_id", "name")
          .lean()
          .catch(() => []);

        collectedProducts.push(...rawAny);
      }

      // BƯỚC 5: DB không có sản phẩm nào
      if (collectedProducts.length === 0) {
        return {
          mode: "empty",
          products: [],
        };
      }

      const finalProducts = await this.formatProducts(collectedProducts.slice(0, finalLimit), userId);

      const result = {
        mode,
        algorithm: "treatment_personalized",
        products: finalProducts,
        experiment: {
          experiment_id: assignment?.experiment_id || null,
          variant: assignment?.variant || "B",
          algorithm: "treatment_personalized",
          request_id: requestId,
        },
      };

      // Lưu cache Redis theo nhóm thử nghiệm
      if (redis && finalProducts.length > 0) {
        try {
          await redis.set(userCacheKey, JSON.stringify(result), "EX", RECOMMENDATION_CACHE_TTL || 180);
        } catch (_) {}
      }

      // Ghi nhận sự kiện experiment_assigned bất đồng bộ cho nhóm B
      if (assignment?.isAssigned) {
        import("../../../queues/tracking.queue.js")
          .then(({ addTrackingJob }) => {
            addTrackingJob({
              event_id: new mongoose.Types.ObjectId().toString(),
              user_id: userId ? userId.toString() : null,
              anonymous_id: anonymousId || (!userId ? (userId || anonymousId) : null),
              event_type: "experiment_assigned",
              source: "recommendation_service",
              meta: {
                experiment_id: assignment.experiment_id,
                variant: assignment.variant,
                request_id: requestId,
              },
              timestamp: new Date().toISOString(),
            }).catch(() => {});
          })
          .catch(() => {});
      }

      return result;
    } catch (fatalError) {
      console.error("[Recommendation] Lỗi khi tạo đề xuất:", fatalError.message);
      // Fallback tối thượng: không bao giờ trả lỗi 500
      try {
        const ultimateProducts = await Product.find({ is_active: { $ne: false } })
          .sort({ createdAt: -1 })
          .limit(finalLimit)
          .populate("variants")
          .populate("category_id", "name")
          .lean();

        if (ultimateProducts && ultimateProducts.length > 0) {
          const formatted = await this.formatProducts(ultimateProducts, userId);
          return { mode: "popular", products: formatted };
        }
      } catch (_) {}

      return { mode: "empty", products: [] };
    }
  }

  /**
   * Cung cấp ngữ cảnh sở thích tóm tắt phục vụ AI Chatbot cá nhân hóa
   */
  async getPersonalizedContextForChat(userId, anonymousId) {
    if (mongoose.connection?.readyState !== 1) return null;
    const filter = userId
      ? { user_id: new mongoose.Types.ObjectId(userId) }
      : anonymousId
      ? { anonymous_id: anonymousId }
      : null;

    if (!filter) return null;

    try {
      const profile = await UserInterestProfile.findOne(filter).lean();
      if (!profile || profile.consent_status === "denied") return null;

      const topCategories = [...(profile.category_scores ? Object.entries(profile.category_scores) : [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      const topKeywords = [...(profile.keyword_scores ? Object.entries(profile.keyword_scores) : [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);

      const preferredColors = [...(profile.preferred_colors ? Object.entries(profile.preferred_colors) : [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);

      const preferredSizes = [...(profile.preferred_sizes ? Object.entries(profile.preferred_sizes) : [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([s]) => s);

      return {
        topCategories,
        topKeywords,
        preferredColors,
        preferredSizes,
        priceRange: profile.price_range || null,
        recentProductIds: (profile.recent_product_ids || []).map((id) => id.toString()),
      };
    } catch {
      return null;
    }
  }
}

export default new RecommendationService();
