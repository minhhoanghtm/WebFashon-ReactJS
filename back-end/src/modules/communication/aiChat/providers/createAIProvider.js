import { OpenAIProvider } from "./OpenAIProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { DeepSeekProvider } from "./DeepSeekProvider.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";

export const createAIProvider = () => {
  const provider = (
    process.env.AI_PROVIDER ||
    (process.env.OPENROUTER_API_KEY ? "openrouter" : "openai")
  ).toLowerCase();

  if (provider === "openai") return new OpenAIProvider();
  if (provider === "gemini") return new GeminiProvider();
  if (provider === "deepseek") return new DeepSeekProvider();
  if (provider === "openrouter") return new OpenRouterProvider();

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
};
