import { AIProvider } from "./AIProvider.js";

export class OpenRouterProvider extends AIProvider {
  constructor({
    apiKey = process.env.OPENROUTER_API_KEY,
    model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
    timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS) || 25000,
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async chat({ messages, tools }) {
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY is required");

    const body = {
      model: this.model,
      messages,
      temperature: 0.25,
      max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS) || 1000,
    };

    if (tools?.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-Title": "WebFashion",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`OpenRouter request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;

      if (message?.tool_calls?.length > 0) {
        return {
          toolCalls: message.tool_calls.map((tc) => {
            let parsedArgs = {};
            try {
              parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
            } catch {
              parsedArgs = {};
            }
            return {
              id: tc.id,
              type: "function",
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments || "{}",
              },
              name: tc.function.name,
              args: parsedArgs,
            };
          }),
          usage: data.usage || {},
        };
      }

      return {
        content: message?.content || "",
        usage: data.usage || {},
        raw: data,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`OpenRouter chat timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
