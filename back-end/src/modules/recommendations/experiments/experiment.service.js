import crypto from "crypto";
import mongoose from "mongoose";
import Experiment from "./experiment.model.js";
import { getRedisConnection } from "../../../configs/redis.js";
import { addTrackingJob } from "../../../queues/tracking.queue.js";
import { EVENT_TYPES } from "../../tracking/tracking.constants.js";
import UserInterestProfile from "../userInterestProfile.model.js";

// Mặc định tên Experiment chính cho hệ thống gợi ý
export const DEFAULT_REC_EXPERIMENT_ID = "rec_ai_vs_traditional_v1";

// Experiment A/A Testing chuẩn bị sẵn sàng cho kiểm định Baseline Staging
export const AA_EXPERIMENT_ID = "AA_Recommendation_Validation";

// Cache config in-memory để assignment đạt độ trễ cực thấp (< 0.5ms)
let cachedExperimentConfig = null;
let cachedExperimentExpiry = 0;
const CONFIG_CACHE_TTL_MS = 30 * 1000; // 30s in-memory refresh

// Tier-1 In-memory Sticky Assignment Cache (sub-millisecond < 0.1ms)
const stickyLocalCache = new Map();
const MAX_LOCAL_CACHE_SIZE = 100000;

class ExperimentService {
  /**
   * Khởi tạo hoặc lấy cấu hình Experiment mặc định
   */
  async getOrInitDefaultExperiment() {
    try {
      if (mongoose.connection?.readyState !== 1) {
        return this.getFallbackExperimentConfig();
      }

      let exp = await Experiment.findOne({ experiment_id: DEFAULT_REC_EXPERIMENT_ID }).lean();
      if (!exp) {
        exp = await Experiment.create({
          experiment_id: DEFAULT_REC_EXPERIMENT_ID,
          name: "Thử nghiệm A/B: AI Hybrid vs Gợi ý truyền thống",
          description: "So sánh hiệu quả chuyển đổi đơn hàng giữa Hybrid AI Personalized và Popular Best-sellers",
          status: "running",
          variants: [
            {
              name: "A",
              weight: 50,
              description: "Control: Gợi ý truyền thống (Bán chạy, Mới về, Nổi bật)",
              algorithm: "control_popular",
            },
            {
              name: "B",
              weight: 50,
              description: "Treatment: Hybrid AI Cá nhân hóa (Hành vi + Vector Similarity)",
              algorithm: "treatment_personalized",
            },
          ],
          salt: "wf_fashion_recs_2026",
          target_metric: "purchase_conversion_rate",
          attribution_window_hours: 24,
          traffic_allocation: 100,
        });
        exp = exp.toObject();
      }
      return exp;
    } catch (err) {
      console.warn("[ExperimentService] Lỗi khi nạp cấu hình thử nghiệm từ DB, dùng fallback in-memory:", err.message);
      return this.getFallbackExperimentConfig();
    }
  }

  /**
   * Fallback cấu hình nếu DB hoặc connection chưa sẵn sàng
   */
  getFallbackExperimentConfig() {
    return {
      experiment_id: DEFAULT_REC_EXPERIMENT_ID,
      name: "Thử nghiệm A/B: AI Hybrid vs Gợi ý truyền thống (Fallback)",
      status: "running",
      variants: [
        { name: "A", weight: 50, algorithm: "control_popular" },
        { name: "B", weight: 50, algorithm: "treatment_personalized" },
      ],
      salt: "wf_fashion_recs_2026",
      attribution_window_hours: 24,
      traffic_allocation: 100,
    };
  }

