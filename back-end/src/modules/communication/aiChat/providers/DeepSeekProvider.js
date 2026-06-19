import { OpenAIProvider } from "./OpenAIProvider.js";

export class DeepSeekProvider extends OpenAIProvider {
  constructor({ apiKey = process.env.DEEPSEEK_API_KEY, model = process.env.DEEPSEEK_MODEL || "deepseek-chat" } = {}) {
    super({ apiKey, model });
  }

  async chat({ messages }) {
    if (!this.apiKey) throw new Error("DEEPSEEK_API_KEY is required");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      raw: data,
    };
  }
}
