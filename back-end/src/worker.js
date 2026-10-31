import "dotenv/config";
import { connectDB } from "./configs/db.js";
import { initEmailWorker } from "./queues/workers/email.worker.js";
import { initTrackingWorker } from "./queues/workers/tracking.worker.js";
import { initVectorSyncWorker } from "./modules/ai/queues/vectorSync.queue.js";

const startWorker = async () => {
  try {
    console.log("👷 Bootstrapping Staging Background Workers...");
    await connectDB();
    console.log("✅ MongoDB connected for Worker process.");

    const emailWorker = initEmailWorker();
    const trackingWorker = initTrackingWorker();
    const vectorWorker = initVectorSyncWorker();
    console.log("🚀 Staging BullMQ Tracking Worker, Email Worker, and Vector Sync Worker are ACTIVE and polling.");

    const shutdown = async (signal) => {
      console.log(`Received ${signal}, gracefully shutting down background workers...`);
      await Promise.allSettled([
        emailWorker?.close?.(),
        trackingWorker?.close?.(),
        vectorWorker?.close?.(),
      ]);
      console.log("All background workers closed safely.");
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Worker bootstrap failed:", error);
    process.exit(1);
  }
};

startWorker();
