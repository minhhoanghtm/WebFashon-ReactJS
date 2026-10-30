import { OpenRouterEmbeddingProvider } from "./OpenRouterEmbeddingProvider.js";
import { OpenAIEmbeddingProvider } from "./OpenAIEmbeddingProvider.js";
import { GeminiEmbeddingProvider } from "./GeminiEmbeddingProvider.js";
import { LocalEmbeddingProvider } from "./LocalEmbeddingProvider.js";

export const createEmbeddingProvider = (customConfig = {}) => {
  const configuredProvider = (
    customConfig.provider ||
    process.env.EMBEDDING_PROVIDER ||
    (process.env.OPENROUTER_API_KEY
      ? "openrouter"
      : process.env.OPENAI_API_KEY
      ? "openai"
      : process.env.GEMINI_API_KEY
      ? "gemini"
      : "local")
  ).toLowerCase();

  if (configuredProvider === "openrouter") {
    return new OpenRouterEmbeddingProvider(customConfig);
  }
  if (configuredProvider === "openai") {
    return new OpenAIEmbeddingProvider(customConfig);
  }
  if (configuredProvider === "gemini") {
    return new GeminiEmbeddingProvider(customConfig);
  }
  if (configuredProvider === "local") {
    return new LocalEmbeddingProvider(customConfig);
  }

  throw new Error(`Unsupported EMBEDDING_PROVIDER: ${configuredProvider}`);
};
