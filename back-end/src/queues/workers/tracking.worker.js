import { Worker } from "bullmq";
import { getRedisConnection } from "../../configs/redis.js";
import trackingService from "../../modules/tracking/tracking.service.js";

export const initTrackingWorker = () => {
  const connection = getRedisConnection();

  const worker = new Worker(
    "trackingQueue",
    async (job) => {
      if (job.name === "processUserEvent") {
        await trackingService.processEvent(job.data);
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("completed", (job) => {
    // Job completed
  });

  worker.on("failed", (job, err) => {
    console.error(`[Tracking Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
};
