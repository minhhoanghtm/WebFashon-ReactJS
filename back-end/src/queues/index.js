import { Queue } from "bullmq";
import { getRedisConnection } from "../configs/redis.js";

const connection = getRedisConnection();

export const emailQueue = new Queue("emailQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const addEmailJob = async (email, otp) => {
  await emailQueue.add("sendOTPEmail", { email, otp });
};
