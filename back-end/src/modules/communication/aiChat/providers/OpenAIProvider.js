import { AIProvider } from "./AIProvider.js";

    console.log("PROVIDER =", process.env.AI_PROVIDER);
export class OpenAIProvider extends AIProvider {
  constructor({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-4o-mini" } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat({ messages }) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      raw: data,
    };
  }
}
