import crypto from "crypto";
import mongoose from "mongoose";
import UserEvent from "./userEvent.model.js";
import UserConsent from "./userConsent.model.js";
import UserInterestProfile from "../recommendations/userInterestProfile.model.js";
import Product from "../products/product.model.js";
import User from "../users/user.model.js";
import { OrderItem } from "../orders/order.model.js";
import { addTrackingJob } from "../../queues/tracking.queue.js";
import { getRedisConnection } from "../../configs/redis.js";
import {
  acquireDistributedLock,
  releaseDistributedLock,
} from "../../providers/redisLock.provider.js";
import { normalizeKeyword } from "../../common/utils/normalizeKeyword.js";
import {
  EVENT_WEIGHTS,
  EVENT_TYPES,
  HALF_LIFE_DAYS,
  MAX_KEYWORDS,
  MAX_RECENT_PRODUCTS,
  DEDUP_TTL_SECONDS,
} from "./tracking.constants.js";
import { AppError } from "../../common/exceptions/AppError.js";

// Regex kiểm tra email và số điện thoại để lọc quyền riêng tư (không lưu PII trong search query)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+84|0)[0-9]{9,10}\b/;

/**
 * Xóa cache đề xuất của một user/anonymous một cách an toàn bằng SCAN (không dùng redis.keys gây block)
 */
