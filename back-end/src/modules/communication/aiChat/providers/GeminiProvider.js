import { AIProvider } from "./AIProvider.js";

export class GeminiProvider extends AIProvider {
  constructor({ apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || "gemini-1.5-flash", maxTokens = Number(process.env.AI_CHAT_MAX_TOKENS) || 800 } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async chat({ messages }) {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is required");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: { maxOutputTokens: this.maxTokens },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      },
      raw: data,
    };
  }
}
