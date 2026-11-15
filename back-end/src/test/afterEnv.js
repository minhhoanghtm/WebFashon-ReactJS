import { afterAll } from "@jest/globals";
import mongoose from "mongoose";
import { closeRedisConnection } from "../configs/redis.js";

// Each ESM Jest suite has its own module registry.  Clean resources in that
// registry rather than relying only on globalTeardown's separate registry.
afterAll(async () => {
  await Promise.allSettled([closeRedisConnection(), mongoose.disconnect()]);
});
