export class EmbeddingProvider {
  constructor({ model = "text-embedding-3-small", dimensions = 1536, timeoutMs = 15000 } = {}) {
    this.model = model;
    this.dimensions = Number(dimensions) || 1536;
    this.timeoutMs = Number(timeoutMs) || 15000;
  }

  /**
   * Convert a single text string into an embedding vector
   * @param {string} _text
   * @param {object} _options
   * @returns {Promise<{ vector: number[], model: string, dimensions: number, usage: { promptTokens: number, totalTokens: number, costUsd: number } }>}
   */
  async embedText(_text, _options = {}) {
    throw new Error("EmbeddingProvider.embedText must be implemented");
  }

  /**
   * Convert an array of text strings into embedding vectors
   * @param {string[]} texts
   * @param {object} options
   * @returns {Promise<{ vectors: number[][], model: string, dimensions: number, usage: { promptTokens: number, totalTokens: number, costUsd: number } }>}
   */
  async embedBatch(texts, options = {}) {
    const vectors = [];
    let promptTokens = 0;
    let totalTokens = 0;
    let costUsd = 0;

    for (const text of texts) {
      const res = await this.embedText(text, options);
      vectors.push(res.vector);
      promptTokens += res.usage?.promptTokens || 0;
      totalTokens += res.usage?.totalTokens || 0;
      costUsd += res.usage?.costUsd || 0;
    }

    return {
      vectors,
      model: this.model,
      dimensions: this.dimensions,
      usage: { promptTokens, totalTokens, costUsd },
    };
  }
}
