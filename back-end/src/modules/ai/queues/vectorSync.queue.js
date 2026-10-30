import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../../../configs/redis.js";
import vectorIndexService from "../services/vectorIndex.service.js";
import logger from "../../../common/logger.js";

let vectorSyncQueue = null;
let vectorSyncWorker = null;

export const getVectorSyncQueue = () => {
  if (process.env.NODE_ENV === "test") return null;
  if (!vectorSyncQueue) {
    try {
      const connection = getRedisConnection();
      if (!connection || (connection.status !== "ready" && connection.status !== "connect")) {
        return null;
      }
      vectorSyncQueue = new Queue("vectorSyncQueue", {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1500,
          },
          removeOnComplete: 500,
          removeOnFail: 1000,
        },
      });
    } catch (err) {
      logger.warn("[VectorSyncQueue] Failed to initialize BullMQ queue:", err.message);
      return null;
    }
  }
  return vectorSyncQueue;
};

export const processVectorSyncJob = async (jobData = {}) => {
  const { action, sourceType, sourceId, options = {} } = jobData;

  if (action === "remove") {
    return await vectorIndexService.removeVector(sourceType, sourceId);
  }
  if (action === "sync_all") {
    return await vectorIndexService.syncAll(options);
  }
  if (sourceType === "product" && sourceId) {
    return await vectorIndexService.syncProductById(sourceId, options);
  }
  if (sourceType === "page" && sourceId) {
    return await vectorIndexService.syncPageById(sourceId, options);
  }
  return null;
};

export const initVectorSyncWorker = () => {
  if (process.env.NODE_ENV === "test" || vectorSyncWorker) return vectorSyncWorker;

  try {
    const connection = getRedisConnection();
    if (!connection) return null;

    vectorSyncWorker = new Worker(
      "vectorSyncQueue",
      async (job) => {
        return await processVectorSyncJob(job.data);
      },
      { connection, concurrency: 2 }
    );

    vectorSyncWorker.on("failed", (job, err) => {
      logger.warn(`[VectorSync Worker] Job ${job?.id} failed: ${err.message}`);
    });

    return vectorSyncWorker;
  } catch (err) {
    logger.warn("[VectorSync Worker] Could not initialize worker:", err.message);
    return null;
  }
};

/**
 * Non-blocking helper to trigger background vector synchronization after CRUD operations.
 * Uses BullMQ if Redis is ready; otherwise schedules non-blocking background execution.
 */
export const enqueueVectorSyncJob = (jobData = {}) => {
  if (process.env.NODE_ENV === "test" && process.env.ENABLE_VECTOR_SYNC_IN_TEST !== "true") {
    return Promise.resolve({ queued: false, skippedInTest: true });
  }

  const queue = getVectorSyncQueue();
  const dedupJobId =
    jobData.sourceType && jobData.sourceId
      ? `${jobData.action || "sync"}_${jobData.sourceType}_${jobData.sourceId}`
      : undefined;

  if (queue) {
    return queue
      .add(jobData.action || "syncEntity", jobData, { jobId: dedupJobId })
      .then((job) => ({ queued: true, mode: "bullmq", jobId: job.id }))
      .catch((err) => {
        logger.warn("[VectorSync] Queue add failed, running async fallback:", err.message);
        setImmediate(() => {
          processVectorSyncJob(jobData).catch((e) =>
            logger.warn("[VectorSync] Async fallback failed:", e.message)
          );
        });
        return { queued: true, mode: "async_fallback" };
      });
  }

  // Non-blocking setImmediate fallback when Redis queue is not active
  setImmediate(() => {
    processVectorSyncJob(jobData).catch((err) =>
      logger.warn("[VectorSync] Background sync failed:", err.message)
    );
  });

  return Promise.resolve({ queued: true, mode: "async_immediate" });
};

export const triggerProductVectorSync = (productId) =>
  enqueueVectorSyncJob({ action: "sync", sourceType: "product", sourceId: String(productId) });

export const triggerProductVectorRemove = (productId) =>
  enqueueVectorSyncJob({ action: "remove", sourceType: "product", sourceId: String(productId) });

export const triggerPageVectorSync = (pageId) =>
  enqueueVectorSyncJob({ action: "sync", sourceType: "page", sourceId: String(pageId) });

export const triggerPageVectorRemove = (pageId) =>
  enqueueVectorSyncJob({ action: "remove", sourceType: "page", sourceId: String(pageId) });
