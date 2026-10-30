import { EmbeddingProvider } from "./EmbeddingProvider.js";

const DEFAULT_COST_PER_TOKEN = 2e-8; // $0.02 / 1M tokens for text-embedding-3-small

export class OpenAIEmbeddingProvider extends EmbeddingProvider {
  constructor({
    apiKey = process.env.OPENAI_API_KEY,
    model = process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    dimensions = Number(process.env.EMBEDDING_DIMENSIONS) || 1536,
    timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_MS) || 15000,
  } = {}) {
    // Strip "openai/" prefix if configured for OpenRouter compatibility
    const normalizedModel = model.replace(/^openai\//i, "");
    super({ model: normalizedModel, dimensions, timeoutMs });
    this.apiKey = apiKey;
    this.providerName = "openai";
  }

  async embedBatch(texts, options = {}) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAIEmbeddingProvider");
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
      const body = {
        model: this.model,
        input: texts,
      };
      if (this.dimensions && this.model.includes("text-embedding-3")) {
        body.dimensions = this.dimensions;
      }

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const err = new Error(`OpenAI Embeddings failed: ${response.status} - ${errorText}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const sorted = [...(data.data || [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const vectors = sorted.map((item) => item.embedding);
      const actualDim = vectors[0]?.length || this.dimensions;

      const promptTokens = data.usage?.prompt_tokens || 0;
      const totalTokens = data.usage?.total_tokens || promptTokens;
      const costUsd = totalTokens * DEFAULT_COST_PER_TOKEN;

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
        const timeoutErr = new Error(`OpenAI Embedding request timed out after ${timeout}ms`);
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
