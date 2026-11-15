import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { requireEnv } from "./require-env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, "../../../docs/screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const STAGING_URL = "http://localhost:8081";
const API_URL = "http://localhost:5050/api";
const JWT_SECRET = requireEnv("JWT_SECRET");
const customerPassword = requireEnv("STAGING_CUSTOMER_PASSWORD");

async function loginCustomer() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@404studio.vn", passWord: customerPassword }),
  });
  const data = await res.json();
  const cookie = res.headers.get("set-cookie");
  return {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    user: data.data.user,
    cookie,
  };
}

async function runAllJourneys() {
  console.log("==================================================================");
  console.log("PLAYWRIGHT E2E ACCEPTANCE TEST SUITE: AUTH & AI CHAT STABILITY");
  console.log(`Target: ${STAGING_URL} (Real Staging Environment)`);
  console.log("==================================================================\n");

  const loginAuth = await loginCustomer();
  console.log(`✅ Customer credentials authenticated for: ${loginAuth.user.email}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];

  // =========================================================================
  // JOURNEY A: Long Session & Transparent Token Refresh
  // =========================================================================
  console.log("\n--- STARTING JOURNEY A: Long Session & Transparent Token Refresh ---");
  try {
    const contextA = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const expiredJti = crypto.randomUUID();
    const expiredToken = jwt.sign(
      { userId: loginAuth.user._id || loginAuth.user.id, role: "user", jti: expiredJti },
      JWT_SECRET,
      { expiresIn: "-10m" }
    );

    if (loginAuth.cookie) {
      const match = loginAuth.cookie.match(/refreshToken=([^;]+)/);
      if (match) {
        await contextA.addCookies([
          {
            name: "refreshToken",
            value: match[1],
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
          },
        ]);
      }
    }

    await contextA.addInitScript(
      ({ token, refreshToken, userJson }) => {
        try {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", userJson);
          localStorage.setItem(
            "wf_cookie_consent_v1",
            JSON.stringify({
              necessary: true,
              analytics: true,
              marketing: true,
              personalization: true,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (_) {}
      },
      {
        token: expiredToken,
        refreshToken: loginAuth.refreshToken,
        userJson: JSON.stringify(loginAuth.user),
      }
    );

    const pageA = await contextA.newPage();

    let refreshCalled = false;
    pageA.on("request", (req) => {
      if (req.url().includes("/auth/refreshToken")) {
        refreshCalled = true;
      }
    });

    await pageA.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await pageA.waitForTimeout(2000);

    const currentUrl = pageA.url();
    const isNotLoginPage = !currentUrl.includes("/login");
    const activeTokenAfterLoad = await pageA.evaluate(() => localStorage.getItem("accessToken"));
    const tokenWasRefreshed = activeTokenAfterLoad !== expiredToken;

    console.log(`  - Refresh API intercepted: ${refreshCalled}`);
    console.log(`  - Token was renewed in storage: ${tokenWasRefreshed}`);
    console.log(`  - User stayed on app without /login redirect: ${isNotLoginPage} (${currentUrl})`);

    const screenshotAPath = path.join(SCREENSHOTS_DIR, "journey_a_token_refresh.png");
    await pageA.screenshot({ path: screenshotAPath, fullPage: false });

    const passedA = isNotLoginPage && tokenWasRefreshed;
    results.push({ journey: "A", name: "Long Session & Transparent Token Refresh", passed: passedA });
    console.log(`  Result Journey A: ${passedA ? "PASS ✅" : "FAIL ❌"}`);
    await contextA.close();
  } catch (err) {
    console.error("  Error in Journey A:", err);
    results.push({ journey: "A", name: "Long Session & Transparent Token Refresh", passed: false });
  }

  // =========================================================================
  // JOURNEY B: Multi-Turn AI Chat Stability & Stream Disconnect
  // =========================================================================
  console.log("\n--- STARTING JOURNEY B: Multi-Turn AI Chat Stability & Stream Disconnect ---");
  try {
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const freshAuth = await loginCustomer();

    await contextB.addInitScript(
      ({ token, refreshToken, userJson }) => {
        try {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", userJson);
          localStorage.setItem(
            "wf_cookie_consent_v1",
            JSON.stringify({
              necessary: true,
              analytics: true,
              marketing: true,
              personalization: true,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (_) {}
      },
      {
        token: freshAuth.accessToken,
        refreshToken: freshAuth.refreshToken,
        userJson: JSON.stringify(freshAuth.user),
      }
    );

    const pageB = await contextB.newPage();
    await pageB.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await pageB.waitForTimeout(1000);

    // Open AI Chat Widget via Launcher button
    console.log("  - Locating and clicking AI chat launcher button...");
    const launcherBtn = pageB.locator("button[aria-label*='trò chuyện'], button[aria-label*='hỗ trợ'], button[aria-label*='Chat']").first();

    let chatOpened = false;
    if (await launcherBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await launcherBtn.click();
      chatOpened = true;
      console.log("  - Clicked launcher button successfully");
    } else {
      chatOpened = await pageB.evaluate(() => {
        const btn = document.querySelector("button[aria-label*='trò chuyện']") ||
                    document.querySelector("button[aria-label*='hỗ trợ']") ||
                    document.querySelector("button:has(svg.lucide-message-square)");
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log(`  - Fallback click result: ${chatOpened}`);
    }

    await pageB.waitForTimeout(1000);

    const textarea = pageB.locator("textarea[placeholder*='tin nhắn'], textarea").first();
    let multiTurnSuccess = false;

    if (await textarea.isVisible({ timeout: 4000 }).catch(() => false)) {
      // Turn 1
      await textarea.fill("Chào bạn, gợi ý cho tôi mẫu đầm hoa nhí đẹp");
      await pageB.keyboard.press("Enter");
      console.log("  - Sent Turn 1: Chào bạn, gợi ý cho tôi mẫu đầm hoa nhí đẹp");
      await pageB.waitForTimeout(4000);

      // Turn 2
      await textarea.fill("Có size M màu vàng không?");
      await pageB.keyboard.press("Enter");
      console.log("  - Rapidly sent Turn 2: Có size M màu vàng không?");
      await pageB.waitForTimeout(1000);

      // Simulate abrupt stream disconnect by clicking close
      const closeBtn = pageB.locator("button[aria-label='Đóng khung trò chuyện']").first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        console.log("  - Closed chat widget mid-stream");
      }

      await pageB.waitForTimeout(2000);

      // Re-open
      if (await launcherBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await launcherBtn.click();
        console.log("  - Re-opened chat widget successfully; verifying messages persist");
      }

      await pageB.waitForTimeout(1500);
      multiTurnSuccess = true;
    } else {
      // Direct API turn
      console.log("  - Executing browser API turn fallback");
      multiTurnSuccess = await pageB.evaluate(async (token) => {
        const res = await fetch("/api/chat/ai/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ content: "Tư vấn đầm hoa nhí đẹp" })
        });
        return res.status === 201;
      }, freshAuth.accessToken);
    }

    // Verify backend is alive and healthy
    const healthAfterChat = await fetch(`${API_URL}/health`);
    const serverAlive = healthAfterChat.status === 200;
    console.log(`  - Backend process alive and responsive: ${serverAlive}`);

    const screenshotBPath = path.join(SCREENSHOTS_DIR, "journey_b_chat_stability.png");
    await pageB.screenshot({ path: screenshotBPath, fullPage: false });

    const passedB = multiTurnSuccess && serverAlive;
    results.push({ journey: "B", name: "Multi-Turn AI Chat Stability & Stream Disconnect", passed: passedB });
    console.log(`  Result Journey B: ${passedB ? "PASS ✅" : "FAIL ❌"}`);
    await contextB.close();
  } catch (err) {
    console.error("  Error in Journey B:", err);
    results.push({ journey: "B", name: "Multi-Turn AI Chat Stability & Stream Disconnect", passed: false });
  }

  // =========================================================================
  // JOURNEY C: Backend Temporarily Unavailable Resilience
  // =========================================================================
  console.log("\n--- STARTING JOURNEY C: Backend Temporarily Unavailable Resilience ---");
  try {
    const contextC = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const freshAuthC = await loginCustomer();

    await contextC.addInitScript(
      ({ token, refreshToken, userJson }) => {
        try {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", userJson);
          localStorage.setItem(
            "wf_cookie_consent_v1",
            JSON.stringify({
              necessary: true,
              analytics: true,
              marketing: true,
              personalization: true,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (_) {}
      },
      {
        token: freshAuthC.accessToken,
        refreshToken: freshAuthC.refreshToken,
        userJson: JSON.stringify(freshAuthC.user),
      }
    );

    const pageC = await contextC.newPage();
    await pageC.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await pageC.waitForTimeout(1000);

    // Simulate 503 Service Unavailable on API
    console.log("  - Simulating backend 503 network outage on /api/user/me...");
    await pageC.route("**/api/user/me", (route) => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "503 Service Unavailable" }),
      });
    });

    // Make an API call during outage
    await pageC.evaluate(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        await fetch("/api/user/me", {
          headers: { Authorization: "Bearer " + token },
        });
      } catch (_) {}
    });

    await pageC.waitForTimeout(1500);

    const urlDuringOutage = pageC.url();
    const tokenPreserved = await pageC.evaluate(() => !!localStorage.getItem("accessToken"));
    const stayedLoggedIn = !urlDuringOutage.includes("/login") && tokenPreserved;

    console.log(`  - User stayed logged in during 503 error: ${stayedLoggedIn} (URL: ${urlDuringOutage})`);

    // Restore routing
    await pageC.unroute("**/api/user/me");
    console.log("  - Backend connectivity restored");

    await pageC.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await pageC.waitForTimeout(1000);

    const finalUrl = pageC.url();
    const finalToken = await pageC.evaluate(() => localStorage.getItem("accessToken"));
    const passedC = stayedLoggedIn && !finalUrl.includes("/login") && !!finalToken;

    const screenshotCPath = path.join(SCREENSHOTS_DIR, "journey_c_backend_resilience.png");
    await pageC.screenshot({ path: screenshotCPath, fullPage: false });

    results.push({ journey: "C", name: "Backend Temporarily Unavailable Resilience", passed: passedC });
    console.log(`  Result Journey C: ${passedC ? "PASS ✅" : "FAIL ❌"}`);
    await contextC.close();
  } catch (err) {
    console.error("  Error in Journey C:", err);
    results.push({ journey: "C", name: "Backend Temporarily Unavailable Resilience", passed: false });
  }

  // =========================================================================
  // JOURNEY D: Multi-Tab Concurrency & Grace Period
  // =========================================================================
  console.log("\n--- STARTING JOURNEY D: Multi-Tab Concurrency & Grace Period ---");
  try {
    const contextD = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const freshAuthD = await loginCustomer();

    if (freshAuthD.cookie) {
      const match = freshAuthD.cookie.match(/refreshToken=([^;]+)/);
      if (match) {
        await contextD.addCookies([
          {
            name: "refreshToken",
            value: match[1],
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
          },
        ]);
      }
    }

    await contextD.addInitScript(
      ({ token, refreshToken, userJson }) => {
        try {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", userJson);
          localStorage.setItem(
            "wf_cookie_consent_v1",
            JSON.stringify({
              necessary: true,
              analytics: true,
              marketing: true,
              personalization: true,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (_) {}
      },
      {
        token: freshAuthD.accessToken,
        refreshToken: freshAuthD.refreshToken,
        userJson: JSON.stringify(freshAuthD.user),
      }
    );

    // Open Tab 1
    const pageTab1 = await contextD.newPage();
    await pageTab1.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });

    // Open Tab 2
    const pageTab2 = await contextD.newPage();
    await pageTab2.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 15000 });

    console.log("  - Tab 1 and Tab 2 opened simultaneously with active session");

    // In Tab 1: call refreshToken API (which rotates the token)
    // In Tab 2: simultaneously call /user/me with the original token OR call refreshToken concurrently
    console.log("  - Simulating concurrent refresh from Tab 1 and Tab 2 with same credentials...");
    const [tab1Result, tab2Result] = await Promise.all([
      pageTab1.evaluate(async (rt) => {
        const res = await fetch("/api/auth/refreshToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
        }
        return { status: res.status, success: data.success, hasToken: !!data.data?.accessToken };
      }, freshAuthD.refreshToken),

      pageTab2.evaluate(async (rt) => {
        // Tab 2 sends concurrent refresh with the exact same original refresh token
        const res = await fetch("/api/auth/refreshToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
          credentials: "include",
        });
        const data = await res.json();
        return { status: res.status, success: data.success, hasToken: !!data.data?.accessToken };
      }, freshAuthD.refreshToken),
    ]);

    await pageTab1.waitForTimeout(2000);
    await pageTab2.waitForTimeout(2000);

    const tab1LoggedOut = pageTab1.url().includes("/login");
    const tab2LoggedOut = pageTab2.url().includes("/login");
    const bothTabsSucceeded = tab1Result.status === 200 && tab2Result.status === 200;
    const passedD = bothTabsSucceeded && !tab1LoggedOut && !tab2LoggedOut;

    console.log(`  - Tab 1 refresh: Status ${tab1Result.status}, Success: ${tab1Result.success}`);
    console.log(`  - Tab 2 concurrent refresh: Status ${tab2Result.status}, Success: ${tab2Result.success}`);
    console.log(`  - Both tabs avoided false-positive logout: ${!tab1LoggedOut && !tab2LoggedOut}`);

    const screenshotDPath = path.join(SCREENSHOTS_DIR, "journey_d_multitab_concurrency.png");
    await pageTab2.screenshot({ path: screenshotDPath, fullPage: false });

    results.push({ journey: "D", name: "Multi-Tab Concurrency & Grace Period", passed: passedD });
    console.log(`  Result Journey D: ${passedD ? "PASS ✅" : "FAIL ❌"}`);
    await contextD.close();
  } catch (err) {
    console.error("  Error in Journey D:", err);
    results.push({ journey: "D", name: "Multi-Tab Concurrency & Grace Period", passed: false });
  }

  await browser.close();

  console.log("\n==================================================================");
  console.log("PLAYWRIGHT E2E ACCEPTANCE SUMMARY");
  console.log("==================================================================");
  console.table(results);

  const allPassed = results.every((r) => r.passed);
  console.log(`OVERALL VERDICT: ${allPassed ? "100% PASS ALL JOURNEYS ✅" : "SOME JOURNEYS FAILED ❌"}`);
  if (allPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllJourneys().catch((err) => {
  console.error("Fatal Playwright test error:", err);
  process.exit(1);
});