  /**
   * Khởi tạo hoặc lấy cấu hình A/A Testing (AA_Recommendation_Validation)
   * A = 50%, B = 50%, cả hai đều chạy control_popular
   * Trạng thái mặc định: "draft" (chỉ kích hoạt trong môi trường Staging khi có điều kiện & quyền phù hợp)
   */
  async initAAValidationExperiment() {
    try {
      if (mongoose.connection?.readyState !== 1) {
        return this.getFallbackAAExperimentConfig();
      }

      let exp = await Experiment.findOne({ experiment_id: AA_EXPERIMENT_ID }).lean();
      if (!exp) {
        exp = await Experiment.create({
          experiment_id: AA_EXPERIMENT_ID,
          name: "A/A Testing: Baseline Recommendation Validation",
          description: "Kiểm định A/A phân bổ lưu lượng 50/50, cả hai biến thể đều thực thi thuật toán control_popular để thẩm định tính đồng nhất, kiểm tra SRM và chống dương tính giả trước khi chạy A/B.",
          status: "draft",
          variants: [
            {
              name: "A",
              weight: 50,
              description: "Control Group A: Thuật toán truyền thống (Bán chạy, Mới về, Nổi bật)",
              algorithm: "control_popular",
            },
            {
              name: "B",
              weight: 50,
              description: "Control Group B: Thuật toán truyền thống (Bán chạy, Mới về, Nổi bật)",
              algorithm: "control_popular",
            },
          ],
          salt: "wf_aa_validation_salt_2026",
          target_metric: "purchase_conversion_rate",
          attribution_window_hours: 24,
          traffic_allocation: 100,
        });
        exp = exp.toObject();
      }
      return exp;
    } catch (err) {
      console.warn("[ExperimentService] Lỗi khi nạp AA_Recommendation_Validation từ DB, dùng fallback in-memory:", err.message);
      return this.getFallbackAAExperimentConfig();
    }
  }

  getFallbackAAExperimentConfig() {
    return {
      experiment_id: AA_EXPERIMENT_ID,
      name: "A/A Testing: Baseline Recommendation Validation (Fallback)",
      status: "draft",
      variants: [
        { name: "A", weight: 50, algorithm: "control_popular" },
        { name: "B", weight: 50, algorithm: "control_popular" },
      ],
      salt: "wf_aa_validation_salt_2026",
      attribution_window_hours: 24,
      traffic_allocation: 100,
    };
  }

  /**
   * Lấy cấu hình thử nghiệm đang hoạt động (có in-memory + Redis caching)
   */
  async getActiveExperiment(experimentId = null) {
    const targetExpId = (experimentId || process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID).trim();
    const normalizedExpId = targetExpId.toLowerCase();
    const now = Date.now();
    if (
      cachedExperimentConfig &&
      (cachedExperimentConfig.experiment_id === normalizedExpId || cachedExperimentConfig.experiment_id === targetExpId) &&
      now < cachedExperimentExpiry
    ) {
      return cachedExperimentConfig;
    }

    const redis = getRedisConnection();
    const redisKey = `exp:config:${normalizedExpId}`;

    if (redis) {
      try {
        const cached = await redis.get(redisKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          cachedExperimentConfig = parsed;
          cachedExperimentExpiry = now + CONFIG_CACHE_TTL_MS;
          return parsed;
        }
      } catch {
        // Bỏ qua lỗi Redis
      }
    }

    let exp = null;
    if (mongoose.connection?.readyState === 1) {
      exp = await Experiment.findOne({
        $or: [
          { experiment_id: normalizedExpId },
          { experiment_id: targetExpId },
        ],
      }).lean();
    }

    if (!exp && (normalizedExpId === DEFAULT_REC_EXPERIMENT_ID || targetExpId === DEFAULT_REC_EXPERIMENT_ID)) {
      exp = await this.getOrInitDefaultExperiment();
    } else if (!exp && (normalizedExpId === AA_EXPERIMENT_ID.toLowerCase() || targetExpId === AA_EXPERIMENT_ID)) {
      exp = await this.initAAValidationExperiment();
    }

    if (exp) {
      cachedExperimentConfig = exp;
      cachedExperimentExpiry = now + CONFIG_CACHE_TTL_MS;
      if (redis) {
        try {
          await redis.setex(redisKey, 60, JSON.stringify(exp)); // 1 phút trong Redis
        } catch {
          // Bỏ qua lỗi Redis
        }
      }
    }

    return exp;
  }

  /**
   * Xóa cache cấu hình khi admin cập nhật thử nghiệm
   */
  async invalidateExperimentCache(experimentId = null) {
    const targetExpId = (experimentId || process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID).trim();
    const normalizedExpId = targetExpId.toLowerCase();
    cachedExperimentConfig = null;
    cachedExperimentExpiry = 0;
    stickyLocalCache.clear();
    try {
      const redis = getRedisConnection();
      if (redis) {
        await redis.del(`exp:config:${normalizedExpId}`, `exp:config:${targetExpId}`);
        await redis.incr(`exp:config:version:${normalizedExpId}`);
        const stream = redis.scanStream({ match: `exp:assign:${normalizedExpId}:*` });
        for await (const keys of stream) {
          if (keys && keys.length) {
            await redis.del(...keys);
          }
        }
        if (targetExpId !== normalizedExpId) {
          const streamUpper = redis.scanStream({ match: `exp:assign:${targetExpId}:*` });
          for await (const keys of streamUpper) {
            if (keys && keys.length) {
              await redis.del(...keys);
            }
          }
        }
      }
    } catch {
      // Bỏ qua lỗi
    }
  }

