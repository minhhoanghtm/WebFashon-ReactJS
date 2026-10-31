import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const STAGING_MONGO_URI = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";
const STAGING_REDIS_URL = "redis://127.0.0.1:6381";

process.env.REDIS_URL = STAGING_REDIS_URL;
process.env.REDIS_PORT = "6381";
process.env.MONGO_CONNECTIONSTRING = STAGING_MONGO_URI;

const { default: Experiment } = await import("../modules/recommendations/experiments/experiment.model.js");
const { default: experimentService, AA_EXPERIMENT_ID } = await import("../modules/recommendations/experiments/experiment.service.js");
const { default: semanticSearchService } = await import("../modules/ai/services/semanticSearch.service.js");
const { default: ragService } = await import("../modules/ai/services/rag.service.js");

async function verifyStaging() {
  console.log("================================================================================");
  console.log("🚀 VERIFYING ISOLATED STAGING ENVIRONMENT & EXPERIMENTATION FLOW");
  console.log("================================================================================");

  // 1. Connect to Staging MongoDB
  await mongoose.connect(STAGING_MONGO_URI);
  console.log(" Connected to Staging MongoDB at 127.0.0.1:27018/webfashion_staging");

  // 2. Connect to Staging Redis
  const redis = new Redis(STAGING_REDIS_URL);
  console.log(" Connected to Staging Redis at 127.0.0.1:6381");

  // 3. Verify Experiment in Staging
  const aaExp = await Experiment.findOne({ experiment_id: AA_EXPERIMENT_ID }).lean();
  console.log(`\n--- [Staging Check 1] Experiment Status ---`);
  console.log(`Experiment ID: ${aaExp?.experiment_id}`);
  console.log(`Status: ${aaExp?.status}`);
  console.log(`Variants:`, aaExp?.variants?.map((v) => `${v.name} (${v.weight}%, algo: ${v.algorithm})`));
  const isExpRunning = aaExp?.status === "running" && aaExp?.variants?.length === 2;
  console.log(`Experiment verification: ${isExpRunning ? "PASS" : "FAIL"}`);

  // 4. Test Deterministic Assignment
  console.log(`\n--- [Staging Check 2] Deterministic Assignment (100 Seeds) ---`);
  await experimentService.invalidateExperimentCache(AA_EXPERIMENT_ID);
  let countA = 0;
  let countB = 0;
  for (let i = 1; i <= 100; i++) {
    const userId = `staging_user_${i}`;
    const assign = await experimentService.assignVariant(userId, {
      experimentId: AA_EXPERIMENT_ID,
      entityType: "user",
    });
    if (assign.variant === "A") countA++;
    if (assign.variant === "B") countB++;
  }
  console.log(`Allocation: Variant A = ${countA}%, Variant B = ${countB}%`);
  const balanced = countA > 35 && countB > 35;
  console.log(`Deterministic allocation balance check: ${balanced ? "PASS" : "FAIL"}`);

  // 5. Test Semantic Search in Staging
  console.log(`\n--- [Staging Check 3] Staging Semantic Search ---`);
  const searchRes = await semanticSearchService.search({
    query: "áo thun nam",
    limit: 2,
  });
  console.log(`Search Mode: ${searchRes.searchMode} | Matched: ${searchRes.totalMatched}`);
  console.log(`Top Product: "${searchRes.results[0]?.title}" (Score: ${searchRes.results[0]?.score})`);
  const searchPass = searchRes.results.length > 0;

  // 6. Test RAG in Staging
  console.log(`\n--- [Staging Check 4] Staging RAG Retrieval ---`);
  const ragRes = await ragService.answerQuestion("Quy định đổi trả hàng ở 404Studio như thế nào?", {
    sourceTypes: ["page"],
  });
  console.log(`RAG Grounded: ${ragRes.hasGroundedContext}`);
  console.log(`Sources:`, ragRes.sources.map((s) => s.title));
  console.log(`Answer preview: ${ragRes.answer?.slice(0, 150)}...`);
  const ragPass = ragRes.hasGroundedContext && ragRes.sources.length > 0;

  console.log("\n================================================================================");
  console.log("🏁 STAGING VERIFICATION RESULT");
  console.log("================================================================================");
  console.log(JSON.stringify({
    stagingMongo: true,
    stagingRedis: true,
    isExpRunning,
    balanced,
    searchPass,
    ragPass,
  }, null, 2));

  await redis.quit();
  await mongoose.disconnect();
  process.exit(0);
}

verifyStaging().catch((err) => {
  console.error("Staging verification failed:", err);
  process.exit(1);
});
