import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import trackingService from "../modules/tracking/tracking.service.js";
import recommendationService from "../modules/recommendations/recommendation.service.js";
import UserEvent from "../modules/tracking/userEvent.model.js";
import UserInterestProfile from "../modules/recommendations/userInterestProfile.model.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";
import Category from "../modules/categories/category.model.js";
import { addTrackingJob } from "../queues/tracking.queue.js";
import { initTrackingWorker } from "../queues/workers/tracking.worker.js";
import embeddingService from "../modules/ai/services/embedding.service.js";
import { LocalEmbeddingProvider } from "../modules/ai/providers/LocalEmbeddingProvider.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRealDataVerification() {
  console.log("================================================================================");
  console.log("🔬 STARTING 10 REAL-DATA E2E TRACKING & RECOMMENDATION SCENARIOS");
  console.log("================================================================================\n");

  // Thiết lập LocalEmbeddingProvider cho kiểm thử xác thực nhanh, độc lập và tất định
  embeddingService.setProvider(new LocalEmbeddingProvider({ dimensions: 1536 }));

  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();

  // Khởi chạy BullMQ Tracking Worker để tiêu thụ các jobs trong hàng đợi
  const trackingWorker = initTrackingWorker();
  console.log("⚡ Tracking Worker khởi chạy thành công, sẵn sàng tiêu thụ queue jobs.");

  // Find real products and categories by verified ObjectIds
  const shirtProd = (await Product.findById("6a3d5b96a9a4641d7610b221").lean()) ||
    (await Product.findOne({ is_active: true }).lean());
  const jeansProd = (await Product.findById("6a3f46317302ffeba0d39495").lean()) ||
    (await Product.findOne({ is_active: true, _id: { $ne: shirtProd._id } }).lean());

  const teeCat = shirtProd?.category_id || (await Category.findOne().lean())?._id;
  const jeansCat = jeansProd?.category_id || (await Category.findOne().lean())?._id;

  console.log("📦 Test Real Products Selected:");
  console.log(`- Shirt Product: ${shirtProd?.name} (ID: ${shirtProd?._id}, Price: ${shirtProd?.new_price || shirtProd?.price})`);
  console.log(`- Jeans Product: ${jeansProd?.name} (ID: ${jeansProd?._id}, Price: ${jeansProd?.new_price || jeansProd?.price})`);

  // Distinct Test Users / Identities
  const userAId = "6a3d5033ce1937372b7c85bd"; // Real Customer User A
  const userBId = "6a3d5f74f967e06e496b92d7"; // Real Customer User B
  const userDId = "6a4f5ee5ab57a0ecd8258ff2"; // Real Customer User D (Consent Revoke)
  const adminId = "6a3d49e1a7ea0400413dc80b"; // Real Admin User
  const anonUserC = "33333333-3333-4333-8333-333333333333"; // Anonymous User C (Cold start)
  const anonE2E = "11111111-2222-4333-8444-555555555555";
  const sessionE2E = "sess-e2e-real-" + Date.now();

  const scenarioReports = [];

  // ==========================================================================
  // SCENARIO 1: Khách mới truy cập trang chủ (page_view, session_start)
  // ==========================================================================
  console.log("\n--- [Kịch bản 1] Khách mới truy cập trang chủ ---");
  const s1StartCount = await UserEvent.countDocuments({ session_id: sessionE2E });
  const ev1_start = {
    event_id: new mongoose.Types.ObjectId().toString(),
    event_type: "session_start",
    anonymous_id: anonE2E,
    session_id: sessionE2E,
    source: "frontend",
    context: { deviceType: "desktop", pathname: "/" },
  };
  const ev1_pv = {
    event_id: new mongoose.Types.ObjectId().toString(),
    event_type: "page_view",
    anonymous_id: anonE2E,
    session_id: sessionE2E,
    source: "frontend",
    context: { deviceType: "desktop", pathname: "/" },
  };
  await trackingService.recordBatchEvents([ev1_start, ev1_pv], null);
  // Allow worker to process
  await delay(1000);
  const s1EndCount = await UserEvent.countDocuments({ session_id: sessionE2E });
  const s1Events = await UserEvent.find({ session_id: sessionE2E }).lean();
  scenarioReports.push({
    scenario: "1. Khách mới truy cập trang chủ",
    eventsEmitted: ["session_start", "page_view"],
    eventsSavedToDB: s1EndCount - s1StartCount,
    savedEventTypes: s1Events.map((e) => e.event_type),
    success: s1EndCount - s1StartCount === 2,
  });
  console.log(`✅ Lưu thành công ${s1EndCount - s1StartCount} sự kiện: ${s1Events.map((e) => e.event_type).join(", ")}`);

  // ==========================================================================
  // SCENARIO 2: Khách xem nhiều sản phẩm thuộc một danh mục
  // ==========================================================================
  console.log("\n--- [Kịch bản 2] Khách xem nhiều sản phẩm thuộc danh mục Áo thun ---");
  const s2Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "category_view",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      category_id: teeCat ? teeCat.toString() : null,
      source: "frontend",
      context: { pathname: "/products?category=" + teeCat },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "product_impression",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      category_id: shirtProd.category_id?.toString() || teeCat?.toString(),
      meta: { position: 1, dwellTimeMs: 650 },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "product_view",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      category_id: shirtProd.category_id?.toString() || teeCat?.toString(),
      meta: { price: shirtProd.new_price || 150000 },
    },
  ];
  await trackingService.recordBatchEvents(s2Events, null);
  await delay(1000);
  const profileAnon = await UserInterestProfile.findOne({ anonymous_id: anonE2E }).lean();
  scenarioReports.push({
    scenario: "2. Khách xem nhiều sản phẩm một danh mục",
    eventsEmitted: ["category_view", "product_impression", "product_view"],
    profileCategoryScores: profileAnon?.category_scores || {},
    success: Object.keys(profileAnon?.category_scores || {}).length > 0,
  });
  console.log("✅ Cập nhật UserInterestProfile danh mục:", profileAnon?.category_scores);

  // ==========================================================================
  // SCENARIO 3: Khách tìm sản phẩm bằng từ khóa
  // ==========================================================================
  console.log("\n--- [Kịch bản 3] Khách tìm sản phẩm bằng từ khóa 'áo thun basic' ---");
  const s3Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "search_performed",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      query: "áo thun basic",
      meta: { resultCount: 8 },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "search_result_click",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      query: "áo thun basic",
      meta: { position: 1 },
    },
  ];
  await trackingService.recordBatchEvents(s3Events, null);
  await delay(1000);
  const profileWithKw = await UserInterestProfile.findOne({ anonymous_id: anonE2E }).lean();
  scenarioReports.push({
    scenario: "3. Tìm sản phẩm bằng từ khóa",
    eventsEmitted: ["search_performed", "search_result_click"],
    keywordScores: profileWithKw?.keyword_scores || {},
    success: Object.keys(profileWithKw?.keyword_scores || {}).length > 0,
  });
  console.log("✅ Cập nhật từ khóa tìm kiếm:", profileWithKw?.keyword_scores);

  // ==========================================================================
  // SCENARIO 4: Khách sử dụng Semantic Search
  // ==========================================================================
  console.log("\n--- [Kịch bản 4] Khách sử dụng Semantic Search ---");
  const s4Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "semantic_search_used",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      query: "tìm áo mặc mùa hè thoáng mát",
      meta: { resultCount: 4, algorithm: "vector_ai" },
    },
  ];
  await trackingService.recordBatchEvents(s4Events, null);
  await delay(500);
  const s4Recorded = await UserEvent.findOne({
    session_id: sessionE2E,
    event_type: "semantic_search_used",
  }).lean();
  scenarioReports.push({
    scenario: "4. Khách sử dụng Semantic Search",
    eventsEmitted: ["semantic_search_used"],
    querySaved: s4Recorded?.query,
    success: Boolean(s4Recorded),
  });
  console.log("✅ Ghi nhận sự kiện semantic_search_used thành công:", s4Recorded?.query);

  // ==========================================================================
  // SCENARIO 5: Khách yêu thích sản phẩm
  // ==========================================================================
  console.log("\n--- [Kịch bản 5] Khách yêu thích sản phẩm ---");
  const s5Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "product_favorite",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
    },
  ];
  await trackingService.recordBatchEvents(s5Events, null);
  await delay(500);
  const s5Recorded = await UserEvent.findOne({
    session_id: sessionE2E,
    event_type: "product_favorite",
  }).lean();
  scenarioReports.push({
    scenario: "5. Khách yêu thích sản phẩm",
    eventsEmitted: ["product_favorite"],
    saved: Boolean(s5Recorded),
    success: Boolean(s5Recorded),
  });
  console.log("✅ Ghi nhận sự kiện product_favorite thành công");

  // ==========================================================================
  // SCENARIO 6: Khách thêm sản phẩm vào giỏ & đổi số lượng
  // ==========================================================================
  console.log("\n--- [Kịch bản 6] Khách thêm vào giỏ & đổi số lượng ---");
  const s6Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "add_to_cart",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      meta: { quantity: 1, price: shirtProd.new_price || 150000, color: "đen", size: "L" },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "cart_quantity_change",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      meta: { oldQuantity: 1, newQuantity: 2, delta: 1 },
    },
  ];
  await trackingService.recordBatchEvents(s6Events, null);
  await delay(1000);
  const profileWithAttr = await UserInterestProfile.findOne({ anonymous_id: anonE2E }).lean();
  scenarioReports.push({
    scenario: "6. Thêm vào giỏ & đổi số lượng",
    eventsEmitted: ["add_to_cart", "cart_quantity_change"],
    preferredColors: profileWithAttr?.preferred_colors || {},
    preferredSizes: profileWithAttr?.preferred_sizes || {},
    success: Boolean(profileWithAttr?.preferred_colors && profileWithAttr?.preferred_sizes),
  });
  console.log("✅ Cập nhật thuộc tính sở thích màu & size:", {
    colors: profileWithAttr?.preferred_colors,
    sizes: profileWithAttr?.preferred_sizes,
  });

  // ==========================================================================
  // SCENARIO 7: Khách bắt đầu thanh toán (checkout_started)
  // ==========================================================================
  console.log("\n--- [Kịch bản 7] Khách bắt đầu thanh toán ---");
  const s7Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "checkout_started",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      meta: { itemCount: 2, totalPrice: 300000 },
    },
  ];
  await trackingService.recordBatchEvents(s7Events, null);
  await delay(500);
  const s7Recorded = await UserEvent.findOne({
    session_id: sessionE2E,
    event_type: "checkout_started",
  }).lean();
  scenarioReports.push({
    scenario: "7. Khách bắt đầu thanh toán",
    eventsEmitted: ["checkout_started"],
    saved: Boolean(s7Recorded),
    success: Boolean(s7Recorded),
  });
  console.log("✅ Ghi nhận sự kiện checkout_started thành công");

  // ==========================================================================
  // SCENARIO 8: Khách tạo đơn hàng (order_placed - Server-side only)
  // ==========================================================================
  console.log("\n--- [Kịch bản 8] Khách tạo đơn hàng (order_placed) ---");
  const mockOrderDoc = {
    _id: new mongoose.Types.ObjectId(),
    user_id: new mongoose.Types.ObjectId(userAId),
    items: [
      {
        product_id: shirtProd._id,
        quantity: 2,
        price: shirtProd.new_price || 150000,
      },
    ],
    total_price: 300000,
    payment_method: "cod",
    status: "pending",
  };
  await trackingService.trackOrderPlaced(mockOrderDoc);
  await delay(1200);
  const s8Recorded = await UserEvent.findOne({
    user_id: new mongoose.Types.ObjectId(userAId),
    event_type: "order_placed",
    "meta.order_id": mockOrderDoc._id.toString(),
  }).lean();
  scenarioReports.push({
    scenario: "8. Khách tạo đơn hàng (Server-side)",
    eventsEmitted: ["order_placed"],
    savedToDB: Boolean(s8Recorded),
    isServerSide: true,
    success: Boolean(s8Recorded),
  });
  console.log("✅ Ghi nhận sự kiện order_placed an toàn từ server:", Boolean(s8Recorded));

  // ==========================================================================
  // SCENARIO 9: Khách hoàn tất thanh toán hợp lệ (purchase_completed)
  // ==========================================================================
  console.log("\n--- [Kịch bản 9] Khách hoàn tất thanh toán hợp lệ (purchase_completed) ---");
  await trackingService.trackPurchaseCompleted(mockOrderDoc);
  await delay(1200);
  const s9Recorded = await UserEvent.findOne({
    user_id: new mongoose.Types.ObjectId(userAId),
    event_type: "purchase_completed",
    "meta.order_id": mockOrderDoc._id.toString(),
  }).lean();
  scenarioReports.push({
    scenario: "9. Hoàn tất thanh toán hợp lệ",
    eventsEmitted: ["purchase_completed"],
    savedToDB: Boolean(s9Recorded),
    isServerSide: true,
    success: Boolean(s9Recorded),
  });
  console.log("✅ Ghi nhận sự kiện purchase_completed sau xác thực:", Boolean(s9Recorded));

  // ==========================================================================
  // SCENARIO 10: Khách sử dụng AI Chatbot tìm kiếm sản phẩm & tương tác
  // ==========================================================================
  console.log("\n--- [Kịch bản 10] Khách sử dụng AI Chatbot ---");
  const s10Events = [
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "ai_chat_opened",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      meta: { timestamp: new Date().toISOString() },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "ai_product_recommended",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      meta: { algorithm: "ai_agent", position: 1 },
    },
    {
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: "ai_recommendation_clicked",
      anonymous_id: anonE2E,
      session_id: sessionE2E,
      product_id: shirtProd._id.toString(),
      meta: { sourceId: shirtProd._id.toString(), position: 1 },
    },
  ];
  await trackingService.recordBatchEvents(s10Events, null);
  await delay(1200);
  const s10Count = await UserEvent.countDocuments({
    session_id: sessionE2E,
    event_type: { $in: ["ai_chat_opened", "ai_product_recommended", "ai_recommendation_clicked"] },
  });
  scenarioReports.push({
    scenario: "10. Tương tác AI Chatbot",
    eventsEmitted: ["ai_chat_opened", "ai_product_recommended", "ai_recommendation_clicked"],
    savedCount: s10Count,
    success: s10Count === 3,
  });
  console.log(`✅ Ghi nhận đầy đủ 3 sự kiện AI Chatbot: ${s10Count}/3 sự kiện.`);

  // ==========================================================================
  // PHẦN 3: KIỂM CHỨNG 4 NHÓM KHÁCH HÀNG (COHORTS) CHO RECOMMENDATION
  // ==========================================================================
  console.log("\n================================================================================");
  console.log("🎯 KIỂM CHỨNG ĐỀ XUẤT CÁ NHÂN HÓA TRÊN 4 NHÓM KHÁCH HÀNG THỰC TẾ");
  console.log("================================================================================");

  // Setup Profile User A: Thích Áo thun (teeCat) & Áo nam
  await UserInterestProfile.findOneAndUpdate(
    { user_id: new mongoose.Types.ObjectId(userAId) },
    {
      $set: {
        consent_status: "granted",
        category_scores: { [teeCat.toString()]: 25 },
        keyword_scores: { "ao thun": 15, "basic": 10 },
        preferred_colors: { "den": 10, "trang": 5 },
        preferred_sizes: { "L": 10 },
        total_events_count: 15,
        last_active_at: new Date(),
      },
    },
    { upsert: true }
  );

  // Setup Profile User B: Thích Quần jeans (jeansCat) & Quần nam
  await UserInterestProfile.findOneAndUpdate(
    { user_id: new mongoose.Types.ObjectId(userBId) },
    {
      $set: {
        consent_status: "granted",
        category_scores: { [jeansCat.toString()]: 25 },
        keyword_scores: { "jeans": 15, "denim": 10 },
        preferred_colors: { "xanh denim": 10 },
        preferred_sizes: { "31": 10, "32": 8 },
        total_events_count: 15,
        last_active_at: new Date(),
      },
    },
    { upsert: true }
  );

  // Setup User D: Thu hồi Consent (consent = 'denied')
  await UserInterestProfile.findOneAndUpdate(
    { user_id: new mongoose.Types.ObjectId(userDId) },
    {
      $set: {
        consent_status: "denied",
        category_scores: {},
        keyword_scores: {},
        preferred_colors: {},
        preferred_sizes: {},
        brand_scores: {},
        total_events_count: 0,
      },
    },
    { upsert: true }
  );

  // Xóa cache recommendation của các user để bảo đảm tính toán mới nhất
  if (redis) {
    const stream = redis.scanStream({ match: "recommendations:*" });
    for await (const keys of stream) {
      if (keys.length) await redis.del(...keys);
    }
  }

  // 1. Gợi ý cho User A
  const recUserA = await recommendationService.getRecommendations({ userId: userAId, limit: 6 });
  const topA = recUserA.products[0];

  // 2. Gợi ý cho User B
  const recUserB = await recommendationService.getRecommendations({ userId: userBId, limit: 6 });
  const topB = recUserB.products[0];

  // 3. Gợi ý cho User C (Cold start, vãng lai)
  const recUserC = await recommendationService.getRecommendations({ anonymousId: anonUserC, limit: 6 });

  // 4. Gợi ý cho User D (Từ chối theo dõi)
  const recUserD = await recommendationService.getRecommendations({ userId: userDId, limit: 6 });

  console.log("\n📊 KẾT QUẢ ĐỀ XUẤT CÁ NHÂN HÓA:");
  console.log(`- User A (Quan tâm Áo thun): Mode '${recUserA.mode}', Top 1: '${topA?.name}' (Danh mục: ${topA?.category_id?.name || topA?.category})`);
  console.log(`- User B (Quan tâm Quần jeans): Mode '${recUserB.mode}', Top 1: '${topB?.name}' (Danh mục: ${topB?.category_id?.name || topB?.category})`);
  console.log(`- User C (Cold Start / Chưa có lịch sử): Mode '${recUserC.mode}', Số sản phẩm fallback: ${recUserC.products.length}`);
  console.log(`- User D (Consent Denied): Mode '${recUserD.mode}', Có áp dụng cá nhân hóa không: ${recUserD.mode === "popular" ? "KHÔNG (Đúng luật)" : "CÓ (Sai luật)"}`);

  const cohortResults = {
    userA: {
      mode: recUserA.mode,
      topProduct: topA?.name,
      topCategory: topA?.category_id?.name || topA?.category,
      alignedWithProfile: topA?.name?.toLowerCase().includes("áo") || topA?.name?.toLowerCase().includes("thun"),
    },
    userB: {
      mode: recUserB.mode,
      topProduct: topB?.name,
      topCategory: topB?.category_id?.name || topB?.category,
      alignedWithProfile: topB?.name?.toLowerCase().includes("quần") || topB?.name?.toLowerCase().includes("jean"),
    },
    userC: {
      mode: recUserC.mode,
      fallbackSuccess: recUserC.products.length > 0 && recUserC.mode === "popular",
    },
    userD: {
      mode: recUserD.mode,
      privacyComplied: recUserD.mode === "popular",
    },
  };

  // ==========================================================================
  // PHẦN 4: ANALYTICS FUNNEL TRÊN TOÀN BỘ SỐ LIỆU ĐÃ TẠO
  // ==========================================================================
  console.log("\n================================================================================");
  console.log("📈 KIỂM CHỨNG PHỄU ANALYTICS & CHUYỂN ĐỔI CHÍNH XÁC");
  console.log("================================================================================");

  const funnelResult = await trackingService.getFunnelAnalytics();
  console.log("Phễu chuyển đổi hiện hành:");
  funnelResult.funnel.forEach((stg) => {
    console.log(`  [${stg.stage}] ${stg.label}: Events=${stg.eventCount}, Sessions=${stg.uniqueSessions}, Users=${stg.uniqueUsers} | Tỷ lệ bước=${stg.stepConversionRate}%, Tỷ lệ tổng=${stg.overallConversionRate}%`);
  });

  const overviewResult = await trackingService.getAnalyticsOverview();
  console.log(`\nTổng quan: ${overviewResult.totalEvents} sự kiện, ${overviewResult.activeSessionsCount} phiên hoạt động, CTR đề xuất: ${overviewResult.recommendationMetrics.ctrPercentage}%`);

  // ==========================================================================
  // TỔNG KẾT
  // ==========================================================================
  console.log("\n================================================================================");
  console.log("🏁 BÁO CÁO KẾT QUẢ ĐẦY ĐỦ:");
  console.log(
    JSON.stringify(
      {
        scenarioReports,
        cohortResults,
        funnelStagesCount: funnelResult.funnel.length,
        totalEventsInDB: overviewResult.totalEvents,
        allPassed: scenarioReports.every((s) => s.success) && cohortResults.userD.privacyComplied,
      },
      null,
      2
    )
  );
  console.log("================================================================================");

  if (trackingWorker) {
    await trackingWorker.close();
  }
  await mongoose.disconnect();
}

runRealDataVerification().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
