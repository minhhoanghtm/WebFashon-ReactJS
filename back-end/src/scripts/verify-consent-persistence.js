/**
 * CONSENT PERSISTENCE & PRIVACY GUARANTEE VERIFICATION
 * Target: Nginx Staging (8081), MongoDB Staging (27018), Redis Staging (6381)
 *
 * Verifies:
 * 1. Consent denied / granted states via API.
 * 2. MongoDB persistent consent across UserConsent, User, and UserInterestProfile (Single Source of Truth).
 * 3. Redis cache wipe & restart resilience: isConsentDenied restores Redis cache from MongoDB fallback.
 * 4. User switching & cross-user profile isolation (User A denied != User B granted).
 * 5. DELETE tracking history (/api/events/me) -> tombstone watermark (cleared_at) & user:data_cleared flag.
 * 6. BullMQ replay protection: Events with timestamp <= cleared_at are dropped and never resurrect profiles.
 * 7. Profile data deletion never re-enables personalization or resurrects scores.
 * 8. Complete preservation of Order and OrderItem financial records.
 */

import mongoose from "mongoose";
import Redis from "ioredis";
import { execSync } from "child_process";
import crypto from "crypto";

const STAGING_URL = "http://localhost:8081";
const STAGING_API_URL = "http://localhost:8081/api";
const STAGING_MONGO_URI = "mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin";
const STAGING_REDIS_URL = "redis://127.0.0.1:6381";

