import crypto from "crypto";
import logger from "../../../common/logger.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import { createEmbeddingProvider } from "../providers/createEmbeddingProvider.js";
import { LocalEmbeddingProvider } from "../providers/LocalEmbeddingProvider.js";

const MAX_INPUT_CHARS = 12000;
const QUERY_CACHE_MAX_SIZE = 500;
const QUERY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class EmbeddingService {
  constructor({ provider = null, maxRetries = 2, retryDelayMs = 400, batchSize = 25 } = {}) {
    this._customProvider = provider;
    this.maxRetries = Number(process.env.EMBEDDING_MAX_RETRIES ?? maxRetries);
    this.retryDelayMs = Number(process.env.EMBEDDING_RETRY_DELAY_MS ?? retryDelayMs);
    this.batchSize = Number(process.env.EMBEDDING_BATCH_SIZE ?? batchSize);

    // LRU-like in-memory query embedding cache: hash -> { vector, model, dimensions, expiresAt }
    this.cache = new Map();

    // Token, cost & performance metrics
    this.metrics = {
      totalRequests: 0,
      totalBatchRequests: 0,
      totalTextsEmbedded: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      cacheHits: 0,
      retryCount: 0,
      errorCount: 0,
      fallbackCount: 0,
      lastLatencyMs: 0,
      avgLatencyMs: 0,
      _latencySamples: 0,
    };
  }

  get provider() {
    if (this._customProvider) return this._customProvider;
    if (!this._defaultProvider) {
      this._defaultProvider = createEmbeddingProvider();
    }
    return this._defaultProvider;
  }

  setProvider(provider) {
    this._customProvider = provider;
  }

  resetProvider() {
    this._customProvider = null;
    this._defaultProvider = null;
  }

  /**
   * Normalize Vietnamese text (NFC, collapse whitespace, trim)
   */
  normalizeText(text) {
    if (typeof text !== "string") {
      throw new AppError("Input văn bản để tạo embedding phải là chuỗi ký tự hợp lệ", 400);
    }
    const cleaned = text
      .normalize("NFC")
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      throw new AppError("Nội dung văn bản không được để trống khi tạo embedding", 400);
    }

    return cleaned.length > MAX_INPUT_CHARS ? cleaned.slice(0, MAX_INPUT_CHARS) : cleaned;
  }

  /**
   * Compute deterministic SHA-256 content hash for change detection & caching
   */
  computeContentHash(text, modelName = "") {
    const normalized = typeof text === "string" ? text.normalize("NFC").replace(/\s+/g, " ").trim() : "";
    const canonicalModel = String(modelName || this.provider?.model || "default")
      .replace(/^(openai|openrouter|google|gemini)\//i, "")
      .toLowerCase()
      .trim();
    return crypto
      .createHash("sha256")
      .update(`${canonicalModel}::${normalized}`, "utf8")
      .digest("hex");
  }

  _recordLatency(ms) {
    this.metrics.lastLatencyMs = ms;
    this.metrics._latencySamples += 1;
    const n = this.metrics._latencySamples;
    this.metrics.avgLatencyMs = Number(
      (((this.metrics.avgLatencyMs * (n - 1)) + ms) / n).toFixed(2)
    );
  }

  _recordUsage(usage = {}, count = 1) {
    this.metrics.totalTextsEmbedded += count;
    this.metrics.totalTokens += Number(usage.totalTokens || usage.promptTokens || 0);
    this.metrics.totalCostUsd = Number(
      (this.metrics.totalCostUsd + Number(usage.costUsd || 0)).toFixed(8)
    );
  }

  _isRetryableError(error) {
    if (!error) return false;
    if (error.code === "ETIMEDOUT" || error.name === "AbortError") return true;
    const status = Number(error.status || 0);
    if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
    const msg = String(error.message || "").toLowerCase();
    return (
      msg.includes("timed out") ||
      msg.includes("timeout") ||
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("502") ||
      msg.includes("503") ||
      msg.includes("504") ||
      msg.includes("econnreset") ||
      msg.includes("fetch failed")
    );
  }

  async _executeWithRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const baseDelay = options.retryDelayMs ?? this.retryDelayMs;
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (attempt < maxRetries && this._isRetryableError(error)) {
          attempt++;
          this.metrics.retryCount++;
          const delay = baseDelay * Math.pow(2, attempt - 1);
          logger.warn("Embedding provider transient error, retrying...", {
            attempt,
            maxRetries,
            delayMs: delay,
            error: error.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        this.metrics.errorCount++;
        throw error;
      }
    }
  }

  /**
   * Embed a single text with caching, retry, and optional local fallback
   */
  async embedText(rawText, options = {}) {
    const normalized = this.normalizeText(rawText);
    const activeProvider = this.provider;
    const modelName = activeProvider.model || "default";
    const contentHash = this.computeContentHash(normalized, modelName);

    if (options.useCache !== false) {
      const cached = this.cache.get(contentHash);
      if (cached && cached.expiresAt > Date.now()) {
        this.metrics.cacheHits++;
        return {
          vector: cached.vector,
          model: cached.model,
          dimensions: cached.dimensions,
          contentHash,
          fromCache: true,
          usage: { promptTokens: 0, totalTokens: 0, costUsd: 0 },
        };
      }
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await this._executeWithRetry(
        () => activeProvider.embedText(normalized, options),
        options
      );
      const latencyMs = Date.now() - startTime;
      this._recordLatency(latencyMs);
      this._recordUsage(result.usage, 1);

      if (options.useCache !== false && Array.isArray(result.vector) && result.vector.length > 0) {
        if (this.cache.size >= QUERY_CACHE_MAX_SIZE) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }
        this.cache.set(contentHash, {
          vector: result.vector,
          model: result.model || modelName,
          dimensions: result.dimensions || result.vector.length,
          expiresAt: Date.now() + QUERY_CACHE_TTL_MS,
        });
      }

      return {
        vector: result.vector,
        model: result.model || modelName,
        dimensions: result.dimensions || result.vector.length,
        contentHash,
        fromCache: false,
        latencyMs,
        usage: result.usage || { promptTokens: 0, totalTokens: 0, costUsd: 0 },
      };
    } catch (error) {
      if (options.allowLocalFallback && activeProvider.providerName !== "local") {
        this.metrics.fallbackCount++;
        logger.warn("Embedding provider failed, using LocalEmbeddingProvider fallback", {
          error: error.message,
        });
        const localProvider = new LocalEmbeddingProvider({
          dimensions: activeProvider.dimensions || 1536,
        });
        const fallbackResult = await localProvider.embedText(normalized);
        return {
          vector: fallbackResult.vector,
          model: fallbackResult.model,
          dimensions: fallbackResult.dimensions,
          contentHash,
          fromCache: false,
          fallback: true,
          latencyMs: Date.now() - startTime,
          usage: fallbackResult.usage,
        };
      }
      throw error;
    }
  }

  /**
   * Batch embed multiple items with deduplication, chunking, and per-item fault isolation.
   * Each item can be a string or `{ id, text, existingHash, existingVector }`.
   */
  async embedBatch(items, options = {}) {
    if (!Array.isArray(items)) {
      throw new AppError("Danh sách đầu vào embedBatch phải là một mảng", 400);
    }
    if (items.length === 0) {
      return {
        results: [],
        summary: {
          total: 0,
          embedded: 0,
          reused: 0,
          failed: 0,
          totalTokens: 0,
          totalCostUsd: 0,
          latencyMs: 0,
        },
      };
    }

    const startTime = Date.now();
    this.metrics.totalBatchRequests++;
    const activeProvider = this.provider;
    const modelName = activeProvider.model || "default";

    const results = new Array(items.length);
    const pendingIndices = [];
    const pendingTexts = [];
    const pendingHashes = [];

    let reusedCount = 0;
    let failedCount = 0;
    let embeddedCount = 0;
    let batchTokens = 0;
    let batchCostUsd = 0;

    // 1. Validate & check unchanged hashes / cache first
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawText = typeof item === "string" ? item : item?.text;
      const itemId = typeof item === "object" && item !== null ? item.id : String(i);

      try {
        const normalized = this.normalizeText(rawText);
        const contentHash = this.computeContentHash(normalized, modelName);

        // Reuse existing embedding if contentHash matches and vector is valid
        if (
          typeof item === "object" &&
          item !== null &&
          item.existingHash &&
          item.existingHash === contentHash &&
          Array.isArray(item.existingVector) &&
          item.existingVector.length > 0 &&
          !options.force
        ) {
          reusedCount++;
          results[i] = {
            id: itemId,
            status: "reused",
            vector: item.existingVector,
            model: item.existingModel || modelName,
            dimensions: item.existingVector.length,
            contentHash,
          };
          continue;
        }

        // Check in-memory cache
        const cached = options.useCache !== false ? this.cache.get(contentHash) : null;
        if (cached && cached.expiresAt > Date.now() && !options.force) {
          this.metrics.cacheHits++;
          reusedCount++;
          results[i] = {
            id: itemId,
            status: "reused",
            vector: cached.vector,
            model: cached.model,
            dimensions: cached.dimensions,
            contentHash,
          };
          continue;
        }

        pendingIndices.push(i);
        pendingTexts.push(normalized);
        pendingHashes.push(contentHash);
      } catch (validationErr) {
        failedCount++;
        results[i] = {
          id: itemId,
          status: "failed",
          error: validationErr.message,
        };
      }
    }

    // 2. Process pending items in chunks of batchSize
    const chunkSize = Math.max(1, Number(options.batchSize || this.batchSize));
    for (let offset = 0; offset < pendingIndices.length; offset += chunkSize) {
      const chunkIndices = pendingIndices.slice(offset, offset + chunkSize);
      const chunkTexts = pendingTexts.slice(offset, offset + chunkSize);
      const chunkHashes = pendingHashes.slice(offset, offset + chunkSize);

      try {
        const batchRes = await this._executeWithRetry(
          () => activeProvider.embedBatch(chunkTexts, options),
          options
        );

        this._recordUsage(batchRes.usage, chunkTexts.length);
        batchTokens += batchRes.usage?.totalTokens || 0;
        batchCostUsd += batchRes.usage?.costUsd || 0;

        for (let j = 0; j < chunkIndices.length; j++) {
          const origIdx = chunkIndices[j];
          const item = items[origIdx];
          const itemId = typeof item === "object" && item !== null ? item.id : String(origIdx);
          const vector = batchRes.vectors?.[j];

          if (Array.isArray(vector) && vector.length > 0) {
            embeddedCount++;
            results[origIdx] = {
              id: itemId,
              status: "embedded",
              vector,
              model: batchRes.model || modelName,
              dimensions: vector.length,
              contentHash: chunkHashes[j],
            };
          } else {
            failedCount++;
            results[origIdx] = {
              id: itemId,
              status: "failed",
              error: "Provider returned empty vector for item",
            };
          }
        }
      } catch (chunkError) {
        // Isolate errors per record by falling back to individual embedText calls
        logger.warn("Batch chunk failed, falling back to per-record embedding to isolate failure", {
          chunkSize: chunkIndices.length,
          error: chunkError.message,
        });

        for (let j = 0; j < chunkIndices.length; j++) {
          const origIdx = chunkIndices[j];
          const item = items[origIdx];
          const itemId = typeof item === "object" && item !== null ? item.id : String(origIdx);

          try {
            const singleRes = await this.embedText(chunkTexts[j], {
              ...options,
              maxRetries: 1,
            });
            embeddedCount++;
            batchTokens += singleRes.usage?.totalTokens || 0;
            batchCostUsd += singleRes.usage?.costUsd || 0;
            results[origIdx] = {
              id: itemId,
              status: "embedded",
              vector: singleRes.vector,
              model: singleRes.model,
              dimensions: singleRes.dimensions,
              contentHash: chunkHashes[j],
              fallback: Boolean(singleRes.fallback),
            };
          } catch (singleErr) {
            failedCount++;
            results[origIdx] = {
              id: itemId,
              status: "failed",
              error: singleErr.message,
            };
          }
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    this._recordLatency(latencyMs);

    return {
      results,
      summary: {
        total: items.length,
        embedded: embeddedCount,
        reused: reusedCount,
        failed: failedCount,
        totalTokens: batchTokens,
        totalCostUsd: Number(batchCostUsd.toFixed(8)),
        latencyMs,
      },
    };
  }

  getMetrics() {
    const activeProvider = this.provider;
    return {
      provider: activeProvider.providerName || activeProvider.constructor?.name || "unknown",
      model: activeProvider.model,
      dimensions: activeProvider.dimensions,
      cacheSize: this.cache.size,
      ...this.metrics,
    };
  }
}

const embeddingService = new EmbeddingService();
export default embeddingService;
