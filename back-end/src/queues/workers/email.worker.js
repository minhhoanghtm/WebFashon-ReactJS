import { Worker } from "bullmq";
import { getRedisConnection } from "../../configs/redis.js";
import { sendOTP } from "../../providers/email.provider.js";

const connection = getRedisConnection();

export const initEmailWorker = () => {
  const worker = new Worker(
    "emailQueue",
    async (job) => {
      console.log(`[Queue Worker] Processing job ${job.id} of name ${job.name}`);
      if (job.name === "sendOTPEmail") {
        const { email, otp } = job.data;
        await sendOTP(email, otp);
      }
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`[Queue Worker] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Queue Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return worker;
};
