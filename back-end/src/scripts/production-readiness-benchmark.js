import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { VectorEmbedding } from "../modules/ai/models/vectorEmbedding.model.js";
import embeddingService from "../modules/ai/services/embedding.service.js";
import vectorIndexService from "../modules/ai/services/vectorIndex.service.js";
import semanticSearchService, {
  cosineSimilarity,
  parseNaturalLanguageQuery,
} from "../modules/ai/services/semanticSearch.service.js";
import ragService from "../modules/ai/services/rag.service.js";
import aiToolRegistry, {
  generateActionToken,
  verifyActionToken,
} from "../modules/ai/services/aiAgent.service.js";
import aiChatService from "../modules/communication/aiChat/aiChat.service.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";
import {
  initVectorSyncWorker,
  processVectorSyncJob,
  enqueueVectorSyncJob,
} from "../modules/ai/queues/vectorSync.queue.js";

async function runBenchmark() {
  console.log("================================================================================");
  console.log("🚀 STARTING REAL-DATA PRODUCTION READINESS AUDIT & BENCHMARK");
  console.log("================================================================================");

  await connectDB();

  // Pick or get a test user
  let realUser = await User.findOne({ role: "user" }).select("_id email firstName lastName").lean();
  if (!realUser) {
    realUser = await User.findOne().select("_id email firstName lastName").lean();
  }
  const testUserId = realUser ? String(realUser._id) : "669000000000000000000001";
  console.log(`👤 Test Customer User: ${realUser?.email || "mock"} (ID: ${testUserId})`);

  const results = {};

  // --------------------------------------------------------------------------
  // SCENARIO 1: Tìm áo thun dưới 300k bằng tiếng Việt
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 1: Tìm áo thun dưới 300k bằng tiếng Việt ---");
  const s1Start = Date.now();
  const s1Res = await semanticSearchService.search({
    query: "tìm cho mình áo thun dưới 300k",
    sourceType: "product",
    topK: 4,
  });
  const s1Latency = Date.now() - s1Start;
  results.scenario1 = {
    pass:
      s1Res.results.length > 0 &&
      s1Res.results.every((r) => r.metadata?.price <= 300000),
    count: s1Res.results.length,
    appliedFilters: s1Res.appliedFilters,
    topResults: s1Res.results.map((r) => ({
      name: r.metadata?.name,
      price: r.metadata?.price,
      score: r.score,
      vectorScore: r.vectorScore,
      keywordScore: r.keywordScore,
    })),
    latencyMs: s1Latency,
  };
  console.log(JSON.stringify(results.scenario1, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 2: Tìm sản phẩm bằng từ đồng nghĩa (ví dụ: "áo cộc tay", "quần bò", "đồ mùa đông")
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 2: Tìm sản phẩm bằng từ đồng nghĩa ---");
  const s2Start = Date.now();
  const s2Res = await semanticSearchService.search({
    query: "quần bò đi chơi", // "quần bò" là từ đồng nghĩa của "quần jean"
    sourceType: "product",
    topK: 3,
  });
  const s2Latency = Date.now() - s2Start;
  const s2FoundJean = s2Res.results.some(
    (r) =>
      r.metadata?.name?.toLowerCase().includes("jean") ||
      r.title?.toLowerCase().includes("jean")
  );
  results.scenario2 = {
    pass: s2FoundJean,
    query: "quần bò đi chơi",
    foundJean: s2FoundJean,
    topResults: s2Res.results.map((r) => ({
      name: r.metadata?.name,
      score: r.score,
    })),
    latencyMs: s2Latency,
  };
  console.log(JSON.stringify(results.scenario2, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 3: Tìm sản phẩm không tồn tại (ví dụ: "tàu ngầm hạt nhân", "laptop dell xps")
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 3: Tìm sản phẩm không tồn tại ---");
  const s3Start = Date.now();
  const s3Res = await semanticSearchService.search({
    query: "tàu ngầm hạt nhân công nghệ cao",
    sourceType: "product",
    topK: 4,
    minScore: 0.35,
  });
  const s3Latency = Date.now() - s3Start;
  results.scenario3 = {
    pass: s3Res.results.length === 0,
    count: s3Res.results.length,
    latencyMs: s3Latency,
  };
  console.log(JSON.stringify(results.scenario3, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 4: Hỏi AI về chính sách cửa hàng (RAG grounded retrieval)
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 4: Hỏi AI về chính sách cửa hàng ---");
  const s4Start = Date.now();
  const s4Res = await ragService.answerQuestion(
    "Shop có chính sách đổi trả hàng như thế nào và địa chỉ liên hệ ở đâu?",
    { sourceTypes: ["page", "settings"], topK: 3 }
  );
  const s4Latency = Date.now() - s4Start;
  results.scenario4 = {
    pass: s4Res.hasGroundedContext && s4Res.sources.length > 0,
    sources: s4Res.sources.map((s) => ({ title: s.title, url: s.url, score: s.score })),
    answerPreview: s4Res.answer?.slice(0, 300),
    latencyMs: s4Latency,
  };
  console.log(JSON.stringify(results.scenario4, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 5: Yêu cầu AI tìm sản phẩm và chuẩn bị thêm vào giỏ hàng
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 5: Yêu cầu AI tìm sản phẩm và thêm vào giỏ ---");
  const s5Start = Date.now();
  const s5Res = await aiChatService.sendMessage(testUserId, {
    content: "Tìm cho tôi 1 áo thun dưới 200k và thêm vào giỏ hàng",
  });
  const s5Latency = Date.now() - s5Start;
  const s5Pending = s5Res.pendingAction;
  results.scenario5 = {
    pass:
      s5Pending &&
      s5Pending.actionType === "add_to_cart" &&
      Boolean(s5Pending.actionId) &&
      Boolean(s5Pending.actionToken) &&
      s5Pending.items.length > 0,
    actionId: s5Pending?.actionId,
    actionType: s5Pending?.actionType,
    items: s5Pending?.items?.map((it) => ({
      name: it.name,
      color: it.color,
      size: it.size,
      price: it.unit_price,
    })),
    totalEstimatedPriceFormatted: s5Pending?.totalEstimatedPriceFormatted,
    latencyMs: s5Latency,
  };
  console.log(JSON.stringify(results.scenario5, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 6: Xác nhận và hủy hành động thêm giỏ hàng
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 6: Xác nhận và Hủy hành động thêm giỏ hàng ---");
  // 6A. Hủy hành động
  const s6CancelStart = Date.now();
  const s6CancelRes = await aiChatService.sendMessage(testUserId, {
    content: "Thôi hủy không thêm nữa nhé",
    cancelAction: true,
  });
  const s6CancelLatency = Date.now() - s6CancelStart;
  const s6CancelPass =
    s6CancelRes.actionResult?.status === "CANCELLED" &&
    s6CancelRes.pendingAction === null;

  // 6B. Tạo lại pendingAction và Xác nhận thực thi
  await aiChatService.sendMessage(testUserId, {
    content: "Tìm 1 áo thun dưới 200k và thêm vào giỏ hàng",
  });
  const convAfterTurn = await (
    await import("../modules/communication/conversations/conversation.service.js")
  ).default.getOrCreateCustomerAiConversation(testUserId);

  const activePending = convAfterTurn?.metadata?.pendingAction;
  let s6ConfirmPass = false;
  let s6ConfirmRes = null;

  if (activePending) {
    const s6ConfirmStart = Date.now();
    s6ConfirmRes = await aiChatService.sendMessage(testUserId, {
      content: "Xác nhận thêm vào giỏ hàng",
      confirmAction: activePending,
    });
    const s6ConfirmLatency = Date.now() - s6ConfirmStart;
    s6ConfirmPass =
      s6ConfirmRes.actionResult?.status === "EXECUTED" ||
      s6ConfirmRes.actionResult?.success === true;
    results.scenario6 = {
      cancelPass: s6CancelPass,
      confirmPass: s6ConfirmPass,
      actionResult: s6ConfirmRes?.actionResult,
      cancelLatencyMs: s6CancelLatency,
      confirmLatencyMs: s6ConfirmLatency,
    };
  } else {
    results.scenario6 = {
      cancelPass: s6CancelPass,
      confirmPass: false,
      reason: "No active pendingAction found to confirm",
    };
  }
  console.log(JSON.stringify(results.scenario6, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 7: Thao tác khi chưa đăng nhập (Khách vãng lai / Unauthenticated)
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 7: Thao tác khi chưa đăng nhập ---");
  const s7Start = Date.now();
  const s7Res = await aiChatService.sendMessage(null, {
    content: "Tìm áo thun và thêm vào giỏ hàng giúp tôi",
  });
  const s7Latency = Date.now() - s7Start;
  results.scenario7 = {
    pass:
      s7Res.pendingAction === null &&
      s7Res.aiMessage?.content?.includes("đăng nhập"),
    message: s7Res.aiMessage?.content,
    latencyMs: s7Latency,
  };
  console.log(JSON.stringify(results.scenario7, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 8: Cập nhật sản phẩm và kiểm tra Vector Synchronization
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 8: Cập nhật sản phẩm & Vector Synchronization ---");
  const testProduct = await Product.findOne({ is_active: true }).lean();
  let s8Pass = false;
  let s8Details = {};

  if (testProduct) {
    const oldVector = await VectorEmbedding.findOne({
      sourceType: "product",
      sourceId: String(testProduct._id),
    }).lean();

    // Trigger sync for this product
    const syncRes = await vectorIndexService.syncProductById(testProduct._id, {
      force: false,
    });

    const newVector = await VectorEmbedding.findOne({
      sourceType: "product",
      sourceId: String(testProduct._id),
    }).lean();

    s8Pass =
      Boolean(newVector) &&
      newVector.contentHash === oldVector?.contentHash &&
      syncRes.status === "reused";

    s8Details = {
      productId: testProduct._id,
      name: testProduct.name,
      syncStatus: syncRes.status,
      vectorModel: newVector.embeddingModel,
      dimensions: newVector.dimensions,
      lastSyncedAt: newVector.lastSyncedAt,
      pass: s8Pass,
    };
  }
  results.scenario8 = s8Details;
  console.log(JSON.stringify(results.scenario8, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 9: Thử nghiệm AI Provider Timeout & Resilience
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 9: AI Provider Timeout & Resilience ---");
  const s9Start = Date.now();
  let s9Pass = false;
  let s9Details = {};

  try {
    // Test embedding timeout handling with ultra-short timeout
    const testText = "Áo khoác gió thời trang thể thao 404Studio";
    const res = await embeddingService.embedText(testText, {
      timeoutMs: 1, // Will trigger timeout and bounded retry / fallback
      allowLocalFallback: true,
    });
    s9Pass = Boolean(res.vector) && res.dimensions === 1536;
    s9Details = {
      pass: s9Pass,
      fallbackUsed: res.fallback === true || res.model?.includes("local"),
      dimensions: res.dimensions,
      durationMs: Date.now() - s9Start,
    };
  } catch (err) {
    s9Details = { pass: false, error: err.message };
  }
  results.scenario9 = s9Details;
  console.log(JSON.stringify(results.scenario9, null, 2));

  // --------------------------------------------------------------------------
  // SCENARIO 10: Restart Worker / Queue Consistency & Vector Persistence
  // --------------------------------------------------------------------------
  console.log("\n--- SCENARIO 10: Worker Consistency & Vector Persistence ---");
  const s10CountBefore = await VectorEmbedding.countDocuments();
  const workerInstance = initVectorSyncWorker();
  const s10CountAfter = await VectorEmbedding.countDocuments();
  results.scenario10 = {
    pass: s10CountBefore === s10CountAfter && s10CountAfter >= 33,
    vectorCountBefore: s10CountBefore,
    vectorCountAfter: s10CountAfter,
    workerInitialized: Boolean(workerInstance),
  };
  console.log(JSON.stringify(results.scenario10, null, 2));

  // ==========================================================================
  // PERFORMANCE & RESOURCE SCALING BENCHMARK (mongo_cosine LIMITS)
  // ==========================================================================
  console.log("\n================================================================================");
  console.log("📊 RUNNING PERFORMANCE, MEMORY & SCALING BENCHMARK FOR mongo_cosine");
  console.log("================================================================================");

  const queryVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
  // Normalize
  const qNorm = Math.sqrt(queryVector.reduce((s, x) => s + x * x, 0));
  for (let i = 0; i < 1536; i++) queryVector[i] /= qNorm;

  const datasetSizes = [33, 100, 500, 1000, 2500, 5000];
  const benchResults = [];

  // Generate synthetic vectors in memory to benchmark pure cosine computation & RAM overhead
  for (const size of datasetSizes) {
    // Generate synthetic dataset of `size` vectors
    const syntheticDocs = [];
    for (let i = 0; i < size; i++) {
      const vec = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      const vNorm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
      for (let j = 0; j < 1536; j++) vec[j] /= vNorm;
      syntheticDocs.push({
        _id: `doc_${i}`,
        embedding: vec,
        metadata: { price: 150000 + i * 100, inStock: true },
      });
    }

    // Measure memory before
    if (global.gc) global.gc();
    const memBefore = process.memoryUsage();
    const startCpu = process.cpuUsage();
    const startTime = performance.now();

    // Run exact cosine similarity loop (as done in mongo_cosine)
    const scored = [];
    for (let i = 0; i < syntheticDocs.length; i++) {
      const doc = syntheticDocs[i];
      const score = cosineSimilarity(queryVector, doc.embedding);
      if (score >= 0.2) {
        scored.push({ id: doc._id, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, 10);

    const elapsedMs = performance.now() - startTime;
    const cpuDiff = process.cpuUsage(startCpu);
    const memAfter = process.memoryUsage();

    benchResults.push({
      vectorCount: size,
      dimensions: 1536,
      latencyMs: Number(elapsedMs.toFixed(3)),
      cpuUserMs: Number((cpuDiff.user / 1000).toFixed(2)),
      cpuSystemMs: Number((cpuDiff.system / 1000).toFixed(2)),
      heapUsedMb: Number((memAfter.heapUsed / (1024 * 1024)).toFixed(2)),
      rssMb: Number((memAfter.rss / (1024 * 1024)).toFixed(2)),
      topKCount: topK.length,
    });
  }

  console.table(benchResults);

  console.log("\n================================================================================");
  console.log("🏁 AUDIT SUMMARY & VERIFICATION DATA");
  console.log("================================================================================");
  console.log(JSON.stringify({ scenarios: results, benchmarks: benchResults }, null, 2));

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
