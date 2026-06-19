import { AIProvider } from "./AIProvider.js";

export class OpenRouterProvider extends AIProvider {
  constructor({
    apiKey = process.env.OPENROUTER_API_KEY,
    model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat({ messages, tools }) {
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY is required");

    const body = {
      model: this.model,
      messages,
      temperature: 0.3,
      max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS) || 1000,
    };
    if(tools?.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "WebFashion",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    // AI muốn gọi tools (Chỉ hỗ trợ 1 tool mỗi lần)
    if(message?.tool_calls?.length > 0) {
      return {
        toolCalls: message.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments),
        }))
      }
    }
    return {
      content: message?.content || "",
      raw: data,
    };
  }
}
