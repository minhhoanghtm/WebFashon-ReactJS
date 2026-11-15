import dotenv from "dotenv";
dotenv.config();

const runVerification = async () => {
  console.log("=== STARTING FULL TRACKING & PRESENCE REAL-TIME VERIFICATION ===");

  const { getRedisConnection } = await import("../src/configs/redis.js");
  const presenceModule = await import("../src/modules/tracking/presence.service.js");
  const presenceService = presenceModule.default;
  const { PRESENCE_STATUS } = await import("../src/modules/tracking/tracking.constants.js");
  const mongoose = (await import("mongoose")).default;

  const redis = getRedisConnection();
  if (!redis) {
    throw new Error("Could not connect to Redis");
  }
  console.log("1. Redis connected successfully");

  // Step 1: Simulate Guest session
  const guestSid = `sess-verify-guest-${Date.now()}`;
  const guestTab = `tab-verify-guest-1`;
  const anonId = "11111111-2222-3333-4444-555555555555";

  console.log("\n2. Sending Guest Heartbeat...");
  const resGuest = await presenceService.updateHeartbeat(
    {
      session_id: guestSid,
      tab_id: guestTab,
      anonymous_id: anonId,
      status: PRESENCE_STATUS.ACTIVE,
      current_route: "/products",
      previous_route: "/",
      idle_duration_sec: 0,
      session_duration_sec: 10,
      entry_source: "Google Search",
      traffic_channel: "Organic Search",
      last_action: "product_filter_click",
      visible: true,
    },
    null
  );
  console.log("Guest heartbeat response:", resGuest);

  // Step 2: Simulate Authenticated user session
  const authSid = `sess-verify-auth-${Date.now()}`;
  const authTab = `tab-verify-auth-1`;
  const mockUserId = new mongoose.Types.ObjectId();

  console.log("\n3. Sending Authenticated User Heartbeat...");
  const resAuth = await presenceService.updateHeartbeat(
    {
      session_id: authSid,
      tab_id: authTab,
      status: PRESENCE_STATUS.IDLE,
      current_route: "/checkout",
      previous_route: "/cart",
      idle_duration_sec: 75,
      session_duration_sec: 180,
      entry_source: "Direct",
      traffic_channel: "Direct",
      last_action: "step_2_shipping",
      visible: true,
    },
    {
      _id: mockUserId,
      userId: mockUserId.toString(),
      name: "Architect Tester",
      email: "tester@404studio.vn",
      role: "admin",
    }
  );
  console.log("Auth heartbeat response:", resAuth);

  // Step 3: Fetch live sessions
  console.log("\n4. Fetching Live Sessions from Redis Presence...");
  const live = await presenceService.getLiveSessions({ limit: 100 });
  console.log("Counts Summary:", live.counts);
  console.log(`Total sessions returned: ${live.sessions.length}`);

  const foundGuest = live.sessions.find((s) => s.sessionId === guestSid);
  const foundAuth = live.sessions.find((s) => s.sessionId === authSid);

  if (!foundGuest) throw new Error("Guest session not found in Redis live sessions!");
  if (!foundAuth) throw new Error("Authenticated session not found in Redis live sessions!");

  console.log("\nFound Guest Session:", {
    sessionId: foundGuest.sessionId,
    userType: foundGuest.userType,
    anonymousId: foundGuest.anonymousId,
    overallStatus: foundGuest.overallStatus,
    currentRoute: foundGuest.currentRoute,
    entrySource: foundGuest.entrySource,
  });

  console.log("\nFound Authenticated Session:", {
    sessionId: foundAuth.sessionId,
    userType: foundAuth.userType,
    userId: foundAuth.userId,
    userDisplay: foundAuth.userDisplay,
    overallStatus: foundAuth.overallStatus,
    currentRoute: foundAuth.currentRoute,
  });

  // Step 4: Route change test
  console.log("\n5. Testing Instant Route Update...");
  await presenceService.updateHeartbeat(
    {
      session_id: guestSid,
      tab_id: guestTab,
      anonymous_id: anonId,
      status: PRESENCE_STATUS.ACTIVE,
      current_route: "/products/denim-jacket-2026",
      previous_route: "/products",
      idle_duration_sec: 0,
      session_duration_sec: 25,
      last_action: "product_view",
    },
    null
  );

  const updatedLive = await presenceService.getLiveSessions({ limit: 100 });
  const updatedGuest = updatedLive.sessions.find((s) => s.sessionId === guestSid);
  console.log("Updated Guest Route:", updatedGuest.currentRoute, "Previous:", updatedGuest.previousRoute);
  if (updatedGuest.currentRoute !== "/products/denim-jacket-2026") {
    throw new Error("Route was not updated properly in Redis!");
  }

  // Step 5: Clean up / Tab leave
  console.log("\n6. Cleaning up test sessions via handleTabLeave...");
  await presenceService.handleTabLeave({ session_id: guestSid, tab_id: guestTab, reason: "test_complete" });
  await presenceService.handleTabLeave({ session_id: authSid, tab_id: authTab, reason: "test_complete" });

  const postCleanup = await presenceService.getLiveSessions({ limit: 100 });
  const stillFoundGuest = postCleanup.sessions.find((s) => s.sessionId === guestSid);
  const stillFoundAuth = postCleanup.sessions.find((s) => s.sessionId === authSid);

  if (stillFoundGuest || stillFoundAuth) {
    throw new Error("Cleanup failed: session still active in Redis!");
  }
  console.log("Cleanup verified: sessions cleanly removed from Redis active sets.");

  console.log("\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!");
  process.exit(0);
};

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
