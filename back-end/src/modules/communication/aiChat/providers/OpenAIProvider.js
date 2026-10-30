import { AIProvider } from "./AIProvider.js";

export class OpenAIProvider extends AIProvider {
  constructor({
    apiKey = process.env.OPENAI_API_KEY,
    model = process.env.OPENAI_MODEL || "gpt-4o-mini",
    timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS) || 25000,
  } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async chat({ messages, tools }) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required");

    const body = {
      model: this.model,
      messages,
      temperature: 0.25,
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${response.status}`);
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
        throw new Error(`OpenAI chat timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
