import { describe, expect, test } from "@jest/globals";
import express from "express";
import request from "supertest";
import { createAiChatDailyQuota, createAiChatLimiter } from "../rateLimiter.middleware.js";
import { validateAiChatMessageDto } from "../../modules/communication/validators/communication.validator.js";

const invoke = async (middleware, req) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const next = () => { res.nextCalled = true; };
  await middleware(req, res, next);
  return res;
};

describe("AI chat daily quota", () => {
  test("blocks a user after their Redis-backed daily quota", async () => {
    let count = 0;
    const redis = { incr: async () => ++count, expire: async () => 1 };
    const quota = createAiChatDailyQuota({ redisProvider: () => redis, quota: 2 });

    expect((await invoke(quota, { user: { userId: "user-1" }, ip: "127.0.0.1" })).nextCalled).toBe(true);
    expect((await invoke(quota, { user: { userId: "user-1" }, ip: "127.0.0.1" })).nextCalled).toBe(true);
    const blocked = await invoke(quota, { user: { userId: "user-1" }, ip: "127.0.0.1" });

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toEqual(expect.objectContaining({ code: "AI_CHAT_DAILY_QUOTA_EXCEEDED" }));
  });

  test("uses the guest IP as the quota identity", async () => {
    const keys = [];
    const redis = { incr: async (key) => { keys.push(key); return 1; }, expire: async () => 1 };
    const quota = createAiChatDailyQuota({ redisProvider: () => redis, quota: 1 });

    const result = await invoke(quota, { ip: "203.0.113.42" });

    expect(result.nextCalled).toBe(true);
    expect(keys).toEqual(["rate-limit:ai-chat:daily:ip:203.0.113.42"]);
  });
});

test("blocks requests above the per-minute limit", async () => {
  const app = express();
  app.post("/chat/ai/send", createAiChatLimiter({ max: 2 }), (_req, res) => res.sendStatus(204));

  await request(app).post("/chat/ai/send").expect(204);
  await request(app).post("/chat/ai/send").expect(204);
  const blocked = await request(app).post("/chat/ai/send").expect(429);

  expect(blocked.body).toEqual(expect.objectContaining({
    message: "Bạn đã gửi quá nhiều tin nhắn cho AI. Vui lòng thử lại sau 1 phút.",
  }));
});

test("rejects AI messages longer than 2,000 characters", () => {
  expect(() => validateAiChatMessageDto({ content: "a".repeat(2001) })).toThrow("at most 2000");
});