  /**
   * Hàm băm tất định (Deterministic Hash) bằng SHA-256
   * Trả về số nguyên từ 0 đến 99
   */
  computeHashBucket(subjectId, salt, experimentId) {
    const data = `${salt || "wf_salt"}:${experimentId}:${subjectId}`;
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    const intVal = parseInt(hash.slice(0, 8), 16);
    return intVal % 100;
  }

  /**
   * Phân nhóm thử nghiệm (Deterministic Assignment)
   * Yêu cầu:
   * - Không dùng Math.random()
   * - Tất định 100%, reload giữ nguyên nhóm
   * - Sub-millisecond (< 1ms)
   * - Bảo vệ quyền riêng tư: Kiểm tra consent status
   */
  async assignVariant(subjectId, options = {}) {
    const startTime = process.hrtime.bigint();
    const { userId = null, anonymousId = null, consentStatus = null, experimentId = null } = options;
    const targetExpId = (experimentId || process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID).trim();

    const effectiveSubjectId = subjectId || userId || anonymousId || "guest";

    // 1. Kiểm tra Quyền riêng tư (Privacy & Consent)
    let userConsent = consentStatus;
    if (!userConsent && (userId || anonymousId) && mongoose.connection?.readyState === 1) {
      try {
        const query = userId
          ? { user_id: new mongoose.Types.ObjectId(userId) }
          : { anonymous_id: anonymousId };
        const profile = await UserInterestProfile.findOne(query).select("consent_status").lean();
        userConsent = profile?.consent_status;
      } catch {
        // Bỏ qua lỗi đọc profile
      }
    }

    // Nếu người dùng từ chối theo dõi (consent = denied), bắt buộc chuyển sang Control (A)
    // Không cá nhân hóa, không ghi nhận vào dữ liệu thử nghiệm AI
    if (userConsent === "denied") {
      return {
        experiment_id: targetExpId,
        variant: "A",
        algorithm: "control_popular",
        mode: "control_popular",
        isAssigned: false,
        reason: "consent_denied",
        latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
      };
    }

    // 2. Lấy cấu hình thử nghiệm
    const exp = await this.getActiveExperiment(targetExpId);
    const effectiveExpId = exp?.experiment_id || targetExpId;

    // Nếu thử nghiệm bị tạm dừng (paused), ở trạng thái draft, hoặc đã kết thúc, toàn bộ về Control A
    if (!exp || exp.status !== "running") {
      return {
        experiment_id: effectiveExpId,
        variant: "A",
        algorithm: "control_popular",
        mode: "control_popular",
        isAssigned: false,
        reason: exp?.status ? `experiment_${exp.status}` : "experiment_not_found",
        latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
      };
    }

    // 3. Kiểm tra Sticky Assignment trong Tier-1 In-Memory Cache (< 0.05ms)
    const memKey = `${effectiveExpId}:${effectiveSubjectId}`;
    const memVariant = stickyLocalCache.get(memKey);
    if (memVariant) {
      const matchedVariant = exp.variants.find((v) => v.name === memVariant) || exp.variants[0];
      return {
        experiment_id: effectiveExpId,
        variant: matchedVariant.name,
        algorithm: matchedVariant.algorithm,
        mode: matchedVariant.algorithm,
        isAssigned: true,
        isSticky: true,
        latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
      };
    }

    const redis = getRedisConnection();
    const stickyKey = `exp:assign:${effectiveExpId}:${effectiveSubjectId}`;

    // 4. Kiểm tra Sticky Assignment trong Redis
    if (redis) {
      try {
        const cachedVariant = await redis.get(stickyKey);
        if (cachedVariant) {
          stickyLocalCache.set(memKey, cachedVariant);
          const matchedVariant = exp.variants.find((v) => v.name === cachedVariant) || exp.variants[0];
          return {
            experiment_id: effectiveExpId,
            variant: matchedVariant.name,
            algorithm: matchedVariant.algorithm,
            mode: matchedVariant.algorithm,
            isAssigned: true,
            isSticky: true,
            latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
          };
        }
      } catch {
        // Bỏ qua lỗi đọc Redis
      }
    }

    // 4. Nếu có liên kết anonymousId sang userId: Kiểm tra xem anonymousId đã có nhóm chưa
    if (userId && anonymousId && anonymousId !== userId && redis) {
      try {
        const anonVariant = await redis.get(`exp:assign:${effectiveExpId}:${anonymousId}`);
        if (anonVariant) {
          // Lưu nhóm của anonymous sang userId để giữ nhất quán trải nghiệm
          await redis.setex(stickyKey, 30 * 24 * 3600, anonVariant);
          const matchedVariant = exp.variants.find((v) => v.name === anonVariant) || exp.variants[0];
          return {
            experiment_id: effectiveExpId,
            variant: matchedVariant.name,
            algorithm: matchedVariant.algorithm,
            mode: matchedVariant.algorithm,
            isAssigned: true,
            isSticky: true,
            isBoundFromAnonymous: true,
            latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
          };
        }
      } catch {
        // Bỏ qua lỗi đọc Redis
      }
    }

    // 5. Tính toán phân nhóm tất định (Deterministic Assignment)
    const bucket = this.computeHashBucket(effectiveSubjectId, exp.salt, effectiveExpId);

    // Kiểm tra tỷ lệ điều phối giao thông tổng thể (traffic_allocation)
    const trafficAllocation = exp.traffic_allocation ?? 100;
    if (bucket >= trafficAllocation) {
      // Nằm ngoài traffic thử nghiệm -> Trả về Control A mặc định
      return {
        experiment_id: effectiveExpId,
        variant: "A",
        algorithm: "control_popular",
        mode: "control_popular",
        isAssigned: false,
        reason: "traffic_allocation_excluded",
        latencyMs: Number(process.hrtime.bigint() - startTime) / 1e6,
      };
    }

    // Ánh xạ bucket vào danh sách variants dựa trên tỷ trọng tích lũy (Cumulative Weight)
    let cumulative = 0;
    let selectedVariant = exp.variants[0];

    for (const v of exp.variants) {
      cumulative += v.weight;
      if (bucket < cumulative) {
        selectedVariant = v;
        break;
      }
    }

    // 6. Lưu Sticky Assignment vào Tier-1 In-Memory & Redis (30 ngày)
    stickyLocalCache.set(memKey, selectedVariant.name);
    if (stickyLocalCache.size > MAX_LOCAL_CACHE_SIZE) {
      stickyLocalCache.clear();
    }

    if (redis && effectiveSubjectId !== "guest") {
      try {
        redis.setex(stickyKey, 30 * 24 * 3600, selectedVariant.name).catch(() => {});
      } catch {
        // Bỏ qua lỗi ghi Redis
      }
    }

    const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;

    return {
      experiment_id: experimentId,
      variant: selectedVariant.name,
      algorithm: selectedVariant.algorithm,
      mode: selectedVariant.algorithm,
      isAssigned: true,
      bucket,
      latencyMs: elapsedMs,
    };
  }

