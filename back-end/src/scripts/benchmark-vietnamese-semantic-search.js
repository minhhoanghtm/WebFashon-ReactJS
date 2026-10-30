import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import semanticSearchService, { parseNaturalLanguageQuery } from "../modules/ai/services/semanticSearch.service.js";

const TEST_QUERIES = [
  {
    id: "Q1",
    query: "Áo thun đen dưới 300k",
    expectedFilters: { maxPrice: 300000, color: "đen" },
    expectedKeywordTerms: ["áo", "thun"],
  },
  {
    id: "Q2",
    query: "Quần bò mặc đi chơi",
    expectedCanonical: "quần jean",
    expectedKeywordTerms: ["quần", "jean"],
  },
  {
    id: "Q3",
    query: "Áo khoác mùa đông ấm",
    expectedCanonical: "áo khoác",
    expectedKeywordTerms: ["khoác", "ấm"],
  },
  {
    id: "Q4",
    query: "Đồ đi biển thoáng mát",
    expectedCanonical: "mùa hè",
    expectedKeywordTerms: ["biển", "mát"],
  },
  {
    id: "Q5",
    query: "Áo oversize màu trắng size L",
    expectedFilters: { color: "trắng", size: "L" },
    expectedKeywordTerms: ["oversize", "trắng"],
  },
  {
    id: "Q6",
    query: "Trang phục đi học giá rẻ",
    expectedFilters: { maxPrice: 350000 },
    expectedCanonical: "áo sơ mi",
  },
  {
    id: "Q7",
    query: "Sản phẩm không tồn tại xyz12349876",
    expectedEmptyOrLowScore: true,
  },
];

async function runBenchmark() {
  console.log("=== STARTING VIETNAMESE SEMANTIC SEARCH BENCHMARK ===");
  const mongoUri = process.env.MONGO_CONNECTIONSTRING || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/web-fashion";
  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB");

  const results = [];
  let totalLatency = 0;

  for (const item of TEST_QUERIES) {
    console.log(`\n--- [${item.id}] Testing Query: "${item.query}" ---`);
    const parsedNL = parseNaturalLanguageQuery(item.query);
    console.log("  Parsed NL:", JSON.stringify(parsedNL.extractedFilters));
    console.log("  Semantic text expanded:", parsedNL.semanticQuery);

    const start = Date.now();
    const searchRes = await semanticSearchService.search({ query: item.query, limit: 5 });
    const latency = Date.now() - start;
    totalLatency += latency;

    console.log(`  Mode: ${searchRes.searchMode} | Fallback: ${searchRes.fallback} | Latency: ${latency}ms | Matched: ${searchRes.totalMatched}`);
    
    if (searchRes.results.length > 0) {
      console.log(`  Top Result: "${searchRes.results[0].title}" (Score: ${searchRes.results[0].score}, Price: ${searchRes.results[0].metadata?.price}đ, Colors: ${searchRes.results[0].metadata?.colors?.join(", ")})`);
    } else {
      console.log("  No products returned (Graceful empty response)");
    }

    results.push({
      id: item.id,
      query: item.query,
      latencyMs: latency,
      searchMode: searchRes.searchMode,
      fallback: searchRes.fallback,
      totalMatched: searchRes.totalMatched,
      topItem: searchRes.results[0]?.title || null,
      topScore: searchRes.results[0]?.score || 0,
      appliedFilters: searchRes.appliedFilters,
    });
  }

  const avgLatency = (totalLatency / TEST_QUERIES.length).toFixed(2);
  console.log("\n=== BENCHMARK SUMMARY ===");
  console.log(`Total queries: ${TEST_QUERIES.length}`);
  console.log(`Average Latency: ${avgLatency}ms`);
  console.log("Results table:");
  console.table(results);

  await mongoose.disconnect();
  console.log(" Disconnected from MongoDB. Benchmark completed.");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
