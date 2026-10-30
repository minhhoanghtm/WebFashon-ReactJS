import VectorEmbedding from "../models/vectorEmbedding.model.js";
import embeddingService from "./embedding.service.js";
import Product from "../../products/product.model.js";
import Category from "../../categories/category.model.js";
import pricingService from "../../campaigns/pricing.service.js";
import { toNoAccent } from "../../../common/utils/removeAccents.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import logger from "../../../common/logger.js";

/**
 * Compute cosine similarity between two numeric vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Parse Vietnamese price token such as "200k", "1.5tr", "500.000đ", "300 nghìn"
 */
export function parseVietnamesePriceToken(amountStr, unitStr = "") {
  if (!amountStr) return null;
  const unit = String(unitStr || "").toLowerCase().trim();
  let raw = String(amountStr).trim();

  if (["k", "nghin", "ngan", "nghìn", "ngàn"].includes(unit)) {
    const num = parseFloat(raw.replace(/,/g, "."));
    return Number.isFinite(num) ? Math.round(num * 1000) : null;
  }
  if (["tr", "trieu", "triệu", "m", "cu", "củ"].includes(unit)) {
    const num = parseFloat(raw.replace(/,/g, "."));
    return Number.isFinite(num) ? Math.round(num * 1000000) : null;
  }

  // Plain number like 200.000 or 200000
  const digitsOnly = raw.replace(/[.,\s]/g, "");
  const parsed = parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 1000 ? parsed * 1000 : parsed;
}

export const VIETNAMESE_FASHION_SYNONYMS = [
  { match: /(?<!\p{L})(?:quần\s+bò|quan\s+bo)(?!\p{L})/giu, canonical: "quần jean" },
  { match: /(?<!\p{L})(?:áo\s+cộc(?:\s+tay)?|ao\s+coc(?:\s+tay)?)(?!\p{L})/giu, canonical: "áo thun" },
  { match: /(?<!\p{L})(?:áo\s+phông|ao\s+phong)(?!\p{L})/giu, canonical: "áo thun" },
  { match: /(?<!\p{L})(?:quần\s+sooc|quan\s+sooc|quần\s+sọt|quan\s+sot)(?!\p{L})/giu, canonical: "quần short" },
  { match: /(?<!\p{L})(?:đồ\s+mùa\s+đông|do\s+mua\s+dong|mùa\s+đông|mua\s+dong|đồ\s+ấm|do\s+am)(?!\p{L})/giu, canonical: "áo khoác áo hoodie áo len ấm" },
  { match: /(?<!\p{L})(?:đồ\s+mùa\s+hè|do\s+mua\s+he|đồ\s+đi\s+biển|do\s+di\s+bien|đi\s+biển|di\s+bien|thoáng\s+mát|thoang\s+mat)(?!\p{L})/giu, canonical: "áo thun linen quần short mùa hè thoáng mát" },
  { match: /(?<!\p{L})(?:trang\s+phục\s+đi\s+học|trang\s+phuc\s+di\s+hoc|đi\s+học|di\s+hoc|công\s+sở|cong\s+so|đi\s+làm|di\s+lam)(?!\p{L})/giu, canonical: "áo sơ mi polo quần tây" },
];

/**
 * Extract structured constraints (minPrice, maxPrice, quantity, colors, sizes, inStock)
 * from a Vietnamese natural language query.
 */
