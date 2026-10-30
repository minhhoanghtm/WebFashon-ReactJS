import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../configs/db.js";
import vectorIndexService from "../modules/ai/services/vectorIndex.service.js";
import embeddingService from "../modules/ai/services/embedding.service.js";

const runSync = async () => {
  try {
    const force = process.argv.includes("--force");
    console.log("🚀 Starting Vector AI Initial / Incremental Synchronization...");
    await connectDB();

    const summary = await vectorIndexService.syncAll({
      types: ["product", "page", "voucher", "settings"],
      force,
      batchSize: 25,
      allowLocalFallback: true,
    });

    const stats = await vectorIndexService.getIndexStats();
    console.log("✅ Vector Sync Summary:", JSON.stringify(summary, null, 2));
    console.log("📊 Vector Index Stats:", JSON.stringify({
      totalVectors: stats.totalVectors,
      activeVectors: stats.activeVectors,
      byType: stats.byType,
      models: stats.models,
    }, null, 2));
    console.log("📈 Embedding Metrics:", JSON.stringify(embeddingService.getMetrics(), null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Vector synchronization failed:", error);
    process.exit(1);
  }
};

runSync();
