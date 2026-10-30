import { EmbeddingProvider } from "./EmbeddingProvider.js";

export class GeminiEmbeddingProvider extends EmbeddingProvider {
  constructor({
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
    dimensions = Number(process.env.EMBEDDING_DIMENSIONS) || 768,
    timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_MS) || 15000,
  } = {}) {
    super({ model, dimensions, timeoutMs });
    this.apiKey = apiKey;
    this.providerName = "gemini";
  }

  async embedText(text, options = {}) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required for GeminiEmbeddingProvider");
    }

    const timeout = options.timeoutMs || this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${this.model}`,
            content: { parts: [{ text: String(text || "") }] },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const err = new Error(`Gemini Embedding failed: ${response.status} - ${errorText}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const vector = data?.embedding?.values || [];
      const estTokens = Math.max(1, Math.ceil(String(text || "").length / 4));

      return {
        vector,
        model: this.model,
        dimensions: vector.length || this.dimensions,
        usage: {
          promptTokens: estTokens,
          totalTokens: estTokens,
          costUsd: 0,
        },
      };
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutErr = new Error(`Gemini Embedding request timed out after ${timeout}ms`);
        timeoutErr.code = "ETIMEDOUT";
        throw timeoutErr;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
