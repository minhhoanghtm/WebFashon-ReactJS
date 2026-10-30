import { Queue } from "bullmq";
import { getRedisConnection } from "../configs/redis.js";

let trackingQueue = null;

export const getTrackingQueue = () => {
  if (!trackingQueue) {
    const connection = getRedisConnection();
    trackingQueue = new Queue("trackingQueue", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return trackingQueue;
};

export const addTrackingJob = async (eventData) => {
  const queue = getTrackingQueue();
  const jobId = eventData.event_id || undefined;
  return await queue.add("processUserEvent", eventData, {
    jobId,
  });
};
