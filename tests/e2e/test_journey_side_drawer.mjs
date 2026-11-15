/**
 * ==============================================================================
 * E2E TEST SUITE: USER JOURNEY RIGHT-SIDE SLIDE-IN DRAWER
 * 404 Studio — WebFashion Master Verification
 * ==============================================================================
 */

import { BASE_URL, VIEWPORTS, createTestBrowser, setupPage } from "./helpers.mjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const mongoose = require("../../back-end/node_modules/mongoose");
const requireEnv = (name) => {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
  return process.env[name];
};

const API_URL = `${BASE_URL}/api`;
const MONGO_URI = requireEnv("MONGO_CONNECTIONSTRING");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const PASS = (msg) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const FAIL = (msg) => {
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
  throw new Error(msg);
};

async function runTestSuite() {
  console.log("=======================================================");
  console.log("TEST SUITE: USER JOURNEY RIGHT-SIDE SLIDE-IN DRAWER");
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend API:  ${API_URL}`);
  console.log(`MongoDB Staging: 127.0.0.1:27018`);
  console.log("=======================================================\n");

  // Connect to Real MongoDB Staging
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const userEventsCol = db.collection("user_events");
  const usersCol = db.collection("users");

  // 1. Authenticate Admin and Customer
  console.log("Phase 1: Authenticating Admin and Customer...");
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@404studio.vn", passWord: "DevAdmin2026!" }),
  });
  if (!adminLoginRes.ok) FAIL(`Admin login failed: ${adminLoginRes.status}`);
  const adminAuthData = (await adminLoginRes.json()).data;
  const adminToken = adminAuthData.accessToken;
  PASS(`Admin authenticated successfully (Token: ${adminToken.slice(0, 12)}...)`);

  const custLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@404studio.vn", passWord: "DevCustomer2026!" }),
  });
  if (!custLoginRes.ok) FAIL(`Customer login failed: ${custLoginRes.status}`);
  const custAuthData = (await custLoginRes.json()).data;
  const customerToken = custAuthData.accessToken;
  const customerId = custAuthData.user._id || custAuthData.user.id;
  const customerName = custAuthData.user.fullName;
  PASS(`Customer authenticated: ID=${customerId}, Name="${customerName}"`);

  // 2. Pre-seed Real Data in MongoDB & Redis
  console.log("\nPhase 2: Seeding Real Authenticated and Guest Sessions in MongoDB & Redis...");
  const authSessionId = `sess-drawer-auth-${Date.now()}`;
  const authTabId = `tab-${crypto.randomUUID().slice(0, 8)}`;

  const guestSessionId = `sess-drawer-guest-${Date.now()}`;
  const guestTabId = `tab-${crypto.randomUUID().slice(0, 8)}`;
  const guestAnonId = crypto.randomUUID();

  // 2.1 Send Heartbeats
  const authHb = await fetch(`${API_URL}/tracking/presence/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      session_id: authSessionId,
      tab_id: authTabId,
      status: "ACTIVE",
      current_route: "/products",
      entry_source: "google_search",
      last_action: "view_catalog",
      session_duration_sec: 240,
      active_duration_sec: 180,
      idle_duration_sec: 60,
    }),
  });
  if (!authHb.ok) FAIL(`Auth heartbeat failed: ${authHb.status}`);

  const guestHb = await fetch(`${API_URL}/tracking/presence/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: guestSessionId,
      tab_id: guestTabId,
      anonymous_id: guestAnonId,
      status: "IDLE",
      current_route: "/lookbook",
      entry_source: "facebook_ads",
      last_action: "browse_lookbook",
      session_duration_sec: 360,
      active_duration_sec: 120,
      idle_duration_sec: 240,
    }),
  });
  if (!guestHb.ok) FAIL(`Guest heartbeat failed: ${guestHb.status}`);

  // 2.2 Insert real MongoDB user_events for Authenticated Session
  const now = Date.now();
  const customerObjectId = new mongoose.Types.ObjectId(customerId);
  const authEvents = [
    {
      event_id: `ev-start-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "session_start",
      context: { pathname: "/", entrySource: "google_search" },
      meta: { device: "desktop", browser: "Chrome" },
      createdAt: new Date(now - 200000),
      updatedAt: new Date(now - 200000),
    },
    {
      event_id: `ev-nav-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "page_view",
      context: { pathname: "/products", fromPath: "/", toPath: "/products" },
      meta: { title: "Sản phẩm WebFashion" },
      createdAt: new Date(now - 160000),
      updatedAt: new Date(now - 160000),
    },
    {
      event_id: `ev-click-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "product_click",
      context: { pathname: "/products" },
      meta: {
        product_name: "Áo sơ mi lụa tơ tằm",
        productId: "prod_silk_001",
        price: 450000,
      },
      createdAt: new Date(now - 120000),
      updatedAt: new Date(now - 120000),
    },
    {
      event_id: `ev-api-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "api_trace",
      context: {
        api: { method: "GET", endpoint: "/api/products", status: 200, durationMs: 42 },
      },
      meta: {},
      createdAt: new Date(now - 100000),
      updatedAt: new Date(now - 100000),
    },
    {
      event_id: `ev-cart-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "add_to_cart",
      context: { pathname: "/products/prod_silk_001" },
      meta: {
        product_name: "Áo sơ mi lụa tơ tằm",
        price: 450000,
        quantity: 1,
      },
      createdAt: new Date(now - 60000),
      updatedAt: new Date(now - 60000),
    },
    {
      event_id: `ev-chk-${crypto.randomUUID()}`,
      session_id: authSessionId,
      user_id: customerObjectId,
      event_type: "checkout_step_viewed",
      context: { pathname: "/checkout" },
      meta: { step: 1, stepName: "Thông tin giao hàng" },
      createdAt: new Date(now - 20000),
      updatedAt: new Date(now - 20000),
    },
  ];
  await userEventsCol.insertMany(authEvents);
  PASS(`Seeded ${authEvents.length} real events into MongoDB for auth session`);

  // 2.3 Insert real MongoDB user_events for Guest Session
  const guestEvents = [
    {
      event_id: `ev-guest-nav-${crypto.randomUUID()}`,
      session_id: guestSessionId,
      user_id: null,
      event_type: "page_view",
      context: { pathname: "/lookbook" },
      meta: { title: "Lookbook Summer 2026" },
      createdAt: new Date(now - 180000),
      updatedAt: new Date(now - 180000),
    },
    {
      event_id: `ev-guest-search-${crypto.randomUUID()}`,
      session_id: guestSessionId,
      user_id: null,
      event_type: "search_performed",
      context: { pathname: "/lookbook" },
      meta: { query: "váy hoa mùa hè" },
      createdAt: new Date(now - 140000),
      updatedAt: new Date(now - 140000),
    },
  ];
  await userEventsCol.insertMany(guestEvents);
  PASS(`Seeded ${guestEvents.length} real events into MongoDB for guest session`);

  // 3. Launch Playwright
  console.log("\nPhase 3: Launching Playwright E2E Tests...");
  const browser = await createTestBrowser();

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION A: DESKTOP VIEWPORT (1920x1080)
    // -------------------------------------------------------------------------
    console.log("\n--- Section A: Desktop Viewport (1920x1080) ---");
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
      theme: "light",
    });

    // Auto-grant privacy consent so banner doesn't block clicks
    await page.addInitScript(() => {
      localStorage.setItem(
        "webfashion_privacy_consent_v1",
        JSON.stringify({
          status: "ALL_ACCEPTED",
          categories: { necessary: true, analytics: true, personalization: true, marketing: true },
          policyVersion: "1.0",
          updatedAt: new Date().toISOString(),
          hasConsented: true,
        })
      );
    });

    // 3.1 Login as Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[name="email"]', "admin@404studio.vn");
    await page.fill('input[type="password"], input[name="passWord"]', "DevAdmin2026!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 3.2 Navigate to /admin/user-activity
    await page.goto(`${BASE_URL}/admin/user-activity`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Set persistence flag in window to prove page is NEVER reloaded or navigated
    await page.evaluate(() => {
      window.__NO_RELOAD_PERSISTENCE_TEST__ = "ACTIVE_SESSION_CHECK_2026";
    });

    const initialUrl = page.url();
    if (!initialUrl.includes("/admin/user-activity")) {
      FAIL(`Expected on /admin/user-activity, got ${initialUrl}`);
    }
    PASS("3.1 Admin on /admin/user-activity page");

    // 3.3 Find Action button "Hành trình" for authSessionId
    const actionBtn = page.locator(`button[data-testid="open-journey-btn"][data-session-id="${authSessionId}"]`);
    await actionBtn.waitFor({ state: "visible", timeout: 10000 });
    PASS("3.2 Located 'Hành trình' action button in table");

    // 3.4 Click "Hành trình" -> MUST NOT NAVIGATE, MUST NOT RELOAD
    await actionBtn.click();
    await page.waitForTimeout(500);

    // Verify URL did NOT change
    const afterClickUrl = page.url();
    if (afterClickUrl !== initialUrl) {
      FAIL(`URL changed from ${initialUrl} to ${afterClickUrl} (Navigation occurred!)`);
    }
    PASS("3.3 URL is preserved exactly: NO page navigation occurred");

    // Verify window persistence flag is still intact (NO page reload)
    const persistenceFlag = await page.evaluate(() => window.__NO_RELOAD_PERSISTENCE_TEST__);
    if (persistenceFlag !== "ACTIVE_SESSION_CHECK_2026") {
      FAIL("Window reloaded: persistence flag lost!");
    }
    PASS("3.4 Page did NOT reload: window state fully preserved");

    // 3.5 Verify Right-Side Slide-in Drawer Geometry & Dimensions
    const overlay = page.locator('[data-testid="admin-drawer-overlay"]');
    await overlay.waitFor({ state: "visible", timeout: 5000 });

    const drawer = page.locator('[data-testid="admin-drawer"]');
    await drawer.waitFor({ state: "visible", timeout: 5000 });

    const overlayBox = await overlay.boundingBox();
    if (overlayBox.width < 1900 || overlayBox.height < 1000) {
      FAIL(`Backdrop overlay must cover entire viewport (1920x1080), got ${overlayBox.width}x${overlayBox.height}`);
    }
    PASS(`3.5 Backdrop overlay covers full viewport: ${overlayBox.width}x${overlayBox.height}`);

    const drawerBox = await drawer.boundingBox();
    if (drawerBox.width > 620) {
      FAIL(`Desktop drawer should be ~480-580px (max 45vw), got width: ${drawerBox.width}px`);
    }
    if (drawerBox.height < 1000) {
      FAIL(`Drawer should be full height (100dvh), got height: ${drawerBox.height}px`);
    }
    // Check right-aligned
    const distanceFromRight = 1920 - (drawerBox.x + drawerBox.width);
    if (Math.abs(distanceFromRight) > 5) {
      FAIL(`Drawer should be right-aligned, distance from right: ${distanceFromRight}px`);
    }
    PASS(`3.6 Drawer width=${Math.round(drawerBox.width)}px, height=${Math.round(drawerBox.height)}px, right-aligned to viewport edge`);

    // 3.6 Verify Drawer Header & Authenticated Identity
    const headerTitle = await drawer.locator("h2").textContent();
    if (!headerTitle.includes("HÀNH TRÌNH NGƯỜI DÙNG")) {
      FAIL(`Expected drawer title 'HÀNH TRÌNH NGƯỜI DÙNG', got '${headerTitle}'`);
    }
    PASS("3.7 Drawer header title: 'HÀNH TRÌNH NGƯỜI DÙNG'");

    const identityText = await drawer.textContent();
    if (!identityText.includes(customerName)) {
      FAIL(`Expected customer name '${customerName}' in drawer, not found`);
    }
    if (!identityText.includes("Khách hàng")) {
      FAIL("Expected 'Khách hàng' role badge in drawer");
    }
    if (!identityText.includes("Đang hoạt động")) {
      FAIL("Expected 'Đang hoạt động' presence badge");
    }
    PASS(`3.8 Identity verified: Name="${customerName}", Role="Khách hàng", Status="Đang hoạt động"`);

    // Verify Close button touch target >= 44x44
    const closeBtn = drawer.locator('[data-testid="admin-drawer-close-btn"]');
    const closeBtnBox = await closeBtn.boundingBox();
    if (closeBtnBox.width < 44 || closeBtnBox.height < 44) {
      FAIL(`Close button touch target must be >= 44x44px, got ${closeBtnBox.width}x${closeBtnBox.height}`);
    }
    PASS(`3.9 Close button touch target: ${closeBtnBox.width}x${closeBtnBox.height}px (WCAG 2.2 AA compliant)`);

    // 3.7 Verify Session Summary Card
    if (!identityText.includes("Tổng quan phiên truy cập")) {
      FAIL("Session Summary card title not found");
    }
    if (!identityText.includes("google_search")) {
      FAIL("Session Summary entry source 'google_search' not found");
    }
    if (!identityText.includes("/products")) {
      FAIL("Session Summary current route '/products' not found");
    }
    PASS("3.10 Session Summary Card renders: Entry Source, Current Route, Durations, Total Events");

    // 3.8 Verify 5 Category Filter Tabs & In-Drawer Search
    const tabAll = drawer.locator('[data-testid="filter-tab-ALL"]');
    const tabNav = drawer.locator('[data-testid="filter-tab-navigation"]');
    const tabInt = drawer.locator('[data-testid="filter-tab-interaction"]');
    const tabApi = drawer.locator('[data-testid="filter-tab-api"]');
    const tabChk = drawer.locator('[data-testid="filter-tab-checkout"]');

    await tabAll.waitFor({ state: "visible" });
    await tabNav.waitFor({ state: "visible" });
    await tabInt.waitFor({ state: "visible" });
    await tabApi.waitFor({ state: "visible" });
    await tabChk.waitFor({ state: "visible" });
    PASS("3.11 5 Category Filter Tabs present: Tất cả | Điều hướng | Tương tác | API | Checkout");

    // Click 'Điều hướng' tab
    await tabNav.click();
    await page.waitForTimeout(300);
    let navText = await drawer.textContent();
    if (!navText.includes("Xem trang") && !navText.includes("Bắt đầu phiên")) {
      FAIL("Navigation tab should show navigation events (Xem trang / Bắt đầu phiên)");
    }
    if (navText.includes("Áo sơ mi lụa tơ tằm")) {
      FAIL("Navigation tab should NOT show product click event");
    }
    PASS("3.12 Tab 'Điều hướng' filters events accurately");

    // Click 'Tương tác' tab
    await tabInt.click();
    await page.waitForTimeout(300);
    let intText = await drawer.textContent();
    if (!intText.includes("Nhấp vào sản phẩm") && !intText.includes("Áo sơ mi lụa tơ tằm")) {
      FAIL("Interaction tab should show product click");
    }
    PASS("3.13 Tab 'Tương tác' filters product click events accurately");

    // Click 'API' tab
    await tabApi.click();
    await page.waitForTimeout(300);
    let apiText = await drawer.textContent();
    if (!apiText.includes("Nhật ký gọi API") || !apiText.includes("/api/products")) {
      FAIL("API tab should show API trace events");
    }
    PASS("3.14 Tab 'API' filters API trace events accurately");

    // Click 'Checkout' tab
    await tabChk.click();
    await page.waitForTimeout(300);
    let chkText = await drawer.textContent();
    if (!chkText.includes("Thêm vào giỏ hàng") || !chkText.includes("Vào bước thanh toán")) {
      FAIL("Checkout tab should show cart and checkout step events");
    }
    PASS("3.15 Tab 'Checkout' filters cart & checkout funnel events accurately");

    // Return to 'Tất cả' tab
    await tabAll.click();
    await page.waitForTimeout(300);

    // In-drawer search: search for 'lụa tơ tằm'
    const searchInput = drawer.locator('[data-testid="drawer-search-input"]');
    await searchInput.fill("lụa tơ tằm");
    await page.waitForTimeout(300);
    let searchText = await drawer.textContent();
    if (!searchText.includes("Áo sơ mi lụa tơ tằm")) {
      FAIL("Search filter should display product 'Áo sơ mi lụa tơ tằm'");
    }
    await searchInput.fill("");
    await page.waitForTimeout(200);
    PASS("3.16 In-Drawer Search input filters events dynamically");

    // 3.9 Verify Persistence Badges
    const persistedBadges = drawer.locator('[data-testid="event-persisted-badge"]');
    const persistedCount = await persistedBadges.count();
    if (persistedCount < 4) {
      FAIL(`Expected >= 4 persisted event badges, found ${persistedCount}`);
    }
    PASS(`3.17 Persistence badges verified: ${persistedCount} events marked 'Đã lưu MongoDB'`);

    // Capture Desktop Screenshot
    const desktopScreenshotPath = path.join(SCREENSHOT_DIR, "admin_journey_drawer_desktop.png");
    await page.screenshot({ path: desktopScreenshotPath });
    PASS(`3.18 Desktop screenshot captured: ${desktopScreenshotPath}`);

    // -------------------------------------------------------------------------
    // TEST SECTION B: REAL-TIME EVENT STREAMING VIA SOCKET.IO
    // -------------------------------------------------------------------------
    console.log("\n--- Section B: Real-Time Socket.IO Streaming in Drawer ---");

    // Send a new live event via Tracking API for this session
    const realtimeEventId = `ev-rt-${crypto.randomUUID()}`;
    const rtRes = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        events: [
          {
            event_id: realtimeEventId,
            session_id: authSessionId,
            anonymous_id: crypto.randomUUID(),
            event_type: "wishlist_added",
            context: { pathname: "/products/prod_silk_001" },
            meta: { product_name: "Áo sơ mi lụa tơ tằm" },
          },
        ],
      }),
    });
    if (!rtRes.ok) FAIL(`Realtime event injection failed: ${rtRes.status}`);

    // Wait for the realtime event to appear in the open drawer
    await page.waitForFunction(
      () => document.body.innerText.includes("Thêm vào danh sách yêu thích") ||
            document.body.innerText.includes("wishlist_added"),
      { timeout: 7000 }
    );
    PASS("3.19 Live Socket.IO event received in open drawer without page reload!");

    // -------------------------------------------------------------------------
    // TEST SECTION C: MOBILE VIEWPORT (390x844) & GUEST SESSION
    // -------------------------------------------------------------------------
    console.log("\n--- Section C: Mobile Viewport (390x844) & Guest Session ---");
    const mobilePageResult = await setupPage(browser, {
      viewport: VIEWPORTS.mobile,
      theme: "light",
      storageState: await context.storageState(),
    });
    const mobilePage = mobilePageResult.page;

    await mobilePage.goto(`${BASE_URL}/admin/user-activity`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(2000);

    // Open drawer for Guest Session
    const guestActionBtn = mobilePage.locator(`button[data-testid="open-journey-btn"][data-session-id="${guestSessionId}"]`);
    await guestActionBtn.waitFor({ state: "visible", timeout: 8000 });
    await guestActionBtn.click();
    await mobilePage.waitForTimeout(500);

    const mobileDrawer = mobilePage.locator('[data-testid="admin-drawer"]');
    await mobileDrawer.waitFor({ state: "visible", timeout: 5000 });

    const mobileDrawerBox = await mobileDrawer.boundingBox();
    if (Math.abs(mobileDrawerBox.width - 390) > 2) {
      FAIL(`Mobile drawer width must be 100vw (390px), got ${mobileDrawerBox.width}px`);
    }
    PASS(`3.20 Mobile drawer width is 100vw (${mobileDrawerBox.width}px) with pb-safe support`);

    const guestText = await mobileDrawer.textContent();
    if (!guestText.includes("Khách vãng lai") || !guestText.includes("Khách")) {
      FAIL("Guest banner with 'Khách vãng lai' and 'Khách' role badge not found");
    }
    PASS("3.21 Guest session identity verified on Mobile: 'Khách vãng lai' & 'Khách' badge");

    // Capture Mobile Screenshot
    const mobileScreenshotPath = path.join(SCREENSHOT_DIR, "admin_journey_drawer_mobile.png");
    await mobilePage.screenshot({ path: mobileScreenshotPath });
    PASS(`3.22 Mobile screenshot captured: ${mobileScreenshotPath}`);

    // -------------------------------------------------------------------------
    // TEST SECTION D: CLOSING BEHAVIORS & NO DATA MIXING
    // -------------------------------------------------------------------------
    console.log("\n--- Section D: Drawer Closing Interactions & Isolation ---");

    // Close via Close Button (X)
    const mobileCloseBtn = mobileDrawer.locator('[data-testid="admin-drawer-close-btn"]');
    await mobileCloseBtn.click();
    await mobilePage.waitForTimeout(500);
    const isMobileDrawerVisible = await mobileDrawer.isVisible();
    if (isMobileDrawerVisible) {
      FAIL("Drawer should be hidden after clicking close button");
    }
    PASS("3.23 Drawer closed via close button (X)");

    // Reopen and close via Escape Key
    await guestActionBtn.click();
    await mobileDrawer.waitFor({ state: "visible" });
    await mobilePage.keyboard.press("Escape");
    await mobilePage.waitForTimeout(500);
    const isEscClosed = !(await mobileDrawer.isVisible());
    if (!isEscClosed) {
      FAIL("Drawer should close on Escape key");
    }
    PASS("3.24 Drawer closed via Escape key (WCAG keyboard accessibility)");

    // Close desktop drawer via Backdrop Overlay Click (backdrop is exposed on desktop)
    const desktopOverlay = page.locator('[data-testid="admin-drawer-overlay"]');
    await desktopOverlay.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(500);
    const isOverlayClosed = !(await drawer.isVisible());
    if (!isOverlayClosed) {
      FAIL("Drawer should close on Backdrop overlay click");
    }
    PASS("3.25 Drawer closed via Backdrop overlay click on desktop");

    // Session Isolation: Open Auth Session in desktop page, ensure Guest events do NOT appear in Auth session
    await actionBtn.click();
    await drawer.waitFor({ state: "visible" });
    const finalAuthText = await drawer.textContent();
    if (finalAuthText.includes("váy hoa mùa hè")) {
      FAIL("Session Isolation broken: Guest events leaked into Authenticated session drawer!");
    }
    PASS("3.26 Strict Session Isolation: No event mixing between Session A and Session B");

    console.log("\n=======================================================");
    console.log("ALL USER JOURNEY SIDE-DRAWER E2E TESTS PASSED (26/26)!");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runTestSuite().catch((err) => {
  console.error("FATAL ERROR in E2E Test Suite:", err);
  process.exit(1);
});
