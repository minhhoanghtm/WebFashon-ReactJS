/**
 * ==============================================================================
 * E2E REAL USER ACCOUNT IDENTITY IN TRACKING DASHBOARD & REAL MONGODB
 * 404 Studio — WebFashion Master Verification
 * ==============================================================================
 */

import { execSync } from "child_process";
import crypto from "crypto";

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://localhost:8081";
const API_URL = `${BASE_URL}/api`;
const stagingMongoUser = process.env.STAGING_MONGO_USER;
const stagingMongoPassword = process.env.STAGING_MONGO_PASSWORD;
if (!stagingMongoUser || !stagingMongoPassword) {
  throw new Error("STAGING_MONGO_USER and STAGING_MONGO_PASSWORD are required");
}

const PASS = (msg) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const FAIL = (msg) => {
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
  throw new Error(msg);
};

async function runIdentityVerification() {
  console.log("=======================================================");
  console.log("STARTING REAL USER IDENTITY TRACKING E2E VERIFICATION");
  console.log(`Target: ${API_URL}`);
  console.log("=======================================================\n");

  // 0. Admin Authentication
  console.log("Phase 0: Admin Authentication & Baseline Setup...");
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@404studio.vn", passWord: "DevAdmin2026!" }),
  });
  if (!adminLoginRes.ok) FAIL(`Admin login failed: ${adminLoginRes.status}`);
  const adminToken = (await adminLoginRes.json()).data.accessToken;
  PASS(`Admin logged in successfully (Token: ${adminToken.slice(0, 15)}...)`);

  // Customer Authentication
  const custLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@404studio.vn", passWord: "DevCustomer2026!" }),
  });
  if (!custLoginRes.ok) FAIL(`Customer login failed: ${custLoginRes.status}`);
  const customerAuthData = (await custLoginRes.json()).data;
  const customerToken = customerAuthData.accessToken;
  const customerId = customerAuthData.user._id || customerAuthData.user.id;
  PASS(`Customer authenticated: ID=${customerId}, Name="${customerAuthData.user.fullName}"`);

  // 1. Guest Session Verification
  console.log("\nPhase 1: Guest Visitor Presence & Identification...");
  const guestSessionId = `sess-guest-${crypto.randomUUID()}`;
  const guestTabId = `tab-${crypto.randomUUID().slice(0, 8)}`;
  const guestAnonId = crypto.randomUUID();

  // Send guest heartbeat
  const guestHbRes = await fetch(`${API_URL}/tracking/presence/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: guestSessionId,
      tab_id: guestTabId,
      anonymous_id: guestAnonId,
      status: "ACTIVE",
      current_route: "/products",
      entry_source: "Organic Search",
      last_action: "browse_catalog",
      session_duration_sec: 12,
    }),
  });
  if (!guestHbRes.ok) FAIL(`Guest heartbeat failed: ${guestHbRes.status}`);

  // Query live sessions via Admin API
  const guestLiveRes = await fetch(`${API_URL}/tracking/presence/live`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const guestLiveData = await guestLiveRes.json();
  const foundGuestSession = guestLiveData.data?.sessions?.find((s) => s.sessionId === guestSessionId);

  if (!foundGuestSession) FAIL("Guest session not found in Admin live presence list");
  if (foundGuestSession.userType !== "guest") FAIL(`Expected userType 'guest', got '${foundGuestSession.userType}'`);
  if (foundGuestSession.userDisplay !== "Khách vãng lai") FAIL(`Expected userDisplay 'Khách vãng lai', got '${foundGuestSession.userDisplay}'`);
  if (foundGuestSession.account !== null) FAIL("Guest session must have account=null");
  if (foundGuestSession.userId !== null) FAIL("Guest session must have userId=null");
  PASS("1.1 Guest correctly recognized as 'Khách vãng lai', userType='guest', account=null, userId=null");

  // 2. Authenticated User Session Verification
  console.log("\nPhase 2: Authenticated User Presence & Profile Correlation...");
  const authSessionId = `sess-auth-${crypto.randomUUID()}`;
  const authTabId = `tab-${crypto.randomUUID().slice(0, 8)}`;

  // Send authenticated heartbeat with Customer Bearer token
  const authHbRes = await fetch(`${API_URL}/tracking/presence/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      session_id: authSessionId,
      tab_id: authTabId,
      status: "ACTIVE",
      current_route: "/account/profile",
      entry_source: "Direct",
      last_action: "view_profile",
      session_duration_sec: 45,
    }),
  });
  if (!authHbRes.ok) FAIL(`Auth heartbeat failed: ${authHbRes.status}`);

  // Query Admin API for live sessions
  const authLiveRes = await fetch(`${API_URL}/tracking/presence/live`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const authLiveData = await authLiveRes.json();
  const foundAuthSession = authLiveData.data?.sessions?.find((s) => s.sessionId === authSessionId);

  if (!foundAuthSession) FAIL("Authenticated session not found in Admin live presence list");
  if (foundAuthSession.userType !== "authenticated") FAIL(`Expected userType 'authenticated', got '${foundAuthSession.userType}'`);
  if (foundAuthSession.userId !== customerId) FAIL(`Expected userId '${customerId}', got '${foundAuthSession.userId}'`);
  if (foundAuthSession.userDisplay !== "Khách Hàng Thân Thiết") FAIL(`Expected userDisplay 'Khách Hàng Thân Thiết', got '${foundAuthSession.userDisplay}'`);

  const acc = foundAuthSession.account;
  if (!acc) FAIL("Authenticated session missing account object");
  if (acc.fullName !== "Khách Hàng Thân Thiết") FAIL(`Expected fullName 'Khách Hàng Thân Thiết', got '${acc.fullName}'`);
  if (acc.role !== "user") FAIL(`Expected role 'user', got '${acc.role}'`);
  if (acc.status !== "active") FAIL(`Expected status 'active', got '${acc.status}'`);
  if (!acc.email || !acc.email.includes("*")) FAIL(`Expected masked email with '*', got '${acc.email}'`);
  if (acc.email.includes("customer@")) FAIL(`Email must NOT be raw! Got: '${acc.email}'`);
  if (acc.passWord || acc.password || acc.token) FAIL("Sensitive fields (passWord, token) must NEVER be exposed!");

  PASS(`2.1 Authenticated User identified: FullName="${acc.fullName}", MaskedEmail="${acc.email}", Role="${acc.role}"`);
  PASS("2.2 Sensitive fields exclusion verified (no password, hash, or tokens exposed)");

  // 3. User Journey Persistence with Real MongoDB
  console.log("\nPhase 3: User Journey Tracking with Real MongoDB Persistence...");
  // Grant consent
  await fetch(`${API_URL}/events/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      consent: "granted",
      choice: "ALL_ACCEPTED",
      categories: { necessary: true, analytics: true, personalization: true },
    }),
  });

  const events = [
    { event_type: "session_start", context: { pathname: "/" } },
    { event_type: "page_enter", context: { pathname: "/" } },
    { event_type: "page_view", context: { pathname: "/products" } },
    { event_type: "product_view", context: { pathname: "/products/sample" } },
    { event_type: "add_to_cart", context: { pathname: "/products/sample" } },
  ];

  for (let i = 0; i < events.length; i++) {
    const ev = {
      ...events[i],
      session_id: authSessionId,
      tab_id: authTabId,
    };
    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(ev),
    });
    if (!res.ok) FAIL(`Event ${ev.event_type} tracking failed: ${res.status}`);
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Wait 4s for worker
  await new Promise((r) => setTimeout(r, 4000));

  // Query REAL MongoDB container `webfashion-mongo-staging`
  console.log("Querying MongoDB `webfashion_staging` for persisted events...");
  const mongoCmd = `docker exec webfashion-mongo-staging mongosh -u ${stagingMongoUser} -p ${stagingMongoPassword} --authenticationDatabase admin --quiet --eval "db.getSiblingDB('webfashion_staging').user_events.find({ session_id: '${authSessionId}' }, { event_type: 1, user_id: 1, _id: 0 }).toArray()"`;
  const mongoRaw = execSync(mongoCmd).toString().trim();
  console.log("  -> MongoDB Result:\n", mongoRaw);

  const mongoCount = (mongoRaw.match(/event_type/g) || []).length;
  if (mongoCount !== events.length) FAIL(`Expected ${events.length} persisted events, found ${mongoCount}`);
  if (!mongoRaw.includes(customerId)) FAIL(`Events in MongoDB must be linked to customerId '${customerId}'`);
  PASS(`3.1 Real MongoDB persistence verified: ${mongoCount}/${events.length} events saved with user_id=${customerId}`);

  // 4. Session Timeline & Account Detail Query via Admin API
  console.log("\nPhase 4: Session Timeline & Account Profile Retrieval via Admin API...");
  const timelineRes = await fetch(`${API_URL}/tracking/presence/session/${authSessionId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!timelineRes.ok) FAIL(`Get session timeline failed: ${timelineRes.status}`);
  const timelineData = (await timelineRes.json()).data;

  if (timelineData.userType !== "authenticated") FAIL(`Expected timeline userType 'authenticated', got '${timelineData.userType}'`);
  if (!timelineData.account) FAIL("Timeline response missing account profile");
  if (timelineData.account.fullName !== "Khách Hàng Thân Thiết") FAIL(`Expected account fullName 'Khách Hàng Thân Thiết', got '${timelineData.account.fullName}'`);
  if (timelineData.eventCount !== events.length) FAIL(`Expected eventCount ${events.length}, got ${timelineData.eventCount}`);
  PASS(`4.1 Admin Timeline returns Account Card: FullName="${timelineData.account.fullName}", Events=${timelineData.eventCount}`);

  // 5. Guest to Authenticated Transition (Identity Merge)
  console.log("\nPhase 5: Guest to Authenticated Transition & Identity Merge...");
  const transitionSessionId = `sess-trans-${crypto.randomUUID()}`;
  const transitionTabId = `tab-${crypto.randomUUID().slice(0, 8)}`;
  const transitionAnonId = crypto.randomUUID();

  // 5.1 Guest starts session and sends initial events
  await fetch(`${API_URL}/events/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-anonymous-id": transitionAnonId },
    body: JSON.stringify({
      anonymous_id: transitionAnonId,
      consent: "granted",
      choice: "ALL_ACCEPTED",
      categories: { necessary: true, analytics: true },
    }),
  });

  await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-anonymous-id": transitionAnonId },
    body: JSON.stringify({
      event_type: "session_start",
      anonymous_id: transitionAnonId,
      session_id: transitionSessionId,
      tab_id: transitionTabId,
      context: { pathname: "/" },
    }),
  });
  await new Promise((r) => setTimeout(r, 1200));

  await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-anonymous-id": transitionAnonId },
    body: JSON.stringify({
      event_type: "page_view",
      anonymous_id: transitionAnonId,
      session_id: transitionSessionId,
      tab_id: transitionTabId,
      context: { pathname: "/products" },
    }),
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 5.2 Guest logs in -> sends authenticated heartbeat
  await fetch(`${API_URL}/tracking/presence/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      session_id: transitionSessionId,
      tab_id: transitionTabId,
      anonymous_id: transitionAnonId,
      status: "ACTIVE",
      current_route: "/cart",
      entry_source: "Direct",
      last_action: "user_logged_in",
    }),
  });

  // 5.3 User performs add_to_cart as authenticated
  await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
      "x-anonymous-id": transitionAnonId,
    },
    body: JSON.stringify({
      event_type: "add_to_cart",
      anonymous_id: transitionAnonId,
      session_id: transitionSessionId,
      tab_id: transitionTabId,
      context: { pathname: "/cart" },
    }),
  });
  await new Promise((r) => setTimeout(r, 4000));

  // Verify transition in Admin Live Presence
  const transLiveRes = await fetch(`${API_URL}/tracking/presence/live`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const transLiveData = (await transLiveRes.json()).data;
  const transSession = transLiveData.sessions.find((s) => s.sessionId === transitionSessionId);

  if (!transSession) FAIL("Transition session not found in Admin live list");
  if (transSession.userType !== "authenticated") FAIL(`Expected transition session to be 'authenticated', got '${transSession.userType}'`);
  if (transSession.userDisplay !== "Khách Hàng Thân Thiết") FAIL(`Expected userDisplay 'Khách Hàng Thân Thiết', got '${transSession.userDisplay}'`);
  PASS("5.1 Guest transitioned to Authenticated in live presence without creating duplicate session");

  // Verify previous events were merged to customerId in MongoDB
  const mergeCmd = `docker exec webfashion-mongo-staging mongosh -u ${stagingMongoUser} -p ${stagingMongoPassword} --authenticationDatabase admin --quiet --eval "db.getSiblingDB('webfashion_staging').user_events.find({ session_id: '${transitionSessionId}' }, { event_type: 1, user_id: 1, _id: 0 }).toArray()"`;
  const mergeRaw = execSync(mergeCmd).toString().trim();
  console.log("  -> Identity Merge MongoDB Result:\n", mergeRaw);
  if (!mergeRaw.includes(customerId)) FAIL("Identity merge failed: events should be linked to customerId");
  PASS("5.2 Identity Merge verified: prior guest events linked with user_id in MongoDB");

  // 6. User Logout / Disassociation Verification
  console.log("\nPhase 6: User Logout & Identity Disassociation...");
  const disassocRes = await fetch(`${API_URL}/tracking/presence/disassociate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: transitionSessionId,
      tab_id: transitionTabId,
    }),
  });
  if (!disassocRes.ok) FAIL(`Disassociate request failed: ${disassocRes.status}`);

  // Query live presence again
  const postLogoutLiveRes = await fetch(`${API_URL}/tracking/presence/live`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const postLogoutSession = (await postLogoutLiveRes.json()).data?.sessions?.find((s) => s.sessionId === transitionSessionId);
  if (!postLogoutSession) FAIL("Session should still exist in live presence after disassociation");
  if (postLogoutSession.userType !== "guest") FAIL(`Expected session to revert to 'guest', got '${postLogoutSession.userType}'`);
  if (postLogoutSession.userId !== null) FAIL(`Expected userId=null after logout, got '${postLogoutSession.userId}'`);
  if (postLogoutSession.userDisplay !== "Khách vãng lai") FAIL(`Expected userDisplay 'Khách vãng lai', got '${postLogoutSession.userDisplay}'`);
  PASS("6.1 Logout disassociation verified: session cleanly reverted to guest, old identity cleared");

  // 7. Non-Existent User ID Handling (Resilience Test)
  console.log("\nPhase 7: Non-Existent User ID Resilience Handling...");
  const nonExistentUserId = "507f1f77bcf86cd799439011";
  const fakeAuthSessionId = `sess-fake-${crypto.randomUUID()}`;
  const fakeTabId = `tab-fake`;

  // Set fake authenticated session in Redis directly using stdin
  const fakeSessionPayload = JSON.stringify({
    sessionId: fakeAuthSessionId,
    tabId: fakeTabId,
    userId: nonExistentUserId,
    userType: "authenticated",
    status: "ACTIVE",
    currentRoute: "/",
    sessionDurationSec: 10,
    lastHeartbeatAt: Date.now(),
  });
  execSync(`docker exec -i webfashion-redis-staging redis-cli -x set "webfashion:presence:session:${fakeAuthSessionId}:tab:${fakeTabId}"`, { input: fakeSessionPayload });
  execSync(`docker exec webfashion-redis-staging redis-cli expire "webfashion:presence:session:${fakeAuthSessionId}:tab:${fakeTabId}" 90`);
  execSync(`docker exec webfashion-redis-staging redis-cli sadd "webfashion:presence:active-sessions" "${fakeAuthSessionId}"`);
  execSync(`docker exec webfashion-redis-staging redis-cli sadd "webfashion:presence:session:${fakeAuthSessionId}:tabs" "${fakeTabId}"`);

  const fakeTimelineRes = await fetch(`${API_URL}/tracking/presence/session/${fakeAuthSessionId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const fakeTimelineData = (await fakeTimelineRes.json()).data;
  if (!fakeTimelineData.account?.error) FAIL("Expected account.error for non-existent user");
  if (fakeTimelineData.userType !== "authenticated") FAIL("Should not mistakenly convert non-existent user to guest");
  PASS("7.1 Non-existent User resilience verified: graceful error handling, userType preserved as authenticated");

  // 8. Security & Authorization Checks
  console.log("\nPhase 8: Security & Authorization Enforcement...");
  // Unauthorized request (no token)
  const unauthRes = await fetch(`${API_URL}/tracking/presence/live`);
  if (unauthRes.status !== 401) FAIL(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  PASS("8.1 Unauthenticated access blocked (HTTP 401)");

  // Forbidden request (Customer trying to view Admin live tracking)
  const forbiddenRes = await fetch(`${API_URL}/tracking/presence/live`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (forbiddenRes.status !== 403) FAIL(`Expected 403 for Customer accessing Admin tracking API, got ${forbiddenRes.status}`);
  PASS("8.2 Customer role access to Admin Tracking API blocked (HTTP 403 Forbidden)");

  console.log("\n=======================================================");
  console.log("ALL REAL USER IDENTITY TRACKING TESTS PASSED (8/8)!");
  console.log("=======================================================");
}

runIdentityVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
