import { EmbeddingProvider } from "./EmbeddingProvider.js";

// Default cost per 1M tokens for text-embedding-3-small is $0.02 ($2e-8 per token)
const DEFAULT_COST_PER_TOKEN = 2e-8;

export class OpenRouterEmbeddingProvider extends EmbeddingProvider {
  constructor({
    apiKey = process.env.OPENROUTER_API_KEY,
    model = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small",
    dimensions = Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
    timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_MS) || 15000,
  } = {}) {
    super({ model, dimensions, timeoutMs });
    this.apiKey = apiKey;
    this.providerName = "openrouter";
  }

  async embedBatch(texts, options = {}) {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required for OpenRouterEmbeddingProvider");
    }
    if (!Array.isArray(texts) || texts.length === 0) {
      return {
        vectors: [],
        model: this.model,
        dimensions: this.dimensions,
        usage: { promptTokens: 0, totalTokens: 0, costUsd: 0 },
      };
    }

    const timeout = options.timeoutMs || this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-Title": "WebFashion",
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const err = new Error(`OpenRouter Embeddings failed: ${response.status} - ${errorText}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error("Invalid embedding response format from OpenRouter");
      }

      const sorted = [...data.data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const vectors = sorted.map((item) => item.embedding);
      const actualDim = vectors[0]?.length || this.dimensions;

      const promptTokens = data.usage?.prompt_tokens || 0;
      const totalTokens = data.usage?.total_tokens || promptTokens;
      const costUsd =
        typeof data.usage?.cost === "number"
          ? data.usage.cost
          : totalTokens * DEFAULT_COST_PER_TOKEN;

      return {
        vectors,
        model: data.model || this.model,
        dimensions: actualDim,
        usage: {
          promptTokens,
          totalTokens,
          costUsd,
        },
      };
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutErr = new Error(`OpenRouter Embedding request timed out after ${timeout}ms`);
        timeoutErr.code = "ETIMEDOUT";
        throw timeoutErr;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async embedText(text, options = {}) {
    const batchResult = await this.embedBatch([text], options);
    return {
      vector: batchResult.vectors[0] || [],
      model: batchResult.model,
      dimensions: batchResult.dimensions,
      usage: batchResult.usage,
    };
  }
}