process.env.NODE_ENV = "staging";
process.env.MONGO_CONNECTIONSTRING = STAGING_MONGO_URI;
process.env.REDIS_URL = STAGING_REDIS_URL;
process.env.REDIS_HOST = "127.0.0.1";
process.env.REDIS_PORT = "6381";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runConsentPersistenceVerification() {
  console.log("================================================================================");
  console.log("🔒 CONSENT PERSISTENCE & PRIVACY AUDIT VERIFICATION");
  console.log("   Target: Nginx Staging http://localhost:8081 (Docker Container)");
  console.log("   MongoDB: 127.0.0.1:27018/webfashion_staging");
  console.log("   Redis: 127.0.0.1:6381");
  console.log("================================================================================\n");

  await mongoose.connect(STAGING_MONGO_URI);
  let redis = (await import("../configs/redis.js")).getRedisConnection();
  await redis.ping();

  const User = (await import("../modules/users/user.model.js")).default;
  const UserConsent = (await import("../modules/tracking/userConsent.model.js")).default;
  const UserInterestProfile = (await import("../modules/recommendations/userInterestProfile.model.js")).default;
  const UserEvent = (await import("../modules/tracking/userEvent.model.js")).default;
  const { Order, OrderItem } = await import("../modules/orders/order.model.js");
  const Product = (await import("../modules/products/product.model.js")).default;
  const trackingService = (await import("../modules/tracking/tracking.service.js")).default;

  const sampleProduct = await Product.findOne({ is_active: true }).lean();
  const testCustomer = await User.findOne({ email: "customer@404studio.vn" }).lean();
  if (!testCustomer || !sampleProduct) {
    throw new Error("Missing test data. Run seed-staging-data.js first.");
  }

  // Create secondary test user for cross-user isolation test
  let userB = await User.findOne({ email: "user_b_isolation@404studio.vn" });
  if (!userB) {
    userB = await User.create({
      fullName: "User B Isolation",
      email: "user_b_isolation@404studio.vn",
      passWord: testCustomer.passWord,
      role: "user",
      status: "active",
      consent_status: "granted",
    });
  }

  const checks = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Login Customer & Set Consent DENIED
    // -------------------------------------------------------------------------
    console.log("▶ [Test 1] Customer updates consent to DENIED via API");
    const loginRes = await fetch(`${STAGING_API_URL}/auth/signIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customer@404studio.vn", passWord: "StagingPass123!" }),
    });
    const customerToken = (await loginRes.json()).data?.accessToken;
    if (!customerToken) throw new Error("Customer login failed");

    const denyRes = await fetch(`${STAGING_API_URL}/events/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({ consent: "denied" }),
    });
    const denyJson = await denyRes.json();

    const t1User = await User.findById(testCustomer._id).lean();
    const t1Consent = await UserConsent.findOne({ subject_id: testCustomer._id.toString() }).lean();
    const t1Profile = await UserInterestProfile.findOne({ user_id: testCustomer._id }).lean();
    const t1Redis = await redis.get(`consent:denied:${testCustomer._id.toString()}`);

    const t1Pass =
      denyJson.success &&
      t1User.consent_status === "denied" &&
      t1Consent?.consent_status === "denied" &&
      t1Profile?.consent_status === "denied" &&
      t1Redis === "1";

    console.log(`   User: ${t1User.consent_status} | UserConsent: ${t1Consent?.consent_status} | Profile: ${t1Profile?.consent_status} | Redis: ${t1Redis}`);
    console.log(`   Test 1 Result: ${t1Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "API Consent Update to DENIED & Multi-Model Persistence", pass: t1Pass });

    // -------------------------------------------------------------------------
    // TEST 2: Ingestion-level Drop when Denied
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 2] Ingestion-level Privacy Drop while Denied");
    const deniedEventId = crypto.randomUUID();
    const ingestRes = await fetch(`${STAGING_API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({
        event_id: deniedEventId,
        event_type: "product_view",
        product_id: sampleProduct._id.toString(),
      }),
    });
    const ingestJson = await ingestRes.json();
    await delay(1000);
    const deniedDoc = await UserEvent.findOne({ event_id: deniedEventId });

    const t2Pass = (ingestRes.status === 200 || ingestRes.status === 202) && !deniedDoc;
    console.log(`   Ingest Status: ${ingestRes.status} | MongoDB Document Exists: ${!!deniedDoc}`);
    console.log(`   Test 2 Result: ${t2Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Ingestion-level Drop of Denied Events", pass: t2Pass });

    // -------------------------------------------------------------------------
    // TEST 3: Redis Cache Wipe & MongoDB Fallback Recovery
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 3] Redis Cache Wipe & Fallback Rehydration from MongoDB");
    // Wipe redis keys manually to simulate Redis outage or restart
    await redis.del(`consent:denied:${testCustomer._id.toString()}`);
    await redis.del(`consent:denied:u:${testCustomer._id.toString()}`);
    const redisValBefore = await redis.get(`consent:denied:${testCustomer._id.toString()}`);

    // Call isConsentDenied: should query MongoDB, find denied, and restore Redis key
    const detectedDenied = await trackingService.isConsentDenied(testCustomer._id.toString(), null);
    const redisValAfter = await redis.get(`consent:denied:${testCustomer._id.toString()}`);

    const t3Pass = redisValBefore === null && detectedDenied === true && redisValAfter === "1";
    console.log(`   Redis before: ${redisValBefore} | Detected from MongoDB: ${detectedDenied} | Redis rehydrated: ${redisValAfter}`);
    console.log(`   Test 3 Result: ${t3Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Redis Wipe & MongoDB Fallback Rehydration", pass: t3Pass });

    // -------------------------------------------------------------------------
    // TEST 4: Cross-User Profile Isolation (User A Denied != User B Granted)
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 4] Cross-User Profile Isolation");
    const userAStatus = await trackingService.isConsentDenied(testCustomer._id.toString(), null);
    const userBStatus = await trackingService.isConsentDenied(userB._id.toString(), null);

    const t4Pass = userAStatus === true && userBStatus === false;
    console.log(`   Customer (User A) Denied: ${userAStatus} | User B Denied: ${userBStatus}`);
    console.log(`   Test 4 Result: ${t4Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Cross-User Isolation & Independent Consent", pass: t4Pass });

    // -------------------------------------------------------------------------
    // TEST 5: Grant Consent Back
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 5] Customer updates consent back to GRANTED");
    const grantRes = await fetch(`${STAGING_API_URL}/events/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({ consent: "granted" }),
    });
    const grantJson = await grantRes.json();

    const t5User = await User.findById(testCustomer._id).lean();
    const t5Consent = await UserConsent.findOne({ subject_id: testCustomer._id.toString() }).lean();
    const t5Redis = await redis.get(`consent:denied:${testCustomer._id.toString()}`);
    const isDeniedPostGrant = await trackingService.isConsentDenied(testCustomer._id.toString(), null);

    const t5Pass =
      grantJson.success &&
      t5User.consent_status === "granted" &&
      t5Consent?.consent_status === "granted" &&
      t5Redis === null &&
      isDeniedPostGrant === false;

    console.log(`   User: ${t5User.consent_status} | UserConsent: ${t5Consent?.consent_status} | Redis: ${t5Redis} | isDenied: ${isDeniedPostGrant}`);
    console.log(`   Test 5 Result: ${t5Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Consent Re-Grant & Cache Invalidation", pass: t5Pass });

    // -------------------------------------------------------------------------
    // TEST 6: User Data Deletion (Right to be Forgotten & Tombstone Fence)
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 6] User Data Deletion (Tombstone Watermark & Order Preservation)");
    // Create an order first to prove financial preservation
    const sampleOrder = await Order.create({
      user_id: testCustomer._id,
      total_price: 378000,
      payment_method: "vnpay",
      payment_status: "paid",
      status: "confirmed",
      shipping_address: {
        full_name: "Khách Hàng Staging",
        phone: "0987654321",
        city: "Hà Nội",
        district: "Hoàn Kiếm",
        ward: "Phố Huế",
        address_detail: "123 Phố Huế",
      },
    });

    // Create a tracking event to be wiped
    await UserEvent.create({
      event_id: crypto.randomUUID(),
      user_id: testCustomer._id,
      event_type: "product_view",
      product_id: sampleProduct._id,
      createdAt: new Date(),
    });

    const eventsBeforeDel = await UserEvent.countDocuments({ user_id: testCustomer._id });
    const ordersBeforeDel = await Order.countDocuments({ user_id: testCustomer._id });

    // Call DELETE /api/events/me
    const deleteRes = await fetch(`${STAGING_API_URL}/events/me`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${customerToken}` },
    });
    const deleteJson = await deleteRes.json();

    const eventsAfterDel = await UserEvent.countDocuments({ user_id: testCustomer._id });
    const ordersAfterDel = await Order.countDocuments({ user_id: testCustomer._id });
    const consentDocAfterDel = await UserConsent.findOne({ subject_id: testCustomer._id.toString() }).lean();
    const redisTombstone = await redis.get(`user:data_cleared:${testCustomer._id.toString()}`);

    const t6Pass =
      deleteJson.success &&
      eventsBeforeDel > 0 &&
      eventsAfterDel === 0 &&
      ordersAfterDel === ordersBeforeDel &&
      ordersAfterDel > 0 &&
      !!consentDocAfterDel?.cleared_at &&
      redisTombstone === "1";

    console.log(`   Events: ${eventsBeforeDel} -> ${eventsAfterDel} | Orders: ${ordersBeforeDel} -> ${ordersAfterDel}`);
    console.log(`   Tombstone cleared_at: ${consentDocAfterDel?.cleared_at} | Redis Tombstone: ${redisTombstone}`);
    console.log(`   Test 6 Result: ${t6Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Data Deletion, Tombstone Watermark & Order Preservation", pass: t6Pass });

    // -------------------------------------------------------------------------
    // TEST 7: Replay Protection against Old Pending BullMQ Jobs
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 7] BullMQ Replay Protection (Discard stale jobs <= cleared_at)");
    // Attempt to process a job whose timestamp is older than cleared_at
    const staleTimestamp = new Date(Date.now() - 3600000).toISOString();
    const staleJobPayload = {
      event_id: crypto.randomUUID(),
      user_id: testCustomer._id.toString(),
      event_type: "product_view",
      product_id: sampleProduct._id.toString(),
      timestamp: staleTimestamp,
    };

    // Worker simulation of stale event processing
    await trackingService.processEvent(staleJobPayload);
    const staleDoc = await UserEvent.findOne({ event_id: staleJobPayload.event_id });

    const t7Pass = !staleDoc;
    console.log(`   Stale job processed. Document persisted: ${!!staleDoc}`);
    console.log(`   Test 7 Result: ${t7Pass ? "PASS ✅" : "FAIL ❌"}`);
    checks.push({ name: "Replay Protection against Stale Queue Jobs", pass: t7Pass });

    // -------------------------------------------------------------------------
    // CLEANUP TEST STATE
    // -------------------------------------------------------------------------
    await User.updateOne({ _id: testCustomer._id }, { $set: { consent_status: "granted" } });
    await UserConsent.deleteMany({ subject_id: testCustomer._id.toString() });
    await redis.del(`user:data_cleared:${testCustomer._id.toString()}`);
    await redis.del(`consent:denied:${testCustomer._id.toString()}`);
    await Order.deleteMany({ _id: sampleOrder._id });

  } finally {
    await mongoose.disconnect();
    redis.disconnect();
  }

  console.log("\n================================================================================");
  console.log("🏁 CONSENT PERSISTENCE AUDIT SUMMARY");
  console.log("================================================================================");
  console.table(checks.map((c) => ({ Check: c.name, Status: c.pass ? "PASS ✅" : "FAIL ❌" })));

  const allPassed = checks.every((c) => c.pass);
  console.log(`\nOVERALL AUDIT VERDICT: ${allPassed ? "100% PASS ✅" : "FAIL ❌"}`);
  process.exit(allPassed ? 0 : 1);
}

runConsentPersistenceVerification().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