export function parseNaturalLanguageQuery(rawQuery = "") {
  const original = String(rawQuery || "").normalize("NFC").trim();
  const lower = original.toLowerCase();
  const noAccent = toNoAccent(lower);

  let minPrice = null;
  let maxPrice = null;
  let requestedQuantity = null;
  let inStockOnly = null;

  // 1. Price range: "từ 200k đến 500k", "trong khoảng 100k - 300k"
  const rangeMatch = lower.match(
    /(?:từ|tu|khoảng|khoang)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?\s*(?:đến|den|tới|toi|-|~)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?/i
  );
  if (rangeMatch) {
    const p1 = parseVietnamesePriceToken(rangeMatch[1], rangeMatch[2] || rangeMatch[4]);
    const p2 = parseVietnamesePriceToken(rangeMatch[3], rangeMatch[4] || rangeMatch[2]);
    if (p1 !== null && p2 !== null) {
      minPrice = Math.min(p1, p2);
      maxPrice = Math.max(p1, p2);
    }
  } else {
    // 2. Max price: "dưới 200k", "nhỏ hơn 500k", "tối đa 300k", "< 400k", "không quá 500k"
    const underMatch = lower.match(
      /(?:dưới|duoi|nhỏ hơn|nho hon|tối đa|toi da|không quá|khong qua|<=|<)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?/i
    );
    if (underMatch) {
      maxPrice = parseVietnamesePriceToken(underMatch[1], underMatch[2]);
    }

    // 3. Min price: "trên 300k", "từ 300k trở lên", "lớn hơn 500k", "tối thiểu 200k", "> 300k"
    const overMatch = lower.match(
      /(?:trên|tren|lớn hơn|lon hon|tối thiểu|toi thieu|từ|tu|>=|>)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?(?:\s*trở lên|\s*tro len)?/i
    );
    if (overMatch && !underMatch) {
      minPrice = parseVietnamesePriceToken(overMatch[1], overMatch[2]);
    }
  }

  // Fallback price ceiling for budget intent: "giá rẻ", "tiết kiệm", "bình dân", "sinh viên"
  if (maxPrice === null && /(?:giá\s+rẻ|gia\s+re|tiết\s+kiệm|tiet\s+kiem|sinh\s+viên|sinh\s+vien|bình\s+dân|binh\s+dan)/i.test(lower)) {
    maxPrice = 350000;
  }

  // 4. Quantity extraction: e.g., "tìm cho tôi 3 áo thun", "mua 2 quần jean"
  const qtyMatch = lower.match(
    /(?:tìm|tim|mua|lấy|lay|thêm|them|cho tôi|cho minh|cho mình)\s+(\d{1,2})\s+(?:cái|chiếc|bộ|đôi|sản phẩm|áo|quần|váy|đầm|chuột|món)?/i
  );
  if (qtyMatch) {
    const q = parseInt(qtyMatch[1], 10);
    if (q > 0 && q <= 20) requestedQuantity = q;
  }

  // 5. Stock intent
  if (/(?:còn hàng|con hang|có sẵn|co san|in stock)/i.test(lower)) {
    inStockOnly = true;
  }

  // 6. Size extraction: "size M", "cỡ XL"
  let size = null;
  const sizeMatch = lower.match(/\b(?:size|cỡ|co|kích cỡ|kich co)\s+(xxs|xs|s|m|l|xl|2xl|xxl|3xl|28|29|30|31|32|33|34)\b/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
  }

  // 7. Color extraction: "màu đen", "màu trắng", or standalone "đen", "trắng"
  let color = null;
  const colorPrefixMatch = lower.match(
    /(?:màu|mau)\s+(đen|trắng|xám|đỏ|xanh dương|xanh navy|xanh lá|xanh|vàng|hồng|nâu|be|kem|tím|cam|black|white|grey|gray|navy|blue|green|red|beige|brown|pink)/iu
  );
  if (colorPrefixMatch) {
    color = colorPrefixMatch[1].trim();
  } else {
    const directColorMatch = lower.match(
      /(?<!\p{L})(đen|trắng|xám|đỏ|xanh dương|xanh navy|xanh lá|vàng|hồng|nâu|be|kem|tím|cam|black|white|grey|gray|navy|beige|brown|pink)(?!\p{L})/iu
    );
    if (directColorMatch) {
      color = directColorMatch[1].trim();
    }
  }

  // Clean semantic query text by removing price constraint phrases so vector focuses on product semantics
  let semanticText = original
    .replace(
      /(?:từ|tu|khoảng|khoang)\s*\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?\s*(?:đến|den|tới|toi|-|~)\s*\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?/gi,
      " "
    )
    .replace(
      /(?:dưới|duoi|nhỏ hơn|nho hon|tối đa|toi da|không quá|khong qua|trên|tren|lớn hơn|lon hon|tối thiểu|toi thieu|<=|<|>=|>)\s*\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|đ|d|vnd)?/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  // Expand Vietnamese fashion synonyms in semantic text
  for (const item of VIETNAMESE_FASHION_SYNONYMS) {
    if (item.match.test(semanticText)) {
      semanticText = `${semanticText} ${item.canonical}`;
    }
    item.match.lastIndex = 0;
  }
  semanticText = semanticText.replace(/\s+/g, " ").trim();

  return {
    rawQuery: original,
    semanticQuery: semanticText || original,
    noAccentQuery: noAccent,
    extractedFilters: {
      minPrice,
      maxPrice,
      size,
      color,
      inStockOnly,
      requestedQuantity,
    },
  };
}

