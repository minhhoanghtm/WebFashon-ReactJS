import { describe, expect, test } from "@jest/globals";
import { createAiTokenBudget } from "../aiTokenBudget.service.js";

describe("AI daily token budget", () => {
  test("blocks a user once their Redis daily budget is exhausted", async () => {
    let used = 0;
    const redis = {
      get: async () => String(used),
      incrby: async (_key, tokens) => { used += tokens; return used; },
      expire: async () => 1,
    };
    const budget = createAiTokenBudget({
      redisProvider: () => redis,
      dailyBudget: 100,
      now: () => new Date("2026-11-07T12:00:00.000Z"),
    });

    await budget.assertAvailable("user-1");
    await budget.consume("user-1", 100);

    await expect(budget.assertAvailable("user-1")).rejects.toMatchObject({
      statusCode: 429,
      details: "AI_DAILY_TOKEN_BUDGET_EXCEEDED",
    });
  });
});
