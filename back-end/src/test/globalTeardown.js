import mongoose from "mongoose";
import { closeRedisConnection } from "../configs/redis.js";

export default async function globalTeardown() {
  await Promise.allSettled([
    closeRedisConnection(),
    mongoose.disconnect(),
  ]);
}