const VIETNAMESE_STOPWORDS = new Set([
  "tim", "cho", "toi", "minh", "co", "khong", "nao", "nhung", "cac", "mot", "cai", "chiec",
  "duoi", "tren", "tu", "den", "gia", "khoang", "va", "hoac", "la", "cua", "o", "tai",
  "shop", "cua", "hang", "muon", "mua", "xem", "hoi", "ve", "voi", "loai", "san", "pham",
  "ton", "ton tai", "hien", "dang",
]);

/**
 * Compute lexical/keyword relevance score [0, 1] for hybrid search
 */
export function computeKeywordScore(queryText, doc) {
  if (!queryText || !doc) return 0;
  const qNorm = toNoAccent(String(queryText).toLowerCase()).trim();
  const titleNorm = toNoAccent(String(doc.title || "").toLowerCase());
  const contentNorm = doc.contentNoAccents || toNoAccent(String(doc.content || "").toLowerCase());

  if (!qNorm) return 0;

  // Exact phrase match in title or content
  let score = 0;
  if (titleNorm.includes(qNorm)) {
    score += 0.65;
  } else if (contentNorm.includes(qNorm)) {
    score += 0.4;
  }

  let expandedQuery = qNorm;
  for (const item of VIETNAMESE_FASHION_SYNONYMS) {
    if (item.match.test(expandedQuery)) {
      expandedQuery += ` ${toNoAccent(item.canonical)}`;
    }
    item.match.lastIndex = 0;
  }

  const tokens = expandedQuery
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !VIETNAMESE_STOPWORDS.has(t));

  if (tokens.length === 0) return Math.min(1, score);

  let titleHits = 0;
  let contentHits = 0;
  for (const token of tokens) {
    if (titleNorm.includes(token)) titleHits++;
    if (contentNorm.includes(token)) contentHits++;
  }

  const titleRatio = titleHits / tokens.length;
  const contentRatio = contentHits / tokens.length;

  if (titleHits > 0) {
    score += titleRatio * 0.55 + contentRatio * 0.35;
  } else if (contentHits >= 2 || (tokens.length === 1 && contentHits === 1)) {
    score += contentRatio * 0.35;
  }
  return Math.min(1, Number(score.toFixed(4)));
}

export class SemanticSearchService {
  constructor() {
    this.metrics = {
      totalSearches: 0,
      hybridSearches: 0,
      fallbackSearches: 0,
      lastLatencyMs: 0,
      avgLatencyMs: 0,
    };
  }

  _recordLatency(ms) {
    this.metrics.lastLatencyMs = ms;
    const n = this.metrics.totalSearches;
    this.metrics.avgLatencyMs = Number(
      (((this.metrics.avgLatencyMs * Math.max(0, n - 1)) + ms) / Math.max(1, n)).toFixed(2)
    );
  }

  /**
   * Build MongoDB filter query enforcing permissionScope, active state, and exact metadata filters
   */
  buildMetadataFilter(filters = {}, authContext = {}) {
    const mongoFilter = {
      isActive: filters.includeInactive ? { $in: [true, false] } : true,
    };

    // Permission / Tenant scope enforcement
    const userRole = authContext?.role || "guest";
    const userId = authContext?.userId ? String(authContext.userId) : null;
    if (userRole !== "admin") {
      const allowedScopes = ["public"];
      if (userId) {
        allowedScopes.push(`user:${userId}`);
      }
      if (filters.permissionScope) {
        // Never allow non-admin to request a scope outside their allowedScopes
        if (!allowedScopes.includes(filters.permissionScope)) {
          mongoFilter.permissionScope = "__unauthorized_scope__";
        } else {
          mongoFilter.permissionScope = filters.permissionScope;
        }
      } else {
        mongoFilter.permissionScope = { $in: allowedScopes };
      }
    } else if (filters.permissionScope) {
      mongoFilter.permissionScope = filters.permissionScope;
    }

    if (filters.tenantId) {
      mongoFilter.tenantId = filters.tenantId;
    }

    // Source type filtering
    if (filters.sourceType) {
      if (Array.isArray(filters.sourceType)) {
        mongoFilter.sourceType = { $in: filters.sourceType };
      } else {
        mongoFilter.sourceType = filters.sourceType;
      }
    }

    // Exact product metadata filters (price, stock, category, rating)
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      mongoFilter["metadata.price"] = {
        ...mongoFilter["metadata.price"],
        $gte: Number(filters.minPrice),
      };
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      mongoFilter["metadata.price"] = {
        ...mongoFilter["metadata.price"],
        $lte: Number(filters.maxPrice),
      };
    }
    if (filters.inStock === true) {
      mongoFilter["metadata.inStock"] = true;
    }
    if (filters.categoryId) {
      const catIds = String(filters.categoryId)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (catIds.length === 1) {
        mongoFilter["metadata.categoryId"] = catIds[0];
      } else if (catIds.length > 1) {
        mongoFilter["metadata.categoryId"] = { $in: catIds };
      }
    }
    if (filters.minRating !== undefined && filters.minRating !== null) {
      mongoFilter["metadata.rating"] = { $gte: Number(filters.minRating) };
    }

