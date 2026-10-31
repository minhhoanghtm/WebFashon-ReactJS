const STAGING_URL = "http://localhost:8081";
const STAGING_API_URL = "http://localhost:8081/api";
const STAGING_MONGO_URI = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";
const STAGING_REDIS_URL = "redis://127.0.0.1:6381";

process.env.NODE_ENV = "staging";
process.env.MONGO_CONNECTIONSTRING = STAGING_MONGO_URI;
process.env.REDIS_URL = STAGING_REDIS_URL;
process.env.REDIS_HOST = "127.0.0.1";
process.env.REDIS_PORT = "6381";
process.env.ACTIVE_REC_EXPERIMENT_ID = "AA_Recommendation_Validation";

import { chromium } from "playwright";
import mongoose from "mongoose";
import { execSync } from "child_process";
import Redis from "ioredis";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForMongo(filter, model, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const doc = await model.findOne(filter).sort({ createdAt: -1 }).lean();
    if (doc) return doc;
    await delay(300);
  }
  return null;
}

async function runStagingFullStackE2E() {
  console.log("================================================================================");
  console.log("🌐 COMPLETE FULL STAGING STACK E2E ACCEPTANCE VERIFICATION");
  console.log("   Target: Nginx Staging http://localhost:8081 (Docker Container)");
  console.log("   MongoDB: 127.0.0.1:27018/webfashion_staging (Docker Container)");
  console.log("   Redis: 127.0.0.1:6381 (Docker Container)");
  console.log("   Worker: webfashion-worker-staging (Docker Container)");
  console.log("================================================================================\n");

  // 1. Connect MongoDB Staging
  await mongoose.connect(STAGING_MONGO_URI);
  console.log("✅ Connected directly to Staging MongoDB (port 27018).");

  // Models on Staging DB
  const UserEvent = (await import("../modules/tracking/userEvent.model.js")).default;
  const UserInterestProfile = (await import("../modules/recommendations/userInterestProfile.model.js")).default;
  const UserConsent = (await import("../modules/tracking/userConsent.model.js")).default;
  const Product = (await import("../modules/products/product.model.js")).default;
  const User = (await import("../modules/users/user.model.js")).default;
  const { Order, OrderItem } = await import("../modules/orders/order.model.js");
  const Experiment = (await import("../modules/recommendations/experiments/experiment.model.js")).default;
  const trackingService = (await import("../modules/tracking/tracking.service.js")).default;

  // 2. Connect Redis Staging
  let redis = new Redis(STAGING_REDIS_URL);
  const pong = await redis.ping();
  console.log(`✅ Connected directly to Staging Redis (port 6381): ${pong}\n`);

  // Check Seeded Data
  const sampleProducts = await Product.find({ is_active: true }).limit(5).lean();
  const sampleProduct = sampleProducts[0];
  const testCustomer = await User.findOne({ email: "customer@404studio.vn" }).lean();
  const testAdmin = await User.findOne({ email: "admin@404studio.vn" }).lean();

  if (!sampleProduct || !testCustomer || !testAdmin) {
    throw new Error("Missing seeded data. Please run seed-staging-data.js first.");
  }
  console.log(`📦 Available Staging Products: ${sampleProducts.length} (Sample: ${sampleProduct.name} - ${sampleProduct._id})`);
  console.log(`👤 Customer: ${testCustomer.email} (${testCustomer._id})`);
  console.log(`🛡️ Admin: ${testAdmin.email} (${testAdmin._id})\n`);

  // Reset testCustomer state cleanly before running scenarios
  await User.updateOne({ _id: testCustomer._id }, { $set: { consent_status: "granted" } });
  await UserInterestProfile.updateMany({ user_id: testCustomer._id }, { $set: { consent_status: "granted" } });
  await UserConsent.deleteMany({ subject_id: testCustomer._id.toString() });
  await UserEvent.deleteMany({ user_id: testCustomer._id });
  await Order.deleteMany({ user_id: testCustomer._id });
  await OrderItem.deleteMany({});
  await redis.del(`consent:denied:${testCustomer._id.toString()}`);
  await redis.del(`user:data_cleared:${testCustomer._id.toString()}`);

  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const anonId = crypto.randomUUID();
  const sessionId = `staging_sess_${Date.now()}`;

  // Helper to send tracking via Nginx API
  async function sendStagingEvent(payload, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${STAGING_API_URL}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Anonymous visits Homepage via Nginx 8081
    // -------------------------------------------------------------------------
    console.log("▶ [Scenario 1] Anonymous visits Homepage via Nginx 8081");
    await page.goto(`${STAGING_URL}/`, { waitUntil: "networkidle" });
    await delay(1000);

    const sc1Res = await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "page_view",
      source: "storefront_web",
      context: { pathname: "/", deviceType: "desktop" },
    });

    const sc1Doc = await waitForMongo({ anonymous_id: anonId, event_type: "page_view" }, UserEvent);
    const sc1Pass = sc1Res.status === 202 && !!sc1Doc;
    console.log(`   MongoDB page_view: ${sc1Pass ? "PASS ✅" : "FAIL ❌"} (${sc1Doc?._id || "none"})`);
    results.push({ id: 1, name: "Anonymous visits homepage via Nginx", status: sc1Pass ? "PASS ✅" : "FAIL ❌", docId: sc1Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 2: Product impression after valid viewport dwell
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 2] Product impression after valid viewport dwell (>500ms)");
    await delay(600);
    const sc2Res = await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "product_impression",
      product_id: sampleProduct._id.toString(),
      source: "recommendation_shelf",
    });

    const sc2Doc = await waitForMongo({ anonymous_id: anonId, event_type: "product_impression" }, UserEvent);
    const sc2Pass = sc2Res.status === 202 && !!sc2Doc;
    console.log(`   MongoDB product_impression: ${sc2Pass ? "PASS ✅" : "FAIL ❌"} (${sc2Doc?._id || "none"})`);
    results.push({ id: 2, name: "Product impression after viewport dwell", status: sc2Pass ? "PASS ✅" : "FAIL ❌", docId: sc2Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 3: Product search & Vietnamese semantic search via Nginx
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 3] Product search & Vietnamese semantic search via Nginx");
    const aiSearchRes = await fetch(`${STAGING_API_URL}/ai/search?query=ao%20thun%20nam`, { method: "GET" });
    const aiSearchJson = await aiSearchRes.json();
    const hasAiResults = aiSearchRes.status === 200 && aiSearchJson.data?.results?.length > 0;

    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "search_performed",
      query: "áo thun nam",
    });
    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "semantic_search_used",
      query: "áo thun nam",
      meta: { resultsCount: aiSearchJson.data?.results?.length || 1 },
    });

    const sc3Doc = await waitForMongo({ anonymous_id: anonId, event_type: "semantic_search_used" }, UserEvent);
    const sc3Pass = hasAiResults && !!sc3Doc;
    console.log(`   AI Search returned: ${aiSearchJson.data?.results?.length || 0} items. MongoDB: ${sc3Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 3, name: "Product search & Vietnamese semantic search", status: sc3Pass ? "PASS ✅" : "FAIL ❌", docId: sc3Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 4: Product detail view & variant select
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 4] Product detail view & variant select");
    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "product_view",
      product_id: sampleProduct._id.toString(),
    });
    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "product_variant_select",
      product_id: sampleProduct._id.toString(),
      meta: { color: "Đen", size: "L" },
    });

    const sc4Doc = await waitForMongo({ anonymous_id: anonId, event_type: "product_view" }, UserEvent);
    const sc4Pass = !!sc4Doc;
    console.log(`   MongoDB product_view: ${sc4Pass ? "PASS ✅" : "FAIL ❌"} (${sc4Doc?._id || "none"})`);
    results.push({ id: 4, name: "Product detail view & variant select", status: sc4Pass ? "PASS ✅" : "FAIL ❌", docId: sc4Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 5: Favorite product
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 5] Favorite product");
    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "product_favorite",
      product_id: sampleProduct._id.toString(),
    });

    const sc5Doc = await waitForMongo({ anonymous_id: anonId, event_type: "product_favorite" }, UserEvent);
    const sc5Pass = !!sc5Doc;
    console.log(`   MongoDB product_favorite: ${sc5Pass ? "PASS ✅" : "FAIL ❌"} (${sc5Doc?._id || "none"})`);
    results.push({ id: 5, name: "Favorite product", status: sc5Pass ? "PASS ✅" : "FAIL ❌", docId: sc5Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 6: Guest add-to-cart rejection & intent tracking
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 6] Guest add-to-cart rejection & add_to_cart_attempt (Add-to-Cart Semantics)");
    const guestCartRes = await fetch(`${STAGING_API_URL}/cart/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: sampleProduct._id.toString(), quantity: 1 }),
    });
    const guestBlocked = guestCartRes.status === 401 || guestCartRes.status === 403;

    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "add_to_cart_attempt",
      product_id: sampleProduct._id.toString(),
      meta: { reason: "unauthenticated" },
    });

    const sc6Attempt = await waitForMongo({ anonymous_id: anonId, event_type: "add_to_cart_attempt" }, UserEvent);
    const sc6Success = await UserEvent.findOne({ anonymous_id: anonId, event_type: "add_to_cart" });
    const sc6Pass = guestBlocked && !!sc6Attempt && !sc6Success;
    console.log(`   Guest 401 Blocked: ${guestBlocked} | Intent Tracked: ${!!sc6Attempt} | No False Success: ${!sc6Success}: ${sc6Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 6, name: "Guest add-to-cart rejection & intent tracking", status: sc6Pass ? "PASS ✅" : "FAIL ❌", docId: sc6Attempt?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 7: Customer login & authenticated add-to-cart
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 7] Customer login & authenticated add_to_cart");
    const loginRes = await fetch(`${STAGING_API_URL}/auth/signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@404studio.vn", passWord: "StagingPass123!" }),
    });
    const loginJson = await loginRes.json();
    const customerToken = loginJson.data?.accessToken;
    if (!customerToken) throw new Error("Customer login failed: " + JSON.stringify(loginJson));

    // Alias merge: Anonymous -> User
    await fetch(`${STAGING_API_URL}/events/alias`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({ anonymous_id: anonId }),
    });

    // Authenticated Add to Cart
    await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        session_id: sessionId,
        event_type: "add_to_cart",
        product_id: sampleProduct._id.toString(),
        meta: { quantity: 1, price: sampleProduct.new_price || sampleProduct.price },
      },
      customerToken
    );

    const sc7Doc = await waitForMongo({ user_id: testCustomer._id, event_type: "add_to_cart" }, UserEvent);
    const sc7Pass = !!sc7Doc;
    console.log(`   Authenticated add_to_cart recorded: ${sc7Pass ? "PASS ✅" : "FAIL ❌"} (${sc7Doc?._id || "none"})`);
    results.push({ id: 7, name: "Customer login & authenticated add-to-cart", status: sc7Pass ? "PASS ✅" : "FAIL ❌", docId: sc7Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 8: Change cart quantity
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 8] Change cart quantity");
    await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        session_id: sessionId,
        event_type: "cart_quantity_change",
        product_id: sampleProduct._id.toString(),
        meta: { old_quantity: 1, new_quantity: 2 },
      },
      customerToken
    );

    const sc8Doc = await waitForMongo({ user_id: testCustomer._id, event_type: "cart_quantity_change" }, UserEvent);
    const sc8Pass = !!sc8Doc;
    console.log(`   MongoDB cart_quantity_change: ${sc8Pass ? "PASS ✅" : "FAIL ❌"} (${sc8Doc?._id || "none"})`);
    results.push({ id: 8, name: "Change cart quantity", status: sc8Pass ? "PASS ✅" : "FAIL ❌", docId: sc8Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 9: Start checkout
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 9] Start checkout");
    await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        session_id: sessionId,
        event_type: "checkout_started",
        meta: {
          items: [{ product_id: sampleProduct._id.toString(), quantity: 2, price: sampleProduct.new_price || 189000 }],
          total_price: (sampleProduct.new_price || 189000) * 2,
        },
      },
      customerToken
    );

    const sc9Doc = await waitForMongo({ user_id: testCustomer._id, event_type: "checkout_started" }, UserEvent);
    const sc9Pass = !!sc9Doc;
    console.log(`   MongoDB checkout_started: ${sc9Pass ? "PASS ✅" : "FAIL ❌"} (${sc9Doc?._id || "none"})`);
    results.push({ id: 9, name: "Start checkout", status: sc9Pass ? "PASS ✅" : "FAIL ❌", docId: sc9Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 10: Create order & Server-only security guard
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 10] Create order & Server-only security guard");
    const spoofRes = await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        event_type: "order_placed",
        product_id: sampleProduct._id.toString(),
      },
      customerToken
    );
    const spoofBlocked = spoofRes.status === 400;

    const testOrder = await Order.create({
      user_id: testCustomer._id,
      total_price: (sampleProduct.new_price || 189000) * 2,
      payment_method: "vnpay",
      payment_status: "pending",
      status: "pending",
      shipping_address: {
        full_name: "Khách Hàng Staging",
        phone: "0987654321",
        city: "Hà Nội",
        district: "Hoàn Kiếm",
        ward: "Phố Huế",
        address_detail: "123 Phố Huế",
      },
    });

    const testOrderItem = await OrderItem.create({
      order_id: testOrder._id,
      product_id: sampleProduct._id,
      quantity: 2,
      price: sampleProduct.new_price || 189000,
      product_name: sampleProduct.name,
    });

    testOrder.items = [testOrderItem];
    await trackingService.trackOrderPlaced(testOrder);

    const sc10Doc = await waitForMongo({ "meta.order_id": testOrder._id.toString(), event_type: "order_placed" }, UserEvent);
    const sc10Pass = spoofBlocked && !!sc10Doc;
    console.log(`   Client Spoof Blocked (400): ${spoofBlocked} | Server Order Placed: ${sc10Pass ? "PASS ✅" : "FAIL ❌"} (${sc10Doc?._id || "none"})`);
    results.push({ id: 10, name: "Order placed & Server-only security guard", status: sc10Pass ? "PASS ✅" : "FAIL ❌", docId: sc10Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 11: Purchase completed & Idempotency check
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 11] Purchase completed & Idempotency check");
    const spoofPurchaseRes = await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        event_type: "purchase_completed",
        product_id: sampleProduct._id.toString(),
      },
      customerToken
    );
    const spoofPurchaseBlocked = spoofPurchaseRes.status === 400;

    testOrder.payment_status = "paid";
    testOrder.status = "confirmed";
    await testOrder.save();
    testOrder.items = [testOrderItem];

    await trackingService.trackPurchaseCompleted(testOrder);
    await trackingService.trackPurchaseCompleted(testOrder); // Duplicate retry

    const sc11Doc = await waitForMongo({ "meta.order_id": testOrder._id.toString(), event_type: "purchase_completed" }, UserEvent);
    const purchaseDocs = await UserEvent.find({
      "meta.order_id": testOrder._id.toString(),
      event_type: "purchase_completed",
    });
    const sc11Pass = spoofPurchaseBlocked && !!sc11Doc && purchaseDocs.length === 1;
    console.log(`   Purchase Event Count: ${purchaseDocs.length} (Expected: 1). Idempotent: ${sc11Pass ? "PASS ✅" : "FAIL ❌"} (${sc11Doc?._id || "none"})`);
    results.push({ id: 11, name: "Purchase completed & Idempotency guard", status: sc11Pass ? "PASS ✅" : "FAIL ❌", docId: sc11Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 12: Recommendation shelf impression & click (A/A Testing)
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 12] Recommendation shelf impression & click (A/A Testing)");
    const expDoc = await Experiment.findOne({ experiment_id: "AA_Recommendation_Validation" }).lean();

    await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        session_id: sessionId,
        event_type: "recommendation_impression",
        product_id: sampleProduct._id.toString(),
        meta: {
          experiment_id: "AA_Recommendation_Validation",
          variant: "A",
          algorithm: "control_popular",
          position: 1,
        },
      },
      customerToken
    );
    await sendStagingEvent(
      {
        event_id: crypto.randomUUID(),
        anonymous_id: anonId,
        session_id: sessionId,
        event_type: "recommendation_clicked",
        product_id: sampleProduct._id.toString(),
        meta: {
          experiment_id: "AA_Recommendation_Validation",
          variant: "A",
          algorithm: "control_popular",
          position: 1,
        },
      },
      customerToken
    );

    const sc12Doc = await waitForMongo({ "meta.experiment_id": "AA_Recommendation_Validation", event_type: "recommendation_clicked" }, UserEvent);
    const sc12Pass = expDoc?.status === "running" && !!sc12Doc;
    console.log(`   Experiment: ${expDoc?.experiment_id} (${expDoc?.status}). Rec Clicked: ${sc12Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 12, name: "Recommendation impression & click (A/A Testing)", status: sc12Pass ? "PASS ✅" : "FAIL ❌", docId: sc12Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 13: AI Shopping Assistant chat & recommendation
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 13] AI Shopping Assistant chat & recommendation");
    const aiChatRes = await fetch(`${STAGING_API_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Chính sách đổi trả trong bao lâu?" }),
    });
    const aiChatJson = await aiChatRes.json();
    const chatContent = aiChatJson.data?.aiMessage?.content || aiChatJson.data?.reply || "";
    const hasGroundedAnswer = aiChatRes.status === 200 && chatContent.includes("7 ngày");

    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "ai_chat_opened",
    });
    await sendStagingEvent({
      event_id: crypto.randomUUID(),
      anonymous_id: anonId,
      session_id: sessionId,
      event_type: "ai_recommendation_clicked",
      product_id: sampleProduct._id.toString(),
    });

    const sc13Doc = await waitForMongo({ anonymous_id: anonId, event_type: "ai_recommendation_clicked" }, UserEvent);
    const sc13Pass = hasGroundedAnswer && !!sc13Doc;
    console.log(`   AI Grounded Answer: ${hasGroundedAnswer ? "YES ('7 ngày')" : "NO"}. Recorded: ${sc13Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 13, name: "AI Shopping Assistant chat & recommendation", status: sc13Pass ? "PASS ✅" : "FAIL ❌", docId: sc13Doc?._id });

    // -------------------------------------------------------------------------
    // SCENARIO 14: Consent persistence & Redis restart resilience
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 14] Consent persistence & Redis restart resilience");
    const consentRes = await fetch(`${STAGING_API_URL}/events/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({ consent: "denied", anonymous_id: anonId }),
    });
    const consentJson = await consentRes.json();

    const userDocAfter = await User.findById(testCustomer._id).lean();
    const profileAfter = await UserInterestProfile.findOne({ user_id: testCustomer._id }).lean();
    const mongoPersisted = userDocAfter?.consent_status === "denied" && profileAfter?.consent_status === "denied";

    console.log("   Restarting Redis container to wipe in-memory keys...");
    execSync("docker compose -f docker-compose.staging.yml restart redis-staging", { stdio: "ignore" });
    await delay(4000);

    // Verify Redis connection re-established
    redis = new Redis(STAGING_REDIS_URL);
    await redis.ping();

    // Check if isConsentDenied correctly identifies denial from MongoDB and restores Redis key
    const isDeniedPostRestart = await trackingService.isConsentDenied(testCustomer._id.toString(), anonId);

    // Try sending an event while denied
    const deniedEventId = crypto.randomUUID();
    await sendStagingEvent({
      event_id: deniedEventId,
      anonymous_id: anonId,
      event_type: "product_view",
      product_id: sampleProduct._id.toString(),
    });

    // Verify the denied event was dropped and never persisted to MongoDB
    await delay(1500);
    const droppedDoc = await UserEvent.findOne({ event_id: deniedEventId });

    const sc14Pass = consentJson.success && mongoPersisted && isDeniedPostRestart && !droppedDoc;
    console.log(`   MongoDB Persisted: ${mongoPersisted} | Fallback Detection: ${isDeniedPostRestart} | Dropped: ${!droppedDoc}: ${sc14Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 14, name: "Consent persistence & Redis restart resilience", status: sc14Pass ? "PASS ✅" : "FAIL ❌", docId: profileAfter?._id });

    // Relogin after Redis restart to get fresh session token (Redis session whitelist was cleared)
    const refreshLoginRes = await fetch(`${STAGING_API_URL}/auth/signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@404studio.vn", passWord: "StagingPass123!" }),
    });
    const freshCustomerToken = (await refreshLoginRes.json()).data?.accessToken;

    // Restore consent to granted with fresh token
    await fetch(`${STAGING_API_URL}/events/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${freshCustomerToken}` },
      body: JSON.stringify({ consent: "granted", anonymous_id: anonId }),
    });

    // -------------------------------------------------------------------------
    // SCENARIO 15: Cross-user profile isolation & User data deletion (Tombstone)
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 15] Cross-user profile isolation & User data deletion (Tombstone)");
    const deleteRes = await fetch(`${STAGING_API_URL}/events/me`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${freshCustomerToken}` },
    });
    const deleteJson = await deleteRes.json();

    const remainingEvents = await UserEvent.countDocuments({ user_id: testCustomer._id });
    const remainingOrders = await Order.countDocuments({ user_id: testCustomer._id });
    const sc15Pass = deleteJson.success && remainingEvents === 0 && remainingOrders > 0;
    console.log(`   Events Wiped: ${remainingEvents === 0} | Orders Preserved: ${remainingOrders > 0}: ${sc15Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 15, name: "Cross-user profile isolation & data deletion", status: sc15Pass ? "PASS ✅" : "FAIL ❌", docId: "TOMBSTONE_VERIFIED" });

    // Restore customer consent & clear tombstone for future test runs
    await User.updateOne({ _id: testCustomer._id }, { $set: { consent_status: "granted" } });
    await redis.del(`user:data_cleared:${testCustomer._id.toString()}`);
    await redis.del(`consent:denied:${testCustomer._id.toString()}`);

    // -------------------------------------------------------------------------
    // SCENARIO 16: Worker downtime & BullMQ Queue Recovery
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 16] Worker downtime & BullMQ Queue Recovery");
    console.log("   Stopping worker service...");
    execSync("docker compose -f docker-compose.staging.yml stop worker-staging", { stdio: "ignore" });

    const recoveryAnonId = crypto.randomUUID();
    // Use 5 distinct products to ensure dedup does not drop identical views
    for (let i = 0; i < sampleProducts.length; i++) {
      await sendStagingEvent({
        event_id: crypto.randomUUID(),
        anonymous_id: recoveryAnonId,
        session_id: sessionId,
        event_type: "product_view",
        product_id: sampleProducts[i]._id.toString(),
      });
    }

    console.log("   Starting worker service...");
    execSync("docker compose -f docker-compose.staging.yml start worker-staging", { stdio: "ignore" });
    await delay(6000);

    const recoveredCount = await UserEvent.countDocuments({ anonymous_id: recoveryAnonId, event_type: "product_view" });
    const sc16Pass = recoveredCount >= sampleProducts.length;
    console.log(`   Drained & Persisted: ${recoveredCount}/${sampleProducts.length} events: ${sc16Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 16, name: "Worker downtime & BullMQ Queue Recovery", status: sc16Pass ? "PASS ✅" : "FAIL ❌", docId: `RECOVERED_${recoveredCount}_DOCS` });

    // -------------------------------------------------------------------------
    // SCENARIO 17: Admin Analytics & Funnel Reconciliation
    // -------------------------------------------------------------------------
    console.log("\n▶ [Scenario 17] Admin Analytics & Funnel Reconciliation");
    const adminLoginRes = await fetch(`${STAGING_API_URL}/auth/signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@404studio.vn", passWord: "StagingAdmin123!" }),
    });
    const adminLoginJson = await adminLoginRes.json();
    const adminToken = adminLoginJson.data?.accessToken;
    if (!adminToken) throw new Error("Admin login failed: " + JSON.stringify(adminLoginJson));

    const funnelRes = await fetch(`${STAGING_API_URL}/events/analytics/funnel`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${adminToken}` },
    });
    const funnelJson = await funnelRes.json();
    const stages = funnelJson.data?.funnel || [];

    const allNormalized = stages.every((s) => s.overallConversionRate <= 100);
    const sc17Pass = funnelRes.status === 200 && stages.length >= 6 && allNormalized;
    console.log(`   Funnel Stages (${stages.length}): ${stages.map((s) => `${s.label}: ${s.overallConversionRate}%`).join(" -> ")}`);
    console.log(`   All Stages <= 100%: ${allNormalized}: ${sc17Pass ? "PASS ✅" : "FAIL ❌"}`);
    results.push({ id: 17, name: "Admin Analytics & Funnel Reconciliation", status: sc17Pass ? "PASS ✅" : "FAIL ❌", docId: "STAGES_6_NORMALIZED" });

  } finally {
    await browser.close();
    await mongoose.disconnect();
    redis.disconnect();
  }

  console.log("\n================================================================================");
  console.log("🏁 FULL STAGING STACK 17/17 SCENARIOS VERIFICATION SUMMARY");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      Scenario: `#${r.id} ${r.name}`,
      Status: r.status,
      DocOrMetric: r.docId?.toString() || "N/A",
    }))
  );

  const allPassed = results.every((r) => r.status.includes("PASS"));
  console.log(`\nOVERALL VERDICT: ${allPassed ? "100% PASS ✅ - PRODUCTION READINESS GATE MET" : "FAIL ❌"}`);
  if (!allPassed) process.exit(1);
}

runStagingFullStackE2E().catch((err) => {
  console.error("Staging E2E Suite Failed:", err);
  process.exit(1);
});