  /**
   * Liên kết danh tính khi người dùng ẩn danh (anonymousId) đăng nhập thành (userId)
   */
  async bindIdentity(anonymousId, userId, experimentId = DEFAULT_REC_EXPERIMENT_ID) {
    if (!anonymousId || !userId || anonymousId === userId) return;
    try {
      const redis = getRedisConnection();
      if (!redis) return;

      const anonKey = `exp:assign:${experimentId}:${anonymousId}`;
      const userKey = `exp:assign:${experimentId}:${userId}`;

      const anonVariant = stickyLocalCache.get(`${experimentId}:${anonymousId}`) || (redis ? await redis.get(anonKey) : null);
      if (anonVariant) {
        stickyLocalCache.set(`${experimentId}:${userId}`, anonVariant);
        if (redis) {
          await redis.setex(userKey, 30 * 24 * 3600, anonVariant);
        }
      }

      // Kế thừa phiên tiếp xúc và phiên tương tác của anonymous sang user đã xác thực
      if (redis) {
        const anonExposure = await redis.get(`exp:exposure:${anonymousId}`);
        if (anonExposure) {
          await redis.setex(`exp:exposure:${userId}`, 24 * 3600, anonExposure);
        }
        const anonSession = await redis.get(`exp:session:${anonymousId}`);
        if (anonSession) {
          await redis.setex(`exp:session:${userId}`, 24 * 3600, anonSession);
        }
      }
    } catch (err) {
      console.warn("[ExperimentService] Lỗi khi liên kết danh tính A/B testing:", err.message);
    }
  }

