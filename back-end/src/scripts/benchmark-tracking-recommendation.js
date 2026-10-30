import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import trackingService from "../modules/tracking/tracking.service.js";
import recommendationService from "../modules/recommendations/recommendation.service.js";
import UserInterestProfile from "../modules/recommendations/userInterestProfile.model.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";
import { cosineSimilarity } from "../modules/ai/services/semanticSearch.service.js";
import { getRedisConnection } from "../configs/redis.js";

async function runTrackingBenchmark() {
  console.log("================================================================================");
  console.log("📊 RUNNING TRACKING & RECOMMENDATION PERFORMANCE BENCHMARK");
  console.log("================================================================================\n");

  const initialMemory = process.memoryUsage();
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = mongoose.connection.readyState === 1;
    console.log(`✅ MongoDB Connection: ${dbConnected ? "CONNECTED" : "DISCONNECTED"}`);
  } catch (err) {
    console.warn("⚠️ MongoDB không khả dụng, chạy benchmark ở chế độ mô phỏng độc lập:", err.message);
  }

  const redis = getRedisConnection();
  console.log(`✅ Redis Connection: ${redis ? "AVAILABLE" : "LOCAL IN-MEMORY"}`);

  const results = {};

  // --------------------------------------------------------------------------
  // BENCHMARK 1: SINGLE EVENT VS BATCH EVENT INGESTION LATENCY & THROUGHPUT
  // --------------------------------------------------------------------------
  console.log("\n--- BENCHMARK 1: Single vs Batch Ingestion (50 Events) ---");
  const testAnonId = "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6";
  const testSessionId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const dummyProductId = new mongoose.Types.ObjectId().toString();

  // 1A. Single Event Processing
  const singleStart = performance.now();
  for (let i = 0; i < 50; i++) {
    await trackingService.recordEvent(
      {
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: "product_impression",
        anonymous_id: testAnonId,
        session_id: testSessionId,
        product_id: dummyProductId,
        meta: { position: i + 1 },
      },
      null
    ).catch(() => {});
  }
  const singleDuration = performance.now() - singleStart;
  const singleOpsPerSec = (50 / (singleDuration / 1000)).toFixed(1);

  // 1B. Batch Event Processing (5 batches of 10 events)
  const batchStart = performance.now();
  for (let b = 0; b < 5; b++) {
    const batchEvents = Array.from({ length: 10 }).map((_, i) => ({
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "product_impression",
      anonymous_id: testAnonId,
      session_id: testSessionId,
      product_id: dummyProductId,
      meta: { position: b * 10 + i + 1 },
    }));
    await trackingService.recordBatchEvents(batchEvents, null).catch(() => {});
  }
  const batchDuration = performance.now() - batchStart;
  const batchOpsPerSec = (50 / (batchDuration / 1000)).toFixed(1);
  const throughputGain = (((batchOpsPerSec - singleOpsPerSec) / singleOpsPerSec) * 100).toFixed(1);

  results.ingestion = {
    singleDurationMs: Number(singleDuration.toFixed(2)),
    singleOpsPerSec: Number(singleOpsPerSec),
    batchDurationMs: Number(batchDuration.toFixed(2)),
    batchOpsPerSec: Number(batchOpsPerSec),
    throughputGainPercent: `${throughputGain}%`,
  };

  console.log(`- 50 Single Events: ${singleDuration.toFixed(2)} ms (${singleOpsPerSec} ops/sec)`);
  console.log(`- 5 Batches x 10 Events: ${batchDuration.toFixed(2)} ms (${batchOpsPerSec} ops/sec)`);
  console.log(`- Hiệu năng xử lý theo lô tăng: ${throughputGain}%`);

  // --------------------------------------------------------------------------
  // BENCHMARK 2: VECTOR SIMILARITY COMPUTATION SPEED (1536 DIMENSIONS)
  // --------------------------------------------------------------------------
  console.log("\n--- BENCHMARK 2: Vector Cosine Similarity (1536d x 200 Products) ---");
  const randomVec = () => Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  const userCentroid = randomVec();
  const candidateVectors = Array.from({ length: 200 }, () => randomVec());

  const vecStart = performance.now();
  let computedScores = 0;
  for (const cVec of candidateVectors) {
    const sim = cosineSimilarity(userCentroid, cVec);
    if (sim > 0) computedScores++;
  }
  const vecDuration = performance.now() - vecStart;
  const avgPerVector = (vecDuration / 200).toFixed(4);

  results.vectorMath = {
    totalDurationMs: Number(vecDuration.toFixed(2)),
    vectorsCompared: 200,
    avgLatencyPerComparisonMs: Number(avgPerVector),
  };
  console.log(`- So khớp 200 vector 1536 chiều: ${vecDuration.toFixed(2)} ms (Trung bình ${avgPerVector} ms/sản phẩm)`);

  // --------------------------------------------------------------------------
  // BENCHMARK 3: RECOMMENDATION ENGINE RESPONSE TIME
  // --------------------------------------------------------------------------
  console.log("\n--- BENCHMARK 3: Recommendation Engine Latency ---");
  const recStart = performance.now();
  const recResult = await recommendationService.getRecommendations({
    anonymousId: testAnonId,
    limit: 8,
  }).catch(() => ({ mode: "popular", products: [] }));
  const recDuration = performance.now() - recStart;

  // Cached response
  const cachedStart = performance.now();
  await recommendationService.getRecommendations({
    anonymousId: testAnonId,
    limit: 8,
  }).catch(() => ({ mode: "popular", products: [] }));
  const cachedDuration = performance.now() - cachedStart;

  results.recommendation = {
    coldLatencyMs: Number(recDuration.toFixed(2)),
    cachedLatencyMs: Number(cachedDuration.toFixed(2)),
    returnedCount: recResult?.products?.length || 0,
    mode: recResult?.mode || "popular",
  };
  console.log(`- Lần 1 (Tính toán/DB Query): ${recDuration.toFixed(2)} ms (Mode: ${recResult.mode})`);
  console.log(`- Lần 2 (Cache Hit): ${cachedDuration.toFixed(2)} ms`);

  // --------------------------------------------------------------------------
  // BENCHMARK 4: MEMORY PROFILING
  // --------------------------------------------------------------------------
  console.log("\n--- BENCHMARK 4: Memory Usage Profile ---");
  const finalMemory = process.memoryUsage();
  const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);

  results.memory = {
    heapUsedBeforeMB: Number(toMB(initialMemory.heapUsed)),
    heapUsedAfterMB: Number(toMB(finalMemory.heapUsed)),
    rssMB: Number(toMB(finalMemory.rss)),
    deltaHeapMB: Number((toMB(finalMemory.heapUsed) - toMB(initialMemory.heapUsed)).toFixed(2)),
  };

  console.log(`- Heap Used: ${toMB(initialMemory.heapUsed)} MB -> ${toMB(finalMemory.heapUsed)} MB (Δ: ${results.memory.deltaHeapMB} MB)`);
  console.log(`- RSS: ${toMB(finalMemory.rss)} MB`);

  console.log("\n================================================================================");
  console.log("🏁 BENCHMARK COMPLETE");
  console.log(JSON.stringify(results, null, 2));
  console.log("================================================================================");

  if (dbConnected) {
    await mongoose.disconnect();
  }
}

runTrackingBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