async function invalidateUserRecommendationCache(userId, anonymousId) {
  try {
    const redis = getRedisConnection();
    if (!redis) return;

    const pattern = userId
      ? `recommendations:u:${userId}:*`
      : `recommendations:a:${anonymousId}:*`;

    const stream = redis.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (err) {
    console.warn("[Tracking] Lỗi khi xóa cache đề xuất:", err.message);
  }
}

class TrackingService {
  /**
   * Kiểm tra quyền riêng tư (Privacy & Consent):
   * Single Source of Truth: MongoDB UserConsent (consent_status: "granted" | "denied")
   * Tách biệt độc lập khỏi UserInterestProfile để đảm bảo quyền từ chối (GDPR Right to Object)
   * vẫn tồn tại vĩnh viễn ngay cả khi profile hành vi bị xóa bỏ hoàn toàn (GDPR Right to be Forgotten).
   * Redis Cache layer: consent:denied:{identity} (TTL 1 năm)
   * Tự động phục hồi cache từ MongoDB khi Redis restart hoặc cache bị mất
   */
  async isConsentDenied(userId, anonymousId) {
    const rawUserId = userId ? (userId._id ? String(userId._id) : String(userId)) : null;
    const rawAnonId = anonymousId ? String(anonymousId) : null;

    const redis = getRedisConnection();
    const identities = [];
    if (rawUserId) {
      identities.push(rawUserId);
      identities.push(`u:${rawUserId}`);
    }
    if (rawAnonId) {
      identities.push(rawAnonId);
      identities.push(`a:${rawAnonId}`);
    }

    // 1. Kiểm tra nhanh trong Redis cache
    if (redis && identities.length > 0) {
      try {
        for (const id of identities) {
          const val = await redis.get(`consent:denied:${id}`);
          if (val === "1") return true;
        }
      } catch (redisErr) {
        // Fallback to MongoDB
      }
    }

    // 2. Fallback kiểm tra Single Source of Truth trong MongoDB
    try {
      const rawIdentities = [];
      if (rawUserId) rawIdentities.push(rawUserId);
      if (rawAnonId) rawIdentities.push(rawAnonId);

      if (rawIdentities.length > 0) {
        let isDenied = false;

        // Ưu tiên kiểm tra bảng UserConsent chuyên biệt
        if (mongoose.connection?.readyState === 1 || (UserConsent.findOne && typeof UserConsent.findOne.mock === "object")) {
          const consentDoc = await UserConsent.findOne({
            subject_id: { $in: rawIdentities },
            consent_status: "denied",
          })
            .select("subject_id consent_status")
            .lean();
          if (consentDoc) isDenied = true;
        }

        // Fallback kiểm tra User document nếu chưa đồng bộ
        if (!isDenied && (mongoose.connection?.readyState === 1 || (User.findById && typeof User.findById.mock === "object"))) {
          if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
            const userDoc = await User.findById(rawUserId).select("consent_status").lean().catch(() => null);
            if (userDoc?.consent_status === "denied") isDenied = true;
          }
        }

        // Fallback kiểm tra UserInterestProfile cho dữ liệu cũ
        if (!isDenied && (mongoose.connection?.readyState === 1 || (UserInterestProfile.findOne && typeof UserInterestProfile.findOne.mock === "object"))) {
          const orFilters = [];
          if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
            orFilters.push({ user_id: new mongoose.Types.ObjectId(rawUserId) });
          }
          if (rawAnonId) {
            orFilters.push({ anonymous_id: rawAnonId });
          }
          if (orFilters.length > 0) {
            const profile = await UserInterestProfile.findOne({
              $or: orFilters,
              consent_status: "denied",
            })
              .select("_id consent_status")
              .lean();
            if (profile) isDenied = true;
          }
        }

        if (isDenied) {
          // Phục hồi lại cache Redis (TTL 1 năm)
          if (redis) {
            try {
              if (rawUserId) await redis.set(`consent:denied:${rawUserId}`, "1", "EX", 86400 * 365);
              if (rawAnonId) await redis.set(`consent:denied:${rawAnonId}`, "1", "EX", 86400 * 365);
            } catch {}
          }
          return true;
        }
      }
    } catch (err) {
      console.warn("[Tracking] Lỗi kiểm tra consent MongoDB:", err.message);
    }

    return false;
  }

  /**
   * Tiếp nhận sự kiện từ HTTP request:
   * - Bỏ qua hành vi của Admin và bot để không làm sai lệch số liệu
   * - Kiểm tra quyền riêng tư (Consent) ngay tại tầng Ingestion API
   * - Lọc quyền riêng tư (loại bỏ PII email/số điện thoại)
   * - Kiểm tra tồn tại sản phẩm
   * - Kiểm tra chống trùng qua Redis TTL (5 phút)
   * - Đẩy việc vào BullMQ hàng đợi bất đồng bộ với event_id riêng biệt
   */
  async recordEvent(eventData, reqUser) {
    // Bỏ qua tài khoản Admin để không làm bẩn dữ liệu phân tích và gợi ý
    if (reqUser?.role === "admin") {
      return { accepted: true, deduplicated: false, ignored: "admin_user" };
    }

    const userId = reqUser?._id ? reqUser._id.toString() : (reqUser?.userId || reqUser?.id || null);
    const anonymousId = eventData.anonymous_id ? String(eventData.anonymous_id) : null;

    if (!userId && !anonymousId) {
      throw new AppError("Yêu cầu cần có user_id (đã đăng nhập) hoặc anonymous_id", 400);
    }

    // Ingestion-level Privacy & Consent Check: Drop ngay lập tức nếu người dùng đã từ chối theo dõi
    const consentDenied = await this.isConsentDenied(userId, anonymousId);
    if (consentDenied) {
      return { accepted: false, suppressed: "consent_denied", deduplicated: false };
    }

    const {
      event_type,
      product_id,
      category_id,
      query,
      source,
      session_id,
      event_id,
      meta,
      context,
    } = eventData;
    const identityKey = userId ? `u:${userId}` : `a:${anonymousId}`;

    // Lọc quyền riêng tư: Nếu query chứa email hoặc số điện thoại, loại bỏ query
    let sanitizedQuery = null;
    if (query && typeof query === "string") {
      const trimmed = query.trim().slice(0, 100);
      if (!EMAIL_REGEX.test(trimmed) && !PHONE_REGEX.test(trimmed)) {
        sanitizedQuery = trimmed;
      }
    }

    // Kiểm tra nhẹ sự tồn tại của sản phẩm nếu có product_id
    let validatedProductId = null;
    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      try {
        const exists = await Product.exists({
          _id: new mongoose.Types.ObjectId(product_id),
          is_active: true,
        });
        if (exists) {
          validatedProductId = product_id.toString();
        }
      } catch (checkErr) {
        validatedProductId = product_id.toString();
      }
    }

    // 1. Kiểm tra chống ghi trùng qua Redis: cùng (user/anonymous, event_type, target) trong DEDUP_TTL_SECONDS
    const dedupEventTypes = [
      EVENT_TYPES.PRODUCT_VIEW,
      EVENT_TYPES.VIEW_PRODUCT,
      EVENT_TYPES.PRODUCT_CLICK,
      EVENT_TYPES.PRODUCT_IMPRESSION,
      EVENT_TYPES.RECOMMENDATION_CLICKED,
      EVENT_TYPES.SEARCH,
      EVENT_TYPES.SEARCH_PERFORMED,
    ];

    if (dedupEventTypes.includes(event_type)) {
      try {
        const redis = getRedisConnection();
        let dedupKey = null;

        if (validatedProductId) {
          dedupKey = `tracking:dedup:${identityKey}:${event_type}:${validatedProductId}`;
        } else if (
          (event_type === "search" || event_type === "search_performed") &&
          sanitizedQuery
        ) {
          const normKey = normalizeKeyword(sanitizedQuery);
          if (normKey) {
            dedupKey = `tracking:dedup:${identityKey}:search:${normKey}`;
          }
        }

        if (dedupKey && redis) {
          const ttl = event_type === EVENT_TYPES.PRODUCT_IMPRESSION ? 60 : DEDUP_TTL_SECONDS;
          const acquired = await redis.set(dedupKey, "1", "EX", ttl, "NX");
          if (!acquired) {
            return { accepted: true, deduplicated: true };
          }
        }
      } catch (redisErr) {
        console.warn("Lỗi kiểm tra Redis dedup:", redisErr.message);
      }
    }

    const assignedEventId = event_id || new mongoose.Types.ObjectId().toString();

    // 2. Chuẩn bị payload để đẩy vào BullMQ (tuyệt đối không lưu IP hay thông tin nhạy cảm)
    const jobPayload = {
      event_id: assignedEventId,
      user_id: userId ? userId.toString() : null,
      anonymous_id: anonymousId,
      session_id: session_id || null,
      event_type,
      product_id: validatedProductId,
      category_id: category_id ? category_id.toString() : null,
      query: sanitizedQuery,
      source: source || null,
      meta: meta || {},
      context: context || {},
      timestamp: new Date().toISOString(),
    };

    // Đẩy bất đồng bộ vào BullMQ queue với durable fallback nếu Redis/Queue gặp sự cố
    await this._dispatchJob(jobPayload);

    return { accepted: true, deduplicated: false };
  }

  /**
   * Điều phối đẩy job vào BullMQ kèm cơ chế Durable Fallback trực tiếp vào MongoDB nếu Redis outage
   */
  async _dispatchJob(jobPayload) {
    try {
      await addTrackingJob(jobPayload);
    } catch (queueErr) {
      console.warn("[Tracking] BullMQ dispatch failed (Redis outage?), falling back to direct MongoDB persistence:", queueErr.message);
      try {
        await this.processEvent(jobPayload);
      } catch (directErr) {
        console.error("[Tracking] Direct persistence fallback failed:", directErr.message);
      }
    }
  }

  /**
   * Tiếp nhận danh sách nhiều sự kiện theo lô (Batch Processing) từ client
   */
  async recordBatchEvents(events, reqUser) {
    if (!Array.isArray(events) || events.length === 0) {
      return { accepted: 0, deduplicated: 0, suppressed: 0, total: 0 };
    }

    if (reqUser?.role === "admin") {
      return { accepted: events.length, deduplicated: 0, suppressed: 0, total: events.length, ignored: "admin_user" };
    }

    let accepted = 0;
    let deduplicated = 0;
    let suppressed = 0;

    for (const ev of events) {
      try {
        const res = await this.recordEvent(ev, reqUser);
        if (res.suppressed === "consent_denied") {
          suppressed++;
        } else if (res.deduplicated) {
          deduplicated++;
        } else if (res.accepted) {
          accepted++;
        }
      } catch {
        // Tiếp tục xử lý các event tiếp theo trong batch
      }
    }

    return { accepted, deduplicated, suppressed, total: events.length };
  }

  /**
   * Xử lý sự kiện trong Worker của BullMQ:
   * - Distributed Lock qua Redis theo user/anonymous ID để chống race condition
   * - Idempotent check qua Redis key tracking:processed:${event_id}
   * - Kiểm tra Tombstone Flag ngăn chặn worker hồi sinh profile sau khi xóa dữ liệu
   * - Worker-level Privacy & Consent Check (bỏ job ngay cả khi đã vào queue trước đó)
   * - Lưu UserEvent và cập nhật UserInterestProfile
   */
  async processEvent(payload) {
    const {
      event_id,
      user_id,
      anonymous_id,
      session_id,
      event_type,
      product_id,
      category_id,
      query,
      source,
      meta,
      context,
    } = payload;
    const redis = getRedisConnection();

    // 1. Kiểm tra idempotent: Nếu job này đã xử lý trước đó, bỏ qua để tránh cộng điểm 2 lần
    if (event_id && redis) {
      const isAlreadyProcessed = await redis.get(`tracking:processed:${event_id}`);
      if (isAlreadyProcessed) {
        return;
      }
    }

    // 2. Durable Deletion Fence Check: Ngăn BullMQ worker phục hồi dữ liệu từ event cũ sau khi gọi DELETE /api/events/me
    // Sử dụng mốc thời gian cleared_at trong MongoDB UserConsent làm watermark không bao giờ hết hạn.
    const eventTime = payload.timestamp
      ? new Date(payload.timestamp)
      : payload.createdAt
      ? new Date(payload.createdAt)
      : new Date();

    const rawUserId = user_id ? (user_id._id ? String(user_id._id) : String(user_id)) : null;
    const rawAnonId = anonymous_id ? String(anonymous_id) : null;

    const fenceIdentities = [];
    if (rawUserId) fenceIdentities.push(rawUserId);
    if (rawAnonId) fenceIdentities.push(rawAnonId);

    if (fenceIdentities.length > 0) {
      try {
        if (mongoose.connection?.readyState === 1 || (UserConsent.findOne && typeof UserConsent.findOne.mock === "object")) {
          const consentWatermark = await UserConsent.findOne({
            subject_id: { $in: fenceIdentities },
            cleared_at: { $ne: null },
          })
            .select("cleared_at")
            .lean();

          if (consentWatermark?.cleared_at && eventTime <= consentWatermark.cleared_at) {
            // Event nằm trước mốc xóa dữ liệu durable fence -> Drop vĩnh viễn
            return;
          }
        }
      } catch (fenceErr) {
        console.warn("[Tracking Worker] Lỗi kiểm tra durable deletion fence:", fenceErr.message);
      }
    }

    // Fast-path Tombstone Check trong Redis
    if (redis) {
      if (rawUserId) {
        const isCleared = await redis.get(`user:data_cleared:${rawUserId}`);
        if (isCleared) return;
      }
      if (rawAnonId) {
        const isClearedAnon = await redis.get(`user:data_cleared:${rawAnonId}`);
        if (isClearedAnon) return;
      }
    }

    const identity = rawUserId || rawAnonId;
    if (!identity) return;

    // 3. Worker-level Privacy & Consent Check: Thu hồi quyền riêng tư lập tức hủy mọi event đang chờ trong queue
    const isConsentDenied = await this.isConsentDenied(rawUserId, rawAnonId);
    if (isConsentDenied) {
      return;
    }

    // 2. Lấy Distributed Lock theo user/anonymous với spin-wait có jitter (tối đa 5 giây)
    const lockKey = `lock:profile:${identity}`;
    let lockToken = null;
    const maxRetries = 50; // 50 lượt thử
    for (let i = 0; i < maxRetries; i++) {
      const lockResult = await acquireDistributedLock(lockKey, 6000);
      if (lockResult.acquired) {
        lockToken = lockResult.token;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 40));
    }

    if (!lockToken) {
      throw new Error(`[Tracking Worker] Không thể lấy lock cho profile: ${identity}, sẽ thử lại`);
    }

    try {
      // Double-checked locking
      if (event_id && redis) {
        const isProcessed = await redis.get(`tracking:processed:${event_id}`);
        if (isProcessed) {
          return;
        }
      }

      const userObjectId =
        rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)
          ? new mongoose.Types.ObjectId(rawUserId)
          : null;
      const productObjectId =
        product_id && mongoose.Types.ObjectId.isValid(product_id)
          ? new mongoose.Types.ObjectId(product_id)
          : null;
      let categoryObjectId =
        category_id && mongoose.Types.ObjectId.isValid(category_id)
          ? new mongoose.Types.ObjectId(category_id)
          : null;

      // Bổ sung category_id, price, brand nếu có product_id mà thiếu
      let productPrice = meta?.price ? Number(meta.price) : 0;
      let productBrand = meta?.brand ? String(meta.brand).trim() : null;

      if (productObjectId && (!categoryObjectId || productPrice === 0 || !productBrand)) {
        if (mongoose.connection?.readyState === 1 || (Product.findById && typeof Product.findById.mock === "object")) {
          try {
            const product = await Product.findById(productObjectId).select(
              "category_id new_price price name brand"
            );
            if (product) {
              if (!categoryObjectId && product.category_id) {
                categoryObjectId = product.category_id;
              }
              if (productPrice === 0) {
                productPrice = product.new_price || product.price || 0;
              }
              if (!productBrand && product.brand) {
                productBrand = String(product.brand).trim();
              }
            }
          } catch (err) {
            console.warn("Không thể tìm sản phẩm để bổ sung thông tin tracking:", err.message);
          }
        }
      }

      // 3. Ghi bản ghi vào user_events (chống trùng theo event_id)
      const eventDocId =
        event_id && mongoose.Types.ObjectId.isValid(event_id)
          ? new mongoose.Types.ObjectId(event_id)
          : new mongoose.Types.ObjectId();

      try {
        await UserEvent.updateOne(
          { _id: eventDocId },
          {
            $setOnInsert: {
              _id: eventDocId,
              event_id: event_id || eventDocId.toString(),
              user_id: userObjectId,
              anonymous_id: anonymous_id || null,
              session_id: session_id || null,
              event_type,
              product_id: productObjectId,
              category_id: categoryObjectId,
              query: query || null,
              source: source || null,
              meta: { ...meta, price: productPrice, brand: productBrand },
              context: context || {},
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          // Idempotency: Unique partial index (e.g. meta.order_id + product_id + purchase_completed)
          // ngăn chặn duplicate purchase do concurrent webhook hoặc retry; dừng xử lý ngay.
          return;
        }
        console.error("Lỗi khi lưu UserEvent:", saveErr.message);
      }

      // 4. Nếu là sự kiện mua hàng (purchase hoặc purchase_completed), xóa cache đề xuất an toàn
      if (
        (event_type === EVENT_TYPES.PURCHASE || event_type === EVENT_TYPES.PURCHASE_COMPLETED) &&
        redis
      ) {
        await invalidateUserRecommendationCache(user_id, anonymous_id);
      }

      // Ghi nhận tương tác chạm sản phẩm đề xuất (Recommendation Touch) cho Attribution
      if (
        (event_type === EVENT_TYPES.RECOMMENDATION_CLICKED ||
          event_type === EVENT_TYPES.AI_RECOMMENDATION_CLICKED ||
          event_type === EVENT_TYPES.PRODUCT_CLICK) &&
        meta?.experiment_id &&
        meta?.variant &&
        productObjectId
      ) {
        import("../recommendations/experiments/experiment.service.js")
          .then(({ default: expService }) => {
            expService.recordProductTouch({
              subjectId: userObjectId ? userObjectId.toString() : anonymous_id,
              userId: userObjectId ? userObjectId.toString() : null,
              anonymousId: anonymous_id,
              productId: productObjectId,
              experimentId: meta.experiment_id,
              variant: meta.variant,
              requestId: meta.request_id || null,
            });
          })
          .catch(() => {});
      }

      // 5. Cập nhật user_interest_profiles
      await this._updateInterestProfile({
        userObjectId,
        anonymousId: anonymous_id,
        event_type,
        productObjectId,
        categoryObjectId,
        query,
        price: productPrice,
        brand: productBrand,
        meta,
      });

      // 6. Đánh dấu event đã xử lý xong trong Redis (TTL 24 giờ)
      if (event_id && redis) {
        await redis.set(`tracking:processed:${event_id}`, "1", "EX", 86400);
      }
    } finally {
      // 7. Giải phóng Distributed Lock
      await releaseDistributedLock(lockKey, lockToken);
    }
  }

  /**
   * Cập nhật profile sở thích với suy giảm điểm theo thời gian và chuẩn hóa từ khóa an toàn
   */
  async _updateInterestProfile({
    userObjectId,
    anonymousId,
    event_type,
    productObjectId,
    categoryObjectId,
    query,
    price,
    brand,
    meta = {},
  }) {
    const profileFilter = userObjectId
      ? { user_id: userObjectId }
      : { anonymous_id: anonymousId };

    const existingProfile = await UserInterestProfile.findOne(profileFilter);

    // Kiểm tra quyền riêng tư: Nếu người dùng đã từ chối theo dõi, không cập nhật profile
    if (existingProfile?.consent_status === "denied") {
      return;
    }

    // Tính hệ số suy giảm theo half-life (14 ngày)
    const now = new Date();
    let decayFactor = 1.0;
    if (existingProfile?.updatedAt) {
      const elapsedMs = now.getTime() - new Date(existingProfile.updatedAt).getTime();
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      decayFactor = Math.pow(0.5, elapsedDays / HALF_LIFE_DAYS);
    }

    // Lấy điểm hiện tại (hoặc map mới)
    const categoryScores = new Map(existingProfile?.category_scores || []);
    const keywordScores = new Map(existingProfile?.keyword_scores || []);
    const preferredColors = new Map(existingProfile?.preferred_colors || []);
    const preferredSizes = new Map(existingProfile?.preferred_sizes || []);
    const brandScores = new Map(existingProfile?.brand_scores || []);

    let recentProductIds = existingProfile?.recent_product_ids
      ? existingProfile.recent_product_ids.map((id) => id.toString())
      : [];
    const priceRange = existingProfile?.price_range
      ? { min: existingProfile.price_range.min || 0, max: existingProfile.price_range.max || 0 }
      : { min: 0, max: 0 };

    // Áp dụng suy giảm điểm cũ
    if (decayFactor < 0.999 && decayFactor > 0) {
      for (const [key, val] of categoryScores.entries()) {
        categoryScores.set(key, Math.max(0, parseFloat((val * decayFactor).toFixed(3))));
      }
      for (const [key, val] of keywordScores.entries()) {
        keywordScores.set(key, Math.max(0, parseFloat((val * decayFactor).toFixed(3))));
      }
      for (const [key, val] of preferredColors.entries()) {
        preferredColors.set(key, Math.max(0, parseFloat((val * decayFactor).toFixed(3))));
      }
      for (const [key, val] of preferredSizes.entries()) {
        preferredSizes.set(key, Math.max(0, parseFloat((val * decayFactor).toFixed(3))));
      }
      for (const [key, val] of brandScores.entries()) {
        brandScores.set(key, Math.max(0, parseFloat((val * decayFactor).toFixed(3))));
      }
    }

    // Trọng số sự kiện (có thể dương hoặc âm)
    const weight = EVENT_WEIGHTS[event_type] !== undefined ? EVENT_WEIGHTS[event_type] : 1;

    // Cập nhật category_scores
    if (categoryObjectId) {
      const catKey = categoryObjectId.toString();
      const currentScore = categoryScores.get(catKey) || 0;
      const nextScore = Math.max(0, parseFloat((currentScore + weight).toFixed(3)));
      categoryScores.set(catKey, nextScore);
    }

    // Cập nhật màu sắc & kích cỡ ưa thích
    const color = meta.color || meta.variant_color;
    if (color && typeof color === "string") {
      const normColor = color.trim().toLowerCase();
      if (normColor) {
        const cur = preferredColors.get(normColor) || 0;
        preferredColors.set(normColor, Math.max(0, parseFloat((cur + Math.max(0.5, weight)).toFixed(3))));
      }
    }

    const size = meta.size || meta.variant_size;
    if (size && typeof size === "string") {
      const normSize = size.trim().toUpperCase();
      if (normSize) {
        const cur = preferredSizes.get(normSize) || 0;
        preferredSizes.set(normSize, Math.max(0, parseFloat((cur + Math.max(0.5, weight)).toFixed(3))));
      }
    }

    // Cập nhật thương hiệu ưa thích
    if (brand && typeof brand === "string") {
      const normBrand = brand.trim().toLowerCase();
      if (normBrand) {
        const cur = brandScores.get(normBrand) || 0;
        brandScores.set(normBrand, Math.max(0, parseFloat((cur + Math.max(0.5, weight)).toFixed(3))));
      }
    }

    // Cập nhật keyword_scores khi tìm kiếm
    if ((event_type === "search" || event_type === "search_performed" || event_type === "ai_product_search") && query) {
      const fullKeyword = normalizeKeyword(query);
      if (fullKeyword) {
        const cur = keywordScores.get(fullKeyword) || 0;
        keywordScores.set(fullKeyword, parseFloat((cur + Math.max(1, weight)).toFixed(3)));
      }

      const subWords = query.split(/\s+/).map((w) => normalizeKeyword(w)).filter(Boolean);
      for (const word of subWords) {
        if (word !== fullKeyword) {
          const cur = keywordScores.get(word) || 0;
          keywordScores.set(word, parseFloat((cur + Math.max(0.5, weight * 0.7)).toFixed(3)));
        }
      }

      // Cắt gọn Map về tối đa 50 từ khóa điểm cao nhất
      if (keywordScores.size > MAX_KEYWORDS) {
        const sorted = [...keywordScores.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_KEYWORDS);
        keywordScores.clear();
        for (const [k, v] of sorted) {
          keywordScores.set(k, v);
        }
      }
    }

    // Cập nhật khoảng giá
    if (price && price > 0 && weight > 0) {
      if (priceRange.min === 0 || price < priceRange.min) {
        priceRange.min = price;
      }
      if (price > priceRange.max) {
        priceRange.max = price;
      }
    }

    // Cập nhật recent_product_ids (tối đa 20 sản phẩm gần nhất)
    if (productObjectId && weight > 0) {
      const pIdStr = productObjectId.toString();
      recentProductIds = [pIdStr, ...recentProductIds.filter((id) => id !== pIdStr)].slice(
        0,
        MAX_RECENT_PRODUCTS
      );
    }

    // Ghi cập nhật nguyên tử vào database
    const updatePayload = {
      $set: {
        category_scores: categoryScores,
        keyword_scores: keywordScores,
        preferred_colors: preferredColors,
        preferred_sizes: preferredSizes,
        brand_scores: brandScores,
        price_range: priceRange,
        recent_product_ids: recentProductIds.map((id) => new mongoose.Types.ObjectId(id)),
        last_active_at: now,
        updatedAt: now,
      },
      $inc: { total_events_count: 1 },
    };

    if (!existingProfile) {
      updatePayload.$setOnInsert = {
        user_id: userObjectId,
        anonymous_id: userObjectId ? null : anonymousId,
        consent_status: "granted",
      };
    }

    await UserInterestProfile.findOneAndUpdate(profileFilter, updatePayload, {
      upsert: true,
      new: true,
    });
  }

  /**
   * Gộp khách ẩn danh vào tài khoản người dùng sau khi đăng nhập/đăng ký
   */
  async mergeAnonymousToUser(anonymousId, userId) {
    if (!anonymousId || !userId) return;

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    if (!userObjectId) return;

    const redis = getRedisConnection();

    // 1. Kiểm tra idempotent qua Redis
    if (redis) {
      const isMerged = await redis.get(`merged:${anonymousId}`);
      if (isMerged) {
        return;
      }
    }

    // 2. Bảo vệ: Nếu anonymous_id này đã từng gắn với một user khác, không gộp để tránh rò rỉ dữ liệu
    const otherUserEvent = await UserEvent.findOne({
      anonymous_id: anonymousId,
      user_id: { $exists: true, $nin: [null, userObjectId] },
    }).select("_id user_id");

    if (otherUserEvent) {
      console.warn(
        `[Merge Skipped] anonymous_id ${anonymousId} đã từng liên kết với user ${otherUserEvent.user_id}`
      );
      return;
    }

    // 3. Acquire distributed lock
    const lockKey = `lock:merge:${anonymousId}`;
    const lockResult = await acquireDistributedLock(lockKey, 6000);
    if (!lockResult.acquired) {
      return;
    }

    try {
      // 4. Cập nhật user_events theo lô (tối đa 100)
      const anonEvents = await UserEvent.find({
        anonymous_id: anonymousId,
        user_id: null,
      })
        .limit(100)
        .select("_id");

      if (anonEvents.length > 0) {
        const bulkOps = anonEvents.map((doc) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { user_id: userObjectId } },
          },
        }));
        await UserEvent.bulkWrite(bulkOps);
      }

      // 5. Gộp profile sở thích
      const anonProfile = await UserInterestProfile.findOne({ anonymous_id: anonymousId });
      if (!anonProfile) {
        if (redis) await redis.set(`merged:${anonymousId}`, userObjectId.toString(), "EX", 86400);
        return;
      }

      const userProfile = await UserInterestProfile.findOne({ user_id: userObjectId });

      if (!userProfile) {
        try {
          anonProfile.user_id = userObjectId;
          anonProfile.anonymous_id = null;
          await anonProfile.save();
        } catch (saveErr) {
          if (saveErr.code === 11000) {
            const freshUserProfile = await UserInterestProfile.findOne({ user_id: userObjectId });
            if (freshUserProfile) {
              await this._combineProfiles(freshUserProfile, anonProfile);
            }
          }
        }
      } else {
        await this._combineProfiles(userProfile, anonProfile);
      }

      // Đánh dấu đã gộp thành công
      if (redis) {
        await redis.set(`merged:${anonymousId}`, userObjectId.toString(), "EX", 86400);
        // Xóa cache đề xuất của user bằng SCAN an toàn
        await invalidateUserRecommendationCache(userObjectId.toString(), null);
      }

      // Đồng bộ phân nhóm thử nghiệm A/B Testing từ anonymousId sang userId
      import("../recommendations/experiments/experiment.service.js")
        .then(({ default: expService }) => {
          expService.bindIdentity(anonymousId, userObjectId.toString());
        })
        .catch(() => {});
    } catch (mergeErr) {
      console.error("Lỗi khi gộp anonymous profile vào user:", mergeErr);
    } finally {
      await releaseDistributedLock(lockKey, lockResult.token);
    }
  }

  /**
   * Helper gộp 2 profile
   */
  async _combineProfiles(targetUserProfile, sourceAnonProfile) {
    const mergedCategories = new Map(targetUserProfile.category_scores || []);
    for (const [catId, score] of (sourceAnonProfile.category_scores || new Map()).entries()) {
      const cur = mergedCategories.get(catId) || 0;
      mergedCategories.set(catId, parseFloat((cur + score).toFixed(3)));
    }

    const mergedKeywords = new Map(targetUserProfile.keyword_scores || []);
    for (const [kw, score] of (sourceAnonProfile.keyword_scores || new Map()).entries()) {
      const normKey = normalizeKeyword(kw);
      if (!normKey) continue;
      const cur = mergedKeywords.get(normKey) || 0;
      mergedKeywords.set(normKey, parseFloat((cur + score).toFixed(3)));
    }

    const topKeywords = [...mergedKeywords.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYWORDS);
    mergedKeywords.clear();
    for (const [k, v] of topKeywords) {
      mergedKeywords.set(k, v);
    }

    const mergedColors = new Map(targetUserProfile.preferred_colors || []);
    for (const [color, score] of (sourceAnonProfile.preferred_colors || new Map()).entries()) {
      const cur = mergedColors.get(color) || 0;
      mergedColors.set(color, parseFloat((cur + score).toFixed(3)));
    }

    const mergedSizes = new Map(targetUserProfile.preferred_sizes || []);
    for (const [size, score] of (sourceAnonProfile.preferred_sizes || new Map()).entries()) {
      const cur = mergedSizes.get(size) || 0;
      mergedSizes.set(size, parseFloat((cur + score).toFixed(3)));
    }

    const mergedMin = Math.min(
      targetUserProfile.price_range?.min || Infinity,
      sourceAnonProfile.price_range?.min || Infinity
    );
    const mergedMax = Math.max(
      targetUserProfile.price_range?.max || 0,
      sourceAnonProfile.price_range?.max || 0
    );

    const existingRecents = (targetUserProfile.recent_product_ids || []).map((id) => id.toString());
    const anonRecents = (sourceAnonProfile.recent_product_ids || []).map((id) => id.toString());
    const combinedRecents = [...new Set([...anonRecents, ...existingRecents])].slice(
      0,
      MAX_RECENT_PRODUCTS
    );

    targetUserProfile.category_scores = mergedCategories;
    targetUserProfile.keyword_scores = mergedKeywords;
    targetUserProfile.preferred_colors = mergedColors;
    targetUserProfile.preferred_sizes = mergedSizes;
    targetUserProfile.price_range = {
      min: mergedMin === Infinity ? 0 : mergedMin,
      max: mergedMax,
    };
    targetUserProfile.recent_product_ids = combinedRecents.map((id) => new mongoose.Types.ObjectId(id));
    targetUserProfile.total_events_count =
      (targetUserProfile.total_events_count || 0) + (sourceAnonProfile.total_events_count || 0);
    targetUserProfile.updatedAt = new Date();

    await targetUserProfile.save();
    await UserInterestProfile.deleteOne({ _id: sourceAnonProfile._id });
  }

  /**
   * Cập nhật trạng thái đồng ý theo dõi (Privacy & Consent)
   * Single Source of Truth: MongoDB UserConsent (durable)
   * Redis cache layer: consent:denied:{identity} (TTL 1 năm)
   */
  async updateConsent({ userId, anonymousId, consent, anonymousToken }) {
    if (!userId && !anonymousId) {
      throw new AppError("Cần cung cấp định danh người dùng để cập nhật consent", 400);
    }

    const userObjectId =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

    // 1. Cập nhật Single Source of Truth trong bảng UserConsent
    if (mongoose.connection?.readyState === 1 || (UserConsent.findOneAndUpdate && typeof UserConsent.findOneAndUpdate.mock === "object")) {
      if (userId) {
        await UserConsent.findOneAndUpdate(
          { subject_id: userId.toString() },
          {
            $set: {
              subject_id: userId.toString(),
              subject_type: "user",
              consent_status: consent,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        if (userObjectId) {
          await User.updateOne({ _id: userObjectId }, { $set: { consent_status: consent } }).catch(() => {});
        }
      }

      if (anonymousId) {
        const updateData = {
          subject_id: anonymousId,
          subject_type: "anonymous",
          consent_status: consent,
          updatedAt: new Date(),
        };
        if (anonymousToken) {
          updateData.anonymous_token_hash = crypto
            .createHash("sha256")
            .update(anonymousToken)
            .digest("hex");
        }
        await UserConsent.findOneAndUpdate(
          { subject_id: anonymousId },
          { $set: updateData },
          { upsert: true }
        );
      }
    }

    // Cập nhật UserInterestProfile để duy trì tính tương thích ngược
    if (mongoose.connection?.readyState === 1 || (UserInterestProfile.updateOne && typeof UserInterestProfile.updateOne.mock === "object")) {
      const filter = userObjectId ? { user_id: userObjectId } : { anonymous_id: anonymousId };
      await UserInterestProfile.updateOne(
        filter,
        {
          $set: { consent_status: consent, updatedAt: new Date() },
          $setOnInsert: {
            user_id: userObjectId,
            anonymous_id: userObjectId ? null : anonymousId,
          },
        },
        { upsert: true }
      ).catch(() => {});

      if (userObjectId && anonymousId) {
        await UserInterestProfile.updateOne(
          { anonymous_id: anonymousId },
          { $set: { consent_status: consent, updatedAt: new Date() } }
        ).catch(() => {});
      }
    }

    // 2. Đồng bộ Redis cache
    const redis = getRedisConnection();
    const identities = [];
    if (userId) {
      identities.push(userId.toString());
      identities.push(`u:${userId}`);
    }
    if (anonymousId) {
      identities.push(anonymousId.toString());
      identities.push(`a:${anonymousId}`);
    }

    if (redis && identities.length > 0) {
      for (const id of identities) {
        if (consent === "denied") {
          await redis.set(`consent:denied:${id}`, "1", "EX", 86400 * 365);
        } else {
          await redis.del(`consent:denied:${id}`);
        }
      }
    }

    // 3. Nếu từ chối: Xóa sạch dữ liệu hồ sơ sở thích cá nhân và xóa cache đề xuất
    if (consent === "denied") {
      const resetOr = [];
      if (userObjectId) resetOr.push({ user_id: userObjectId });
      if (anonymousId) resetOr.push({ anonymous_id: anonymousId });

      if (resetOr.length > 0 && (mongoose.connection?.readyState === 1 || (UserInterestProfile.updateMany && typeof UserInterestProfile.updateMany.mock === "object"))) {
        await UserInterestProfile.updateMany(
          { $or: resetOr },
          {
            $set: {
              category_scores: new Map(),
              keyword_scores: new Map(),
              preferred_colors: new Map(),
              preferred_sizes: new Map(),
              brand_scores: new Map(),
              recent_product_ids: [],
            },
          }
        );
      }
      await invalidateUserRecommendationCache(userId, anonymousId);
    }

    return {
      success: true,
      consent,
      userId: userId || null,
      anonymousId: anonymousId || null,
    };
  }

  /**
   * Server-side tracking helper: Đơn hàng đã đặt (Order Placed)
   */
  async trackOrderPlaced(order) {
    if (!order || !order.user_id) return;
    try {
      let items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      if (items.length === 0 && order._id && mongoose.connection?.readyState === 1) {
        items = await OrderItem.find({ order_id: order._id }).lean();
      }
      if (items.length === 0) return;

      const orderIdStr = order._id ? order._id.toString() : null;
      if (!orderIdStr) return;

      // Idempotency check: Tránh ghi nhận trùng lặp order_placed
      const idempotencyKey = `tracked:order_placed:${orderIdStr}`;
      try {
        const { getRedisConnection } = await import("../../configs/redis.js");
        const redis = getRedisConnection();
        const setNx = await redis.set(idempotencyKey, "1", "EX", 86400, "NX");
        if (!setNx) return; // Đã được ghi nhận trước đó
      } catch (redisErr) {}

      if (mongoose.connection?.readyState === 1) {
        const alreadyTracked = await UserEvent.exists({
          "meta.order_id": orderIdStr,
          event_type: EVENT_TYPES.ORDER_PLACED,
        });
        if (alreadyTracked) return;
      }

      // Tìm session và anonymousId gần nhất trong 2 giờ để quy kết session
      let activeSessionId = order.session_id || null;
      let activeAnonymousId = order.anonymous_id || null;
      if (!activeSessionId && mongoose.connection?.readyState === 1) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const lastUserEvent = await UserEvent.findOne({
          user_id: order.user_id,
          createdAt: { $gte: twoHoursAgo },
          session_id: { $ne: null },
        })
          .sort({ createdAt: -1 })
          .select("session_id anonymous_id")
          .lean();
        if (lastUserEvent) {
          activeSessionId = lastUserEvent.session_id;
          activeAnonymousId = lastUserEvent.anonymous_id;
        }
      }

      // Xác định quy kết thử nghiệm A/B Testing
      let attribution = null;
      try {
        const { default: expService } = await import("../recommendations/experiments/experiment.service.js");
        attribution = await expService.resolveOrderAttribution(order.user_id, items);
      } catch (err) {
        // Bỏ qua lỗi quy kết
      }

      for (const item of items) {
        const pId = item.product_id ? (item.product_id._id || item.product_id).toString() : null;
        if (pId) {
          await this._dispatchJob({
            event_id: new mongoose.Types.ObjectId().toString(),
            user_id: order.user_id.toString(),
            anonymous_id: activeAnonymousId,
            session_id: activeSessionId,
            event_type: EVENT_TYPES.ORDER_PLACED,
            product_id: pId,
            category_id: null,
            meta: {
              order_id: orderIdStr,
              quantity: item.quantity,
              price: item.price,
              payment_method: order.payment_method,
              experiment_id: attribution?.experiment_id || null,
              variant: attribution?.variant || null,
              rec_attributed: attribution?.is_direct_rec_assisted || false,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn("[Tracking] Lỗi ghi nhận order_placed:", err.message);
    }
  }

  /**
   * Server-side tracking helper: Đơn hàng hoàn tất thanh toán (Purchase Completed)
   */
  async trackPurchaseCompleted(order) {
    if (!order || !order.user_id) return;
    try {
      let items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      if (items.length === 0 && order._id && mongoose.connection?.readyState === 1) {
        items = await OrderItem.find({ order_id: order._id }).lean();
      }
      if (items.length === 0) return;

      const orderIdStr = order._id ? order._id.toString() : null;
      if (!orderIdStr) return;

      // Idempotency check: Tránh duplicate purchase events
      const idempotencyKey = `tracked:purchase:${orderIdStr}`;
      try {
        const { getRedisConnection } = await import("../../configs/redis.js");
        const redis = getRedisConnection();
        const setNx = await redis.set(idempotencyKey, "1", "EX", 86400, "NX");
        if (!setNx) return; // Đã được xử lý
      } catch (redisErr) {}

      if (mongoose.connection?.readyState === 1) {
        const alreadyTracked = await UserEvent.exists({
          "meta.order_id": orderIdStr,
          event_type: {
            $in: [
              EVENT_TYPES.PURCHASE_COMPLETED,
              EVENT_TYPES.PURCHASE,
              EVENT_TYPES.PURCHASE_DONE,
            ],
          },
        });
        if (alreadyTracked) return;
      }

      // Tìm session và anonymousId gần nhất để quy kết phiên mua hàng
      let activeSessionId = order.session_id || null;
      let activeAnonymousId = order.anonymous_id || null;
      if (!activeSessionId && mongoose.connection?.readyState === 1) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const lastUserEvent = await UserEvent.findOne({
          user_id: order.user_id,
          createdAt: { $gte: twoHoursAgo },
          session_id: { $ne: null },
        })
          .sort({ createdAt: -1 })
          .select("session_id anonymous_id")
          .lean();
        if (lastUserEvent) {
          activeSessionId = lastUserEvent.session_id;
          activeAnonymousId = lastUserEvent.anonymous_id;
        }
      }

      // Xác định quy kết thử nghiệm A/B Testing
      let attribution = null;
      try {
        const { default: expService } = await import("../recommendations/experiments/experiment.service.js");
        attribution = await expService.resolveOrderAttribution(order.user_id, items);
      } catch (err) {
        // Bỏ qua lỗi quy kết
      }

      for (const item of items) {
        const pId = item.product_id ? (item.product_id._id || item.product_id).toString() : null;
        if (pId) {
          await this._dispatchJob({
            event_id: new mongoose.Types.ObjectId().toString(),
            user_id: order.user_id.toString(),
            anonymous_id: activeAnonymousId,
            session_id: activeSessionId,
            event_type: EVENT_TYPES.PURCHASE_COMPLETED,
            product_id: pId,
            category_id: null,
            meta: {
              order_id: orderIdStr,
              quantity: item.quantity,
              price: item.price,
              payment_method: order.payment_method,
              experiment_id: attribution?.experiment_id || null,
              variant: attribution?.variant || null,
              rec_attributed: attribution?.is_direct_rec_assisted || false,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
      await invalidateUserRecommendationCache(order.user_id.toString(), null);
    } catch (err) {
      console.warn("[Tracking] Lỗi ghi nhận purchase_completed:", err.message);
    }
  }

  /**
   * Server-side tracking helper: Đơn hàng bị hủy (Order Cancelled)
   */
  async trackOrderCancelled(order) {
    if (!order || !order.user_id) return;
    try {
      let items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      if (items.length === 0 && order._id && mongoose.connection?.readyState === 1) {
        items = await OrderItem.find({ order_id: order._id }).lean();
      }
      if (items.length === 0) return;

      const orderIdStr = order._id ? order._id.toString() : null;
      for (const item of items) {
        const pId = item.product_id ? (item.product_id._id || item.product_id).toString() : null;
        if (pId) {
          await this._dispatchJob({
            event_id: new mongoose.Types.ObjectId().toString(),
            user_id: order.user_id.toString(),
            anonymous_id: null,
            event_type: EVENT_TYPES.ORDER_CANCELLED,
            product_id: pId,
            category_id: null,
            meta: {
              order_id: orderIdStr,
              quantity: item.quantity,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
      await invalidateUserRecommendationCache(order.user_id.toString(), null);
    } catch (err) {
      console.warn("[Tracking] Lỗi ghi nhận order_cancelled:", err.message);
    }
  }

  /**
   * Lấy lịch sử tìm kiếm gần nhất
   */
  async getSearchHistory(userId, limit = 10) {
    if (!userId) return [];
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    if (!userObjectId) return [];

    const events = await UserEvent.find({
      user_id: userObjectId,
      event_type: { $in: ["search", "search_performed", "ai_product_search"] },
      query: { $ne: null, $nin: ["", null] },
    })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();

    const seen = new Set();
    const uniqueKeywords = [];

    for (const ev of events) {
      const q = (ev.query || "").trim();
      const lower = q.toLowerCase();
      if (q && !seen.has(lower)) {
        seen.add(lower);
        uniqueKeywords.push(q);
        if (uniqueKeywords.length >= limit) break;
      }
    }

    return uniqueKeywords;
  }

  /**
   * Xóa lịch sử tìm kiếm của user và xóa cache đề xuất
   */
  async clearSearchHistory(userId) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    if (!userObjectId) return;

    await UserEvent.deleteMany({
      user_id: userObjectId,
      event_type: { $in: ["search", "search_performed", "ai_product_search"] },
    });

    await UserInterestProfile.updateOne(
      { user_id: userObjectId },
      { $set: { keyword_scores: new Map() } }
    );

    await invalidateUserRecommendationCache(userId, null);
  }

  /**
   * Xóa toàn bộ dữ liệu lịch sử hành vi + profile của user hoặc khách ẩn danh (Right to be Forgotten)
   * - Hỗ trợ cả authenticated user (userId) và anonymous user (anonymousId)
   * - Xác thực quyền sở hữu: Authenticated User check hoặc Anonymous Token Cryptographic Hash (SHA-256)
   * - Đặt Durable Deletion Watermark Fence (cleared_at) trong MongoDB UserConsent
   * - Đặt Redis tombstone flag user:data_cleared:{id} trong 24h ngăn worker phục hồi dữ liệu từ BullMQ queue
   * - Xóa UserEvent và UserInterestProfile
   * - Invalidate recommendation cache
   * - Bảo toàn 100% dữ liệu đơn hàng (Order/OrderItem) và tài chính
   */
  async clearUserTrackingData(identifier) {
    let userId = null;
    let anonymousId = null;
    let anonymousToken = null;
    let reqUser = null;

    if (typeof identifier === "object" && identifier !== null) {
      userId = identifier.userId || identifier.user_id || null;
      anonymousId = identifier.anonymousId || identifier.anonymous_id || null;
      anonymousToken = identifier.anonymousToken || identifier.anonymous_token || null;
      reqUser = identifier.reqUser || null;
    } else {
      userId = identifier;
    }

    if (!userId && !anonymousId) {
      throw new AppError("Cần cung cấp user_id hoặc anonymous_id để xóa dữ liệu tracking", 400);
    }

    // Authorization & Ownership Verification:
    // 1. Nếu là user đã đăng nhập: kiểm tra reqUser khớp userId (hoặc admin)
    if (userId && reqUser && reqUser.role !== "admin") {
      const authUserId = reqUser.userId || reqUser.id;
      if (authUserId && authUserId.toString() !== userId.toString()) {
        throw new AppError("Không có quyền xóa dữ liệu của tài khoản người dùng khác", 403);
      }
    }

    // 2. Nếu là anonymousId: xác thực anonymous_token qua cryptographic SHA-256 hash
    if (anonymousId) {
      let existingConsent = null;
      if (mongoose.connection?.readyState === 1 || (UserConsent.findOne && typeof UserConsent.findOne.mock === "object")) {
        existingConsent = await UserConsent.findOne({ subject_id: anonymousId }).lean();
      }
      if (existingConsent?.anonymous_token_hash) {
        if (!anonymousToken) {
          throw new AppError("Cần cung cấp header x-anonymous-token để xác thực quyền sở hữu", 403);
        }
        const incomingHash = crypto.createHash("sha256").update(anonymousToken).digest("hex");
        if (incomingHash !== existingConsent.anonymous_token_hash) {
          throw new AppError("anonymous_token không khớp với phiên sở hữu đã đăng ký", 403);
        }
      } else if (!userId && (!reqUser || reqUser.role !== "admin") && !anonymousToken) {
        throw new AppError("Cần cung cấp header x-anonymous-token để xác thực quyền sở hữu khách ẩn danh", 403);
      }
    }

    const userObjectId =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

    const redis = getRedisConnection();
    const clearedTimestamp = new Date();

    // 1. Cập nhật Durable Deletion Watermark Fence trong MongoDB UserConsent
    if (mongoose.connection?.readyState === 1 || (UserConsent.findOneAndUpdate && typeof UserConsent.findOneAndUpdate.mock === "object")) {
      if (userId) {
        await UserConsent.findOneAndUpdate(
          { subject_id: userId.toString() },
          {
            $set: {
              cleared_at: clearedTimestamp,
              subject_type: "user",
              updatedAt: new Date(),
            },
            $inc: { data_generation: 1 },
          },
          { upsert: true }
        );
      }

      if (anonymousId) {
        const updateDoc = {
          cleared_at: clearedTimestamp,
          subject_type: "anonymous",
          updatedAt: new Date(),
        };
        if (anonymousToken) {
          updateDoc.anonymous_token_hash = crypto
            .createHash("sha256")
            .update(anonymousToken)
            .digest("hex");
        }
        await UserConsent.findOneAndUpdate(
          { subject_id: anonymousId },
          {
            $set: updateDoc,
            $inc: { data_generation: 1 },
          },
          { upsert: true }
        );
      }
    }

    // 2. Đặt Fast-path Tombstone Flag trong Redis
    if (redis) {
      try {
        if (userId) {
          await redis.set(`user:data_cleared:${userId.toString()}`, "1", "EX", 86400);
        }
        if (anonymousId) {
          await redis.set(`user:data_cleared:${anonymousId}`, "1", "EX", 86400);
        }
      } catch (err) {
        console.warn("[Tracking] Lỗi đặt tombstone Redis:", err.message);
      }
    }

    // 3. Xóa UserEvent (chỉ xóa event hành vi, tuyệt đối KHÔNG xóa bảng Order hay OrderItem)
    const eventDeleteFilter = {};
    if (userObjectId && anonymousId) {
      eventDeleteFilter.$or = [{ user_id: userObjectId }, { anonymous_id: anonymousId }];
    } else if (userObjectId) {
      eventDeleteFilter.user_id = userObjectId;
    } else {
      eventDeleteFilter.anonymous_id = anonymousId;
    }

    const deleteEventsResult = await UserEvent.deleteMany(eventDeleteFilter);

    // 4. Xóa UserInterestProfile
    const profileDeleteFilter = {};
    if (userObjectId && anonymousId) {
      profileDeleteFilter.$or = [{ user_id: userObjectId }, { anonymous_id: anonymousId }];
    } else if (userObjectId) {
      profileDeleteFilter.user_id = userObjectId;
    } else {
      profileDeleteFilter.anonymous_id = anonymousId;
    }

    const deleteProfileResult = await UserInterestProfile.deleteMany(profileDeleteFilter);

    // 5. Invalidate cache đề xuất
    await invalidateUserRecommendationCache(userId, anonymousId);

    return {
      success: true,
      deletedEventsCount: deleteEventsResult.deletedCount || 0,
      deletedProfile: (deleteProfileResult.deletedCount || 0) > 0,
      invalidatedCache: true,
      preservedOrders: true,
      clearedAt: clearedTimestamp,
    };
  }

  /**
   * Thống kê tổng quan hành vi khách hàng phục vụ Analytics Dashboard
   */
  async getAnalyticsOverview({ startDate, endDate } = {}) {
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalEvents,
      activeUsersCount,
      activeSessionsCount,
      eventTypeStats,
      topViewedProducts,
      topSearches,
    ] = await Promise.all([
      UserEvent.countDocuments(dateFilter),
      UserEvent.distinct("user_id", { ...dateFilter, user_id: { $ne: null } }).then(
        (arr) => arr.length
      ),
      UserEvent.distinct("session_id", { ...dateFilter, session_id: { $ne: null } }).then(
        (arr) => arr.length
      ),
      UserEvent.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$event_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      UserEvent.aggregate([
        {
          $match: {
            ...dateFilter,
            event_type: { $in: ["view_product", "product_view", "product_click"] },
            product_id: { $ne: null },
          },
        },
        { $group: { _id: "$product_id", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            views: 1,
            name: "$product.name",
            price: "$product.new_price",
            image: { $arrayElemAt: ["$product.displayProduct", 0] },
          },
        },
      ]),
      UserEvent.aggregate([
        {
          $match: {
            ...dateFilter,
            event_type: { $in: ["search", "search_performed"] },
            query: { $ne: null, $nin: ["", null] },
          },
        },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Tính CTR cho Recommendation & AI Recommendation
    const eventCountsMap = Object.fromEntries(eventTypeStats.map((s) => [s._id, s.count]));
    const recImpressions =
      (eventCountsMap[EVENT_TYPES.RECOMMENDATION_IMPRESSION] || 0) +
      (eventCountsMap[EVENT_TYPES.PRODUCT_IMPRESSION] || 0);
    const recClicks =
      (eventCountsMap[EVENT_TYPES.RECOMMENDATION_CLICKED] || 0) +
      (eventCountsMap[EVENT_TYPES.PRODUCT_CLICK] || 0);
    const recommendationCtr = recImpressions > 0 ? Number(((recClicks / recImpressions) * 100).toFixed(2)) : 0;

    const aiRecommended = eventCountsMap[EVENT_TYPES.AI_PRODUCT_RECOMMENDED] || 0;
    const aiClicks = eventCountsMap[EVENT_TYPES.AI_RECOMMENDATION_CLICKED] || 0;
    const aiRecommendationCtr = aiRecommended > 0 ? Number(((aiClicks / aiRecommended) * 100).toFixed(2)) : 0;

    return {
      totalEvents,
      activeUsersCount,
      activeSessionsCount,
      eventTypeStats: eventCountsMap,
      recommendationMetrics: {
        impressions: recImpressions,
        clicks: recClicks,
        ctrPercentage: recommendationCtr,
      },
      aiMetrics: {
        recommendedCount: aiRecommended,
        clickedCount: aiClicks,
        ctrPercentage: aiRecommendationCtr,
        cartActionConfirmedCount: eventCountsMap[EVENT_TYPES.AI_CART_ACTION_CONFIRMED] || 0,
      },
      topViewedProducts,
      topSearches: topSearches.map((s) => ({ query: s._id, count: s.count })),
    };
  }

  /**
   * Tính toán Phễu Chuyển Đổi Mua Hàng (Funnel Analytics)
   * Strict Sequential Cohort Funnel:
   * - Bảo đảm tính đơn điệu toán học nghiêm ngặt: N1 >= N2 >= N3 >= N4 >= N5 >= N6
   * - Mỗi bước chuyển tiếp tuân thủ thứ tự thời gian t1 <= t2 <= ... <= t6
   * - Không dùng cơ chế clamp nhân tạo Math.min(100, ...)
   * - Phân tách rõ ràng:
   *   1. sessionFunnel: Phễu chuỗi thời gian cùng phiên (Session Sequential Funnel)
   *   2. userFunnel: Phễu chuỗi thời gian xuyên phiên theo người dùng (User Sequential Funnel)
   *   3. rawStages: Khối lượng độc lập từng giai đoạn (Independent Stage Volumes)
   */
  async getFunnelAnalytics({ startDate, endDate } = {}) {
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const funnelStages = [
      {
        stage: "page_view",
        label: "Xem trang",
        types: [EVENT_TYPES.PAGE_VIEW],
      },
      {
        stage: "product_view",
        label: "Xem sản phẩm",
        types: [EVENT_TYPES.PRODUCT_VIEW, EVENT_TYPES.VIEW_PRODUCT],
      },
      {
        stage: "add_to_cart",
        label: "Thêm vào giỏ",
        types: [EVENT_TYPES.ADD_TO_CART],
      },
      {
        stage: "checkout_started",
        label: "Bắt đầu thanh toán",
        types: [EVENT_TYPES.CHECKOUT_STARTED, "checkout_start"],
      },
      {
        stage: "order_placed",
        label: "Đặt hàng",
        types: [EVENT_TYPES.ORDER_PLACED],
      },
      {
        stage: "purchase_completed",
        label: "Mua thành công",
        types: [EVENT_TYPES.PURCHASE_COMPLETED, EVENT_TYPES.PURCHASE, "purchase_done"],
      },
    ];

    // 1. Raw Stages: Khối lượng độc lập từng giai đoạn (Independent Volumes)
    const rawStages = await Promise.all(
      funnelStages.map(async (stg) => {
        const [eventCount, uniqueSessions, uniqueUsers] = await Promise.all([
          UserEvent.countDocuments({
            ...dateFilter,
            event_type: { $in: stg.types },
          }),
          UserEvent.distinct("session_id", {
            ...dateFilter,
            event_type: { $in: stg.types },
            session_id: { $ne: null },
          }).then((arr) => arr.length),
          UserEvent.distinct("user_id", {
            ...dateFilter,
            event_type: { $in: stg.types },
            user_id: { $ne: null },
          }).then((arr) => arr.length),
        ]);

        return {
          stage: stg.stage,
          label: stg.label,
          eventCount,
          uniqueSessions,
          uniqueUsers,
        };
      })
    );

    const stageTypeMap = funnelStages.map((s) => s.types);

    // 2. Strict Sequential Session Funnel (t1 <= t2 <= t3 <= t4 <= t5 <= t6 trong cùng phiên)
    let sessionStageCounts = [0, 0, 0, 0, 0, 0];
    if (mongoose.connection?.readyState === 1 || (UserEvent.aggregate && typeof UserEvent.aggregate.mock === "object")) {
      const sessionMatch = {
        session_id: { $ne: null },
        ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
      };

      let sessionEvents = [];
      try {
        const cursor = await UserEvent.aggregate([
          { $match: sessionMatch },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: "$session_id",
              events: {
                $push: {
                  type: "$event_type",
                  time: "$createdAt",
                },
              },
            },
          },
        ]);
        sessionEvents = Array.isArray(cursor)
          ? cursor
          : typeof cursor.toArray === "function"
          ? await cursor.toArray()
          : [];
      } catch (err) {
        console.warn("[Funnel] Lỗi aggregate session funnel:", err.message);
      }

      for (const session of sessionEvents) {
        const evs = session.events || [];
        let currentStage = 0;
        let lastTime = new Date(0);

        for (const ev of evs) {
          if (currentStage >= funnelStages.length) break;
          const expectedTypes = stageTypeMap[currentStage];
          const evTime = new Date(ev.time);
          if (expectedTypes.includes(ev.type) && evTime >= lastTime) {
            currentStage++;
            lastTime = evTime;
          }
        }

        for (let i = 0; i < currentStage; i++) {
          sessionStageCounts[i]++;
        }
      }
    } else {
      sessionStageCounts = rawStages.map((s) => s.uniqueSessions || s.eventCount || 0);
    }

    const topSessions = sessionStageCounts[0] || 0;
    let prevSessions = topSessions;
    const sessionFunnel = funnelStages.map((stg, idx) => {
      const count = sessionStageCounts[idx];
      const overallConversionRate = topSessions > 0 ? Number(((count / topSessions) * 100).toFixed(2)) : 0;
      const stepConversionRate =
        idx === 0
          ? 100
          : prevSessions > 0
          ? Number(((count / prevSessions) * 100).toFixed(2))
          : 0;
      const dropOffRate = Number((100 - stepConversionRate).toFixed(2));
      prevSessions = count;

      return {
        stage: stg.stage,
        label: stg.label,
        count,
        eventCount: rawStages[idx]?.eventCount || 0,
        uniqueSessions: count,
        uniqueUsers: rawStages[idx]?.uniqueUsers || 0,
        overallConversionRate,
        stepConversionRate,
        dropOffRate,
      };
    });

    // 3. Strict Sequential User Funnel (t1 <= t2 <= t3 <= t4 <= t5 <= t6 trên toàn hành trình người dùng)
    let userStageCounts = [0, 0, 0, 0, 0, 0];
    if (mongoose.connection?.readyState === 1 || (UserEvent.aggregate && typeof UserEvent.aggregate.mock === "object")) {
      const userMatch = {
        user_id: { $ne: null },
        ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
      };

      let userEvents = [];
      try {
        const cursor = await UserEvent.aggregate([
          { $match: userMatch },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: "$user_id",
              events: {
                $push: {
                  type: "$event_type",
                  time: "$createdAt",
                },
              },
            },
          },
        ]);
        userEvents = Array.isArray(cursor)
          ? cursor
          : typeof cursor.toArray === "function"
          ? await cursor.toArray()
          : [];
      } catch (err) {
        console.warn("[Funnel] Lỗi aggregate user funnel:", err.message);
      }

      for (const user of userEvents) {
        const evs = user.events || [];
        let currentStage = 0;
        let lastTime = new Date(0);

        for (const ev of evs) {
          if (currentStage >= funnelStages.length) break;
          const expectedTypes = stageTypeMap[currentStage];
          const evTime = new Date(ev.time);
          if (expectedTypes.includes(ev.type) && evTime >= lastTime) {
            currentStage++;
            lastTime = evTime;
          }
        }

        for (let i = 0; i < currentStage; i++) {
          userStageCounts[i]++;
        }
      }
    } else {
      userStageCounts = rawStages.map((s) => s.uniqueUsers || 0);
    }

    const topUsers = userStageCounts[0] || 0;
    let prevUsers = topUsers;
    const userFunnel = funnelStages.map((stg, idx) => {
      const count = userStageCounts[idx];
      const overallConversionRate = topUsers > 0 ? Number(((count / topUsers) * 100).toFixed(2)) : 0;
      const stepConversionRate =
        idx === 0
          ? 100
          : prevUsers > 0
          ? Number(((count / prevUsers) * 100).toFixed(2))
          : 0;
      const dropOffRate = Number((100 - stepConversionRate).toFixed(2));
      prevUsers = count;

      return {
        stage: stg.stage,
        label: stg.label,
        count,
        uniqueUsers: count,
        overallConversionRate,
        stepConversionRate,
        dropOffRate,
      };
    });

    return {
      funnel: sessionFunnel, // Backward compatibility cho UI
      sessionFunnel,
      userFunnel,
      rawStages,
      period: { startDate, endDate },
    };
  }
}

export default new TrackingService();