    return mongoFilter;
  }

  /**
   * Perform Hybrid Semantic Search (Vector + Keyword + Metadata Filter + Re-ranking + Fallback)
   */
  async search(params = {}, authContext = {}) {
    const startTime = Date.now();
    this.metrics.totalSearches++;

    const rawQuery = String(params.query ?? params.keyword ?? params.search ?? "").trim();
    if (!rawQuery) {
      throw new AppError("Vui lòng nhập nội dung tìm kiếm (query)", 400);
    }

    const topK = Math.min(Math.max(Number(params.topK || params.limit || 10), 1), 50);
    const parsedNL = parseNaturalLanguageQuery(rawQuery);

    // Merge explicit filters with NL-extracted filters (explicit filters take precedence)
    const effectiveFilters = {
      sourceType: params.sourceType || "product",
      minPrice: params.minPrice ?? parsedNL.extractedFilters.minPrice,
      maxPrice: params.maxPrice ?? parsedNL.extractedFilters.maxPrice,
      inStock: params.inStock ?? parsedNL.extractedFilters.inStockOnly,
      categoryId: params.categoryId || params.category || null,
      color: params.color || parsedNL.extractedFilters.color || null,
      size: params.size || parsedNL.extractedFilters.size || null,
      minRating: params.minRating ?? params.rating ?? null,
      permissionScope: params.permissionScope || null,
      tenantId: params.tenantId || null,
    };

    // Resolve category slug if provided
    if (params.categorySlug && !effectiveFilters.categoryId) {
      const cat = await Category.findOne({ slug: params.categorySlug }).select("_id").lean();
      if (cat) effectiveFilters.categoryId = String(cat._id);
    }

    const mongoFilter = this.buildMetadataFilter(effectiveFilters, authContext);

    try {
      // 1. Check candidate documents in Vector Storage matching metadata filter
      let candidates = [];
      const engine = (process.env.VECTOR_SEARCH_ENGINE || "mongo_cosine").toLowerCase();

      // Embed query text
      const queryEmbed = await embeddingService.embedText(parsedNL.semanticQuery, {
        allowLocalFallback: true,
      });

      // If provider was unreachable and returned fallback hash vector, immediately fallback to lexical product search
      if (queryEmbed.fallback && effectiveFilters.sourceType === "product") {
        return await this._fallbackProductKeywordSearch(
          parsedNL,
          effectiveFilters,
          topK,
          startTime,
          "embedding_provider_offline_lexical_fallback"
        );
      }

      const activeModel = queryEmbed.model || "openai/text-embedding-3-small";
      const activeDimensions = queryEmbed.dimensions || queryEmbed.vector.length;
      const baseModel = activeModel.includes("/") ? activeModel.split("/").pop() : activeModel;
      const allowedModels = [
        activeModel,
        baseModel,
        `openai/${baseModel}`,
        `openrouter/${baseModel}`,
      ];

      // Enforce dimension and model isolation to prevent mixing vector spaces
      mongoFilter.dimensions = activeDimensions;
      mongoFilter.embeddingModel = { $in: allowedModels };

      if (engine === "atlas") {
        try {
          candidates = await VectorEmbedding.aggregate([
            {
              $vectorSearch: {
                index: process.env.VECTOR_INDEX_NAME || "vector_index",
                path: "embedding",
                queryVector: queryEmbed.vector,
                numCandidates: Math.max(topK * 10, 100),
                limit: topK * 3,
              },
            },
            { $match: mongoFilter },
            {
              $addFields: {
                atlasScore: { $meta: "vectorSearchScore" },
              },
            },
          ]);
        } catch (atlasErr) {
          logger.warn("Atlas $vectorSearch not available, falling back to mongo_cosine", {
            error: atlasErr.message,
          });
          candidates = await VectorEmbedding.find(mongoFilter).lean();
        }
      } else {
        candidates = await VectorEmbedding.find(mongoFilter).lean();
      }

      // If no vector candidates matched (empty index or strict metadata filter), gracefully fallback to lexical keyword search
      if (candidates.length === 0 && effectiveFilters.sourceType === "product") {
        return await this._fallbackProductKeywordSearch(
          parsedNL,
          effectiveFilters,
          topK,
          startTime,
          "no_candidate_vectors_matched"
        );
      }

      // 2. Post-filter by color/size if requested & compute Hybrid Score (Vector + Keyword + Business Boost)
      const isLocalModel =
        queryEmbed.model?.includes("local") || Boolean(queryEmbed.fallback);
      const defaultThreshold = isLocalModel
        ? 0.16
        : Number(process.env.VECTOR_MIN_SIMILARITY || 0.28);
      const minScore =
        params.minScore !== undefined ? Number(params.minScore) : defaultThreshold;

      const scoredResults = [];

      for (const doc of candidates) {
        // Optional color/size filter for products
        if (doc.sourceType === "product") {
          if (effectiveFilters.color) {
            const targetColor = toNoAccent(effectiveFilters.color).toLowerCase();
            const docColors = (doc.metadata?.colors || []).map((c) =>
              toNoAccent(String(c)).toLowerCase()
            );
            if (
              docColors.length > 0 &&
              !docColors.some((c) => c.includes(targetColor) || targetColor.includes(c))
            ) {
              continue;
            }
          }
          if (effectiveFilters.size) {
            const targetSize = String(effectiveFilters.size).toUpperCase().trim();
            const docSizes = (doc.metadata?.sizes || []).map((s) =>
              String(s).toUpperCase().trim()
            );
            if (docSizes.length > 0 && !docSizes.includes(targetSize)) {
              continue;
            }
          }
        }

        // Compute vector similarity only when dimensions and model family match
        let vectorScore = 0;
        if (typeof doc.atlasScore === "number") {
          vectorScore = doc.atlasScore;
        } else if (
          Array.isArray(doc.embedding) &&
          doc.embedding.length === queryEmbed.vector.length &&
          (!doc.embeddingModel || allowedModels.includes(doc.embeddingModel))
        ) {
          vectorScore = Math.max(0, cosineSimilarity(queryEmbed.vector, doc.embedding));
        }

        const keywordScore = computeKeywordScore(parsedNL.semanticQuery, doc);

        // Hybrid fusion: weighted combination + strong keyword boost when exact concepts match
        const hybridWeightVector = params.vectorWeight ?? (isLocalModel ? 0.55 : 0.72);
        const hybridWeightKeyword = 1 - hybridWeightVector;

        let combinedScore =
          vectorScore * hybridWeightVector + keywordScore * hybridWeightKeyword;

        // If both vector and keyword agree, apply synergy bonus
        if (vectorScore >= 0.35 && keywordScore >= 0.35) {
          combinedScore = Math.min(1, combinedScore + 0.08);
        }

        // Small business quality tie-breaker boost for products (stock + rating)
        if (doc.sourceType === "product" && doc.metadata) {
          if (doc.metadata.inStock) combinedScore += 0.015;
          if (doc.metadata.rating >= 4.5) combinedScore += 0.01;
        }

        combinedScore = Number(Math.min(1, combinedScore).toFixed(4));

        const isQualified =
          (keywordScore >= 0.2 && combinedScore >= minScore) ||
          (keywordScore === 0 && vectorScore >= 0.50) ||
          keywordScore >= 0.45;

        if (isQualified) {
          scoredResults.push({
            sourceId: doc.sourceId,
            sourceType: doc.sourceType,
            title: doc.title,
            content: doc.content,
            score: combinedScore,
            vectorScore: Number(vectorScore.toFixed(4)),
            keywordScore: Number(keywordScore.toFixed(4)),
            metadata: doc.metadata || {},
            permissionScope: doc.permissionScope,
            updatedAt: doc.updatedAt,
          });
        }
      }

      // 3. Re-rank by combined score descending
      scoredResults.sort((a, b) => b.score - a.score);
      const topResults = scoredResults.slice(0, topK);

      this.metrics.hybridSearches++;
      const latencyMs = Date.now() - startTime;
      this._recordLatency(latencyMs);

      return {
        query: rawQuery,
        semanticQuery: parsedNL.semanticQuery,
        appliedFilters: effectiveFilters,
        searchMode: "hybrid_vector",
        model: queryEmbed.model,
        fallback: false,
        totalCandidates: candidates.length,
        totalMatched: scoredResults.length,
        latencyMs,
        results: topResults,
      };
    } catch (error) {
      logger.error("SemanticSearchService error, executing keyword fallback:", error);
      if (effectiveFilters.sourceType === "product") {
        return await this._fallbackProductKeywordSearch(
          parsedNL,
          effectiveFilters,
          topK,
          startTime,
          error.message
        );
      }
      throw error;
    }
  }

  /**
   * Fallback keyword search directly on MongoDB Product collection when Vector Search is unavailable
   */
  async _fallbackProductKeywordSearch(parsedNL, effectiveFilters, topK, startTime, reason) {
    this.metrics.fallbackSearches++;
    const query = { is_active: true };

    if (effectiveFilters.permissionScope && effectiveFilters.permissionScope !== "public") {
      return {
        query: parsedNL.rawQuery,
        semanticQuery: parsedNL.semanticQuery,
        appliedFilters: effectiveFilters,
        searchMode: "keyword_fallback",
        fallback: true,
        fallbackReason: reason,
        totalCandidates: 0,
        totalMatched: 0,
        latencyMs: Date.now() - startTime,
        results: [],
      };
    }

    const cleanWords = toNoAccent(parsedNL.semanticQuery)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !VIETNAMESE_STOPWORDS.has(w));

    if (cleanWords.length > 0) {
      query.$or = cleanWords.flatMap((w) => {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return [
          { name_no_accents: { $regex: escaped, $options: "i" } },
          { name: { $regex: escaped, $options: "i" } },
          { description: { $regex: escaped, $options: "i" } },
        ];
      });
    }

    if (effectiveFilters.minPrice !== null && effectiveFilters.minPrice !== undefined) {
      query.new_price = { ...query.new_price, $gte: Number(effectiveFilters.minPrice) };
    }
    if (effectiveFilters.maxPrice !== null && effectiveFilters.maxPrice !== undefined) {
      query.new_price = { ...query.new_price, $lte: Number(effectiveFilters.maxPrice) };
    }
    if (effectiveFilters.inStock === true) {
      query.stock = { $gt: 0 };
    }
    if (effectiveFilters.categoryId) {
      query.category_id = effectiveFilters.categoryId;
    }

    const rawProducts = await Product.find(query)
      .limit(topK)
      .populate("variants")
      .populate("category_id", "name")
      .lean();

    const pricedProducts = await pricingService
      .resolvePricesForProducts(rawProducts)
      .catch(() => rawProducts);

    const results = pricedProducts.map((p, idx) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const totalStock =
        variants.length > 0
          ? variants.reduce((s, v) => s + Number(v.stock || 0), 0)
          : Number(p.stock || 0);
      return {
        sourceId: String(p._id),
        sourceType: "product",
        title: p.name,
        content: `${p.name}. ${p.description || ""}`.trim(),
        score: Number(Math.max(0.3, 0.85 - idx * 0.05).toFixed(4)),
        vectorScore: 0,
        keywordScore: Number(Math.max(0.3, 0.85 - idx * 0.05).toFixed(4)),
        metadata: {
          productId: String(p._id),
          name: p.name,
          slug: p.slug,
          categoryId: String(p.category_id?._id || p.category_id || ""),
          categoryName: p.category_id?.name || "Thời trang",
          price: Number(p.new_price ?? p.price ?? 0),
          oldPrice: Number(p.old_price ?? 0),
          stock: totalStock,
          inStock: totalStock > 0,
          colors: [...new Set(variants.map((v) => v.color).filter(Boolean))],
          sizes: [...new Set(variants.map((v) => v.size).filter(Boolean))],
          rating: Number(p.rating || 0),
          sold: Number(p.sold || 0),
          image: p.displayProduct?.[0] || variants[0]?.image_url || "",
        },
        permissionScope: "public",
      };
    });

    const latencyMs = Date.now() - startTime;
    this._recordLatency(latencyMs);

    return {
      query: parsedNL.rawQuery,
      semanticQuery: parsedNL.semanticQuery,
      appliedFilters: effectiveFilters,
      searchMode: "keyword_fallback",
      fallback: true,
      fallbackReason: reason,
      totalCandidates: rawProducts.length,
      totalMatched: results.length,
      latencyMs,
      results,
    };
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

const semanticSearchService = new SemanticSearchService();
export default semanticSearchService;
