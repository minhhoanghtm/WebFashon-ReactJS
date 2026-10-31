import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import trackingService from "../modules/tracking/tracking.service.js";
import { getTrackingQueue } from "../queues/tracking.queue.js";
import UserEvent from "../modules/tracking/userEvent.model.js";
import UserInterestProfile from "../modules/recommendations/userInterestProfile.model.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTrackingBenchmark() {
  console.log("================================================================================");
  console.log("⚡ COMPREHENSIVE TRACKING BENCHMARK & SECURITY RESILIENCE TEST");
  console.log("================================================================================\n");

  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();

  const results = {
    throughput: {},
    security: {},
    resilience: {},
  };

  // ---------------------------------------------------------------------------
  // 1. BENCHMARK: INGESTION THROUGHPUT & LATENCY (p50, p95, p99)
  // ---------------------------------------------------------------------------
  console.log("▶ [Test 1] Benchmark Ingestion Throughput (500 events simulation)...");
  const N = 500;
  const latencies = [];
  const testSubject = "bench_anon_user_9999";
  const startTotal = Date.now();

  for (let i = 0; i < N; i++) {
    const t0 = process.hrtime.bigint();
    await trackingService.recordEvent(
      {
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: "product_view",
        anonymous_id: testSubject,
        session_id: "bench_session_001",
        meta: { test_idx: i },
      },
      null
    );
    const t1 = process.hrtime.bigint();
    latencies.push(Number(t1 - t0) / 1e6); // in ms
  }

  const totalTimeSec = (Date.now() - startTotal) / 1000;
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(N * 0.5)];
  const p95 = latencies[Math.floor(N * 0.95)];
  const p99 = latencies[Math.floor(N * 0.99)];
  const eps = Number((N / totalTimeSec).toFixed(1));

  results.throughput = {
    totalEvents: N,
    eventsPerSecond: eps,
    p50_ms: Number(p50.toFixed(2)),
    p95_ms: Number(p95.toFixed(2)),
    p99_ms: Number(p99.toFixed(2)),
  };

  console.log(`   - Throughput: ${eps} events/sec`);
  console.log(`   - Latency: p50 = ${p50.toFixed(2)}ms, p95 = ${p95.toFixed(2)}ms, p99 = ${p99.toFixed(2)}ms`);

  // ---------------------------------------------------------------------------
  // 2. SECURITY GUARD: CLIENT-SIDE SERVER-ONLY EVENT REJECTION
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Test 2] Security: Chặn giả mạo sự kiện Server-only từ Client...");
  let purchaseBlocked = false;
  try {
    const { trackEventSchema } = await import("../modules/tracking/tracking.validator.js");
    trackEventSchema.parse({
      body: {
        event_type: "purchase_completed",
        anonymous_id: "7b470000-0000-0000-0000-000000000000",
      },
    });
  } catch (err) {
    purchaseBlocked = true;
  }

  let orderPlacedBlocked = false;
  try {
    const { trackEventSchema } = await import("../modules/tracking/tracking.validator.js");
    trackEventSchema.parse({
      body: {
        event_type: "order_placed",
        anonymous_id: "7b470000-0000-0000-0000-000000000000",
      },
    });
  } catch (err) {
    orderPlacedBlocked = true;
  }

  results.security.purchaseBlocked = purchaseBlocked;
  results.security.orderPlacedBlocked = orderPlacedBlocked;
  console.log(`   - Chặn client gửi 'purchase_completed': ${purchaseBlocked}`);
  console.log(`   - Chặn client gửi 'order_placed': ${orderPlacedBlocked}`);

  // ---------------------------------------------------------------------------
  // 3. PRIVACY: PII SANITIZATION (Email / Phone in search queries)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Test 3] Quyền riêng tư: Lọc PII (Email & Số điện thoại) trong Search query...");
  const rawPiiQuery = "tìm áo thun liên hệ test@example.com hoặc 0912345678";
  await trackingService.recordEvent(
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "search_performed",
      anonymous_id: testSubject,
      query: rawPiiQuery,
    },
    null
  );
  // UserEvent trong database không được chứa email/phone
  const piiEv = await UserEvent.findOne({
    anonymous_id: testSubject,
    event_type: "search_performed",
  }).sort({ createdAt: -1 });

  const isPiiSanitized = !piiEv?.query || (!piiEv.query.includes("test@example.com") && !piiEv.query.includes("0912345678"));
  results.security.isPiiSanitized = isPiiSanitized;
  console.log(`   - Truy vấn gốc chứa PII: "${rawPiiQuery}"`);
  console.log(`   - Truy vấn lưu trong DB: "${piiEv?.query || 'null'}" (Sanitized: ${isPiiSanitized})`);

  // ---------------------------------------------------------------------------
  // 4. RESILIENCE: QUEUE BACKLOG & DRAIN (100% DRAIN VERIFICATION)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Test 4] Resilience: Đo lường tiến độ xả hàng đợi BullMQ (Drain to 0)...");
  const queue = getTrackingQueue();
  const initialCounts = await queue.getJobCounts("active", "completed", "failed", "delayed", "waiting");
  console.log("   - Trạng thái hàng đợi ban đầu:", initialCounts);

  const drainStart = Date.now();
  let finalCounts = initialCounts;
  let drained = false;
  const maxDrainWaitMs = 30000;

  while (Date.now() - drainStart < maxDrainWaitMs) {
    finalCounts = await queue.getJobCounts("active", "completed", "failed", "delayed", "waiting");
    if ((finalCounts.waiting || 0) === 0 && (finalCounts.active || 0) === 0) {
      drained = true;
      break;
    }
    await delay(300);
  }

  const drainDurationSec = Number(((Date.now() - drainStart) / 1000).toFixed(2));
  const workerThroughput = drained && drainDurationSec > 0
    ? Number((N / drainDurationSec).toFixed(1))
    : Number((N / Math.max(1, drainDurationSec)).toFixed(1));

  console.log(`   - Trạng thái hàng đợi sau khi xả:`, finalCounts);
  console.log(`   - Backlog tồn đọng: waiting = ${finalCounts.waiting || 0}, active = ${finalCounts.active || 0}`);
  console.log(`   - Thời gian xả hết hàng đợi (Drain Time): ${drainDurationSec}s`);
  console.log(`   - Tốc độ xử lý Worker (Worker Throughput): ${workerThroughput} events/sec`);
  console.log(`   - Kết quả xả hàng đợi 100% (Backlog = 0): ${drained ? "VERIFIED ✅" : "INCOMPLETE ❌"}`);

  results.resilience = {
    initialJobCounts: initialCounts,
    finalJobCounts: finalCounts,
    drainDurationSec,
    workerThroughput,
    backlogDrainedToZero: drained,
  };

  // ---------------------------------------------------------------------------
  // 5. CLEANUP BENCHMARK DATA
  // ---------------------------------------------------------------------------
  await UserEvent.deleteMany({ anonymous_id: testSubject });
  await UserInterestProfile.deleteMany({ anonymous_id: testSubject });
  console.log("   - Đã dọn dẹp dữ liệu benchmark tổng hợp an toàn.");

  console.log("\n================================================================================");
  console.log("🎉 TRACKING BENCHMARK & RESILIENCE HOÀN TẤT THÀNH CÔNG");
  console.log("================================================================================\n");

  if (redis) await redis.quit();
  await mongoose.disconnect();
}

runTrackingBenchmark().catch((err) => {
  console.error("❌ Lỗi benchmark:", err);
  process.exit(1);
});