  /**
   * Ghi nhận sự kiện tiếp xúc thực tế (experiment_exposed)
   * Chỉ ghi nhận khi người dùng thực sự nhìn thấy giao diện đề xuất (enter viewport)
   * Chống trùng lặp (dedup) trong 30 phút cho mỗi phiên
   */
  async recordExposure({ subjectId, userId = null, anonymousId = null, experimentId = DEFAULT_REC_EXPERIMENT_ID, variant, requestId = null, meta = {} }) {
    const effectiveSubject = subjectId || userId || anonymousId;
    if (!effectiveSubject || !variant) return false;

    const redis = getRedisConnection();
    const dedupKey = `exp:exposed:${experimentId}:${variant}:${effectiveSubject}`;

    if (redis) {
      try {
        const alreadyExposed = await redis.get(dedupKey);
        if (alreadyExposed) {
          return false; // Đã ghi nhận tiếp xúc trong phiên này, không double-count
        }
        await redis.setex(dedupKey, 1800, "1"); // 30 phút chống trùng

        // Lưu trạng thái tiếp xúc cho cửa sổ quy kết chuyển đổi (mặc định 24h)
        const exp = await this.getActiveExperiment(experimentId);
        const windowHours = exp?.attribution_window_hours || 24;
        const ttlSeconds = windowHours * 3600;
        const expData = JSON.stringify({
          experiment_id: experimentId,
          variant,
          exposed_at: Date.now(),
        });
        await redis.setex(`exp:exposure:${effectiveSubject}`, ttlSeconds, expData);
        if (userId && effectiveSubject !== userId) {
          await redis.setex(`exp:exposure:${userId}`, ttlSeconds, expData);
        }
      } catch {
        // Bỏ qua lỗi Redis
      }
    }

    // Đẩy sự kiện experiment_exposed vào hàng đợi tracking
    try {
      await addTrackingJob({
        event_id: new mongoose.Types.ObjectId().toString(),
        user_id: userId ? userId.toString() : null,
        anonymous_id: anonymousId || (!userId ? effectiveSubject : null),
        event_type: EVENT_TYPES.EXPERIMENT_EXPOSED,
        product_id: null,
        category_id: null,
        source: "ab_experiment",
        meta: {
          experiment_id: experimentId,
          variant,
          request_id: requestId,
          ...meta,
        },
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.warn("[ExperimentService] Lỗi khi ghi nhận sự kiện experiment_exposed:", err.message);
      return false;
    }
  }

  /**
   * Ghi nhận tương tác chạm sản phẩm đề xuất (Recommendation Click Touch)
   * Phục vụ cửa sổ quy kết chuyển đổi (Attribution Window - mặc định 24h)
   */
  async recordProductTouch({ subjectId, userId = null, anonymousId = null, productId, experimentId = DEFAULT_REC_EXPERIMENT_ID, variant, requestId = null }) {
    const effectiveSubject = subjectId || userId || anonymousId;
    if (!effectiveSubject || !productId || !variant) return;

    const redis = getRedisConnection();
    if (!redis) return;

    try {
      const exp = await this.getActiveExperiment(experimentId);
      const windowHours = exp?.attribution_window_hours || 24;
      const ttlSeconds = windowHours * 3600;

      const pIdStr = productId.toString();
      const touchKey = `exp:touch:${effectiveSubject}:${pIdStr}`;
      const touchData = {
        experiment_id: experimentId,
        variant,
        request_id: requestId,
        touched_at: Date.now(),
      };

      await redis.setex(touchKey, ttlSeconds, JSON.stringify(touchData));

      // Lưu thêm phiên tiếp xúc gần nhất của user để hỗ trợ session attribution
      const userSessionExpKey = `exp:session:${effectiveSubject}`;
      await redis.setex(userSessionExpKey, ttlSeconds, JSON.stringify({
        experiment_id: experimentId,
        variant,
        touched_at: Date.now(),
      }));
    } catch (err) {
      console.warn("[ExperimentService] Lỗi ghi nhận product touch:", err.message);
    }
  }

  /**
   * Xác định thuộc tính quy kết (Attribution Resolution) cho đơn hàng / thanh toán
   * Kiểm tra xem các sản phẩm trong đơn có được tương tác từ gợi ý trong cửa sổ quy kết hay không
   */
  async resolveOrderAttribution(userId, items = []) {
    if (!userId) return null;

    const redis = getRedisConnection();
    if (!redis) return null;

    try {
      const userIdStr = userId.toString();
      let directRecAssisted = false;
      let matchedExperimentId = null;
      let matchedVariant = null;
      let attributionType = null;

      // 1. Kiểm tra quy kết trực tiếp theo từng sản phẩm trong giỏ/đơn (Recommendation-Assisted)
      for (const item of items) {
        const pId = item.product_id ? (item.product_id._id || item.product_id).toString() : null;
        if (!pId) continue;

        const touchKey = `exp:touch:${userIdStr}:${pId}`;
        const touchRaw = await redis.get(touchKey);
        if (touchRaw) {
          const touch = JSON.parse(touchRaw);
          directRecAssisted = true;
          attributionType = "rec_assisted";
          matchedExperimentId = touch.experiment_id;
          matchedVariant = touch.variant;
          break;
        }
      }

      // 2. Nếu không có click trực tiếp vào sản phẩm, kiểm tra xem có tiếp xúc thử nghiệm trong cửa sổ 24h không (Exposure-based)
      if (!directRecAssisted) {
        const exposureRaw = (await redis.get(`exp:exposure:${userIdStr}`)) || (await redis.get(`exp:session:${userIdStr}`));
        if (exposureRaw) {
          const expTouch = JSON.parse(exposureRaw);
          attributionType = "exposure";
          matchedExperimentId = expTouch.experiment_id;
          matchedVariant = expTouch.variant;
        }
      }

      // 3. Fallback: Intent-to-Treat (người dùng được phân nhóm nhưng chuyển đổi xảy ra ngoài cửa sổ 24h hoặc không tiếp xúc rec)
      if (!matchedExperimentId) {
        const targetExpId = process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID;
        const activeExp = await this.getActiveExperiment(targetExpId);
        if (activeExp && activeExp.status === "running") {
          const assigned = await this.assignVariant(userIdStr, { userId: userIdStr, experimentId: targetExpId });
          if (assigned?.isAssigned) {
            matchedExperimentId = assigned.experiment_id;
            matchedVariant = assigned.variant;
            attributionType = "itt_only";
          }
        }
      }

      if (matchedExperimentId && matchedVariant) {
        return {
          experiment_id: matchedExperimentId,
          variant: matchedVariant,
          is_direct_rec_assisted: directRecAssisted,
          is_exposure_attributed: attributionType === "rec_assisted" || attributionType === "exposure",
          attribution_type: attributionType,
        };
      }

      return null;
    } catch (err) {
      console.warn("[ExperimentService] Lỗi xác định quy kết đơn hàng:", err.message);
      return null;
    }
  }

  /**
   * Bật/Tắt, tạm dừng hoặc Rollback khẩn cấp thử nghiệm
   */
  async updateExperimentStatus(experimentId, { status, rollbackToControl = false, adminId = null }) {
    const exp = await Experiment.findOne({ experiment_id: experimentId });
    if (!exp) {
      throw new Error(`Không tìm thấy thử nghiệm ${experimentId}`);
    }

    const oldStatus = exp.status;
    const changes = {};

    if (rollbackToControl) {
      // Rollback khẩn cấp: 100% traffic chuyển về Control A
      exp.status = "paused";
      exp.variants = exp.variants.map((v) => ({
        ...v,
        weight: v.name === "A" ? 100 : 0,
      }));
      changes.action = "rollback_to_100_control";
      changes.status = "paused";
    } else if (status) {
      exp.status = status;
      changes.status = status;
    }

    exp.config_history.push({
      changed_at: new Date(),
      changed_by: adminId ? adminId.toString() : "admin",
      changes: { oldStatus, ...changes },
    });

    await exp.save();
    await this.invalidateExperimentCache(experimentId);

    return exp;
  }
}

export default new ExperimentService();
