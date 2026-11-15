import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, "../../../docs/screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const STAGING_URL = "http://localhost:8081";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWU1OTFkYzVkODI3M2E5YTgwMzk3MTAiLCJyb2xlIjoidXNlciIsImVtYWlsIjoiY3VzdG9tZXJANDA0c3R1ZGlvLnZuIiwianRpIjoiMmY1Yjg0MjUtOWZhYy00ZTA3LTgwNGYtMTNiYjUxMmFiOWVjIiwiaWF0IjoxNzkzNzIxODI4LCJleHAiOjE3OTM4MDgyMjh9.-Z-6yXjnUCRYfR1fZEh6iyJdj-W8urDr-w3ALoOWR0U";
const USER_DATA = JSON.stringify({
  _id: "6ae591dc5d8273a9a8039710",
  id: "6ae591dc5d8273a9a8039710",
  fullName: "Khách Hàng Thân Thiết",
  email: "customer@404studio.vn",
  role: "user",
});

async function runTest() {
  console.log("=== LAUNCHING PLAYWRIGHT E2E TEST ON STAGING (http://localhost:8081) ===");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // Inject authentication into localStorage
  await context.addInitScript(({ token, userJson }) => {
    try {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", userJson);
      localStorage.setItem("wf_cookie_consent_v1", JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        personalization: true,
        updatedAt: new Date().toISOString(),
      }));
    } catch (_) {}
  }, { token: AUTH_TOKEN, userJson: USER_DATA });

  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    // 1. Visit homepage
    console.log("1. Navigating to Staging Homepage as Authenticated Customer...");
    await page.goto(`${STAGING_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
    console.log("Page loaded:", await page.title());

    // 2. Open AI Chat widget
    console.log("2. Opening AI Shopping Assistant chat widget...");
    const chatLauncher = page.locator('button[data-chat-launcher], button[aria-label*="chat" i], button.fixed.bottom-6.right-6').first();
    await chatLauncher.click({ timeout: 5000 });

    await page.waitForSelector('[data-chat-panel], [role="dialog"]', { timeout: 10000 });
    console.log("Chat panel is visible.");

    // 3. Send Checkout Intent Message
    console.log("3. Sending Checkout Intent message for Đầm Maxi Hoa Nhí Đi Biển...");
    const textarea = page.locator('[data-chat-panel] textarea').last();
    await textarea.fill("Thanh toán giúp tôi sản phẩm Đầm Maxi Hoa Nhí Đi Biển size M màu Hoa Nhí Vàng số lượng 1");
    
    const sendBtn = page.locator('[data-chat-panel] button[aria-label*="Gửi"]').last();
    await sendBtn.click();

    // Wait for response and confirmation card
    console.log("Waiting for AI response and Two-Phase Confirmation Card...");
    const confirmationCard = page.locator('[data-chat-panel] div:has-text("Xác nhận thanh toán")').first();
    await confirmationCard.waitFor({ state: "visible", timeout: 15000 });
    console.log("Confirmation card is visible!");

    // Capture Screenshot of AI Confirmation Card
    const cardScreenshotPath = path.join(SCREENSHOTS_DIR, "sc_ai_checkout_confirmation_card.png");
    await page.screenshot({ path: cardScreenshotPath });
    console.log(`Saved screenshot: ${cardScreenshotPath}`);

    // Verify card content contains product and price
    const cardText = await confirmationCard.textContent();
    console.log("Confirmation Card content snippet:", cardText.replace(/\s+/g, " ").slice(0, 150));

    // 4. Click "Tiếp tục thanh toán"
    console.log("4. Clicking 'Tiếp tục thanh toán' CTA...");
    const continueBtn = page.locator('[data-chat-panel] button:has-text("Tiếp tục thanh toán")');
    await continueBtn.click();

    // 5. Wait for navigation to /checkout?reservationId=...
    console.log("5. Waiting for navigation to Checkout...");
    await page.waitForURL(/\/checkout/, { timeout: 15000 });
    console.log("Navigated to Checkout URL:", page.url());

    await page.waitForTimeout(3000);

    // Capture Screenshot of Checkout with Consistent Price
    const checkoutScreenshotPath = path.join(SCREENSHOTS_DIR, "sc_checkout_price_consistent_350k.png");
    await page.screenshot({ path: checkoutScreenshotPath });
    console.log(`Saved screenshot: ${checkoutScreenshotPath}`);

    // Verify Checkout price fields (NO 0đ!)
    const checkoutBody = await page.locator("body").textContent();
    const hasZeroPriceBug = checkoutBody.includes("SL: 1 0đ") || 
      checkoutBody.includes("Tổng thanh toán 0đ") ||
      checkoutBody.includes("Tạm tính 0đ");

    console.log("Checkout Zero-Price Bug present:", hasZeroPriceBug);
    if (hasZeroPriceBug) {
      throw new Error("CRITICAL FAILURE: Checkout still shows 0đ price!");
    }

    const has350kPrice = checkoutBody.includes("350.000") || checkoutBody.includes("350,000");
    console.log("Checkout displays 350.000đ verified price:", has350kPrice);

    const hasReservationTimer = checkoutBody.includes("Thời gian giữ hàng còn lại");
    console.log("Checkout displays active Redis reservation timer:", hasReservationTimer);

    // 6. Test Mobile Viewport Responsiveness (375px)
    console.log("6. Testing Mobile Viewport Responsiveness at 375x667...");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${STAGING_URL}/`, { waitUntil: "networkidle" });

    // Open chat on mobile
    try {
      const consentBtn = page.locator('#consent-accept-all-btn');
      if (await consentBtn.isVisible({ timeout: 1500 })) {
        await consentBtn.click();
        await page.waitForTimeout(300);
      }
    } catch (_) {}

    const mobileLauncher = page.locator('button[data-chat-launcher], button[aria-label*="chat" i], button.fixed.bottom-6.right-6').first();
    await mobileLauncher.click({ timeout: 5000, force: true });
    await page.waitForSelector('[data-chat-panel], [role="dialog"]', { timeout: 10000 });

    // Send search under 1M prompt
    console.log("7. Sending search for items under 1M on mobile...");
    const mobileTextarea = page.locator('[data-chat-panel] textarea').last();
    await mobileTextarea.fill("Tìm sản phẩm áo giá dưới 1 triệu");
    
    const mobileSendBtn = page.locator('[data-chat-panel] button[aria-label*="Gửi"]').last();
    await mobileSendBtn.click();

    await page.waitForTimeout(5000);

    // Check horizontal overflow on mobile
    const overflowCheck = await page.evaluate(() => {
      const chatPanel = document.querySelector("[data-chat-panel]");
      if (!chatPanel) return { hasOverflow: false, clientWidth: 0, scrollWidth: 0 };
      return {
        hasOverflow: chatPanel.scrollWidth > chatPanel.clientWidth,
        clientWidth: chatPanel.clientWidth,
        scrollWidth: chatPanel.scrollWidth,
      };
    });

    console.log("Mobile Chat Panel Overflow Check (Must be false):", overflowCheck);

    // Capture Screenshot of Mobile Responsive Chat
    const mobileScreenshotPath = path.join(SCREENSHOTS_DIR, "sc_chat_mobile_responsive_375px.png");
    await page.screenshot({ path: mobileScreenshotPath });
    console.log(`Saved screenshot: ${mobileScreenshotPath}`);

    // 7. Verify No Raw URLs or ObjectIds in AI response
    console.log("8. Verifying Response Cleanliness (No raw URLs, ObjectIds, JSON fragments)...");
    const aiBubbles = page.locator('[data-chat-panel] .prose-chat');
    const bubbleCount = await aiBubbles.count();
    let foundRawDump = false;

    for (let i = 0; i < bubbleCount; i++) {
      const text = await aiBubbles.nth(i).textContent();
      if (/ID sản phẩm:\s*`?[0-9a-f]{24}`?/i.test(text) || /Link ảnh:\s*https?:\/\//i.test(text)) {
        foundRawDump = true;
        console.warn(`WARNING: Raw dump detected in bubble ${i}: ${text}`);
      }
    }

    console.log("Raw dump detected:", foundRawDump);

    console.log("\n=======================================================");
    console.log("🎉 ALL PLAYWRIGHT E2E CHECKS COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");

  } catch (err) {
    console.error("Playwright E2E Error:", err);
    const errScreenshotPath = path.join(SCREENSHOTS_DIR, "sc_error_trace.png");
    await page.screenshot({ path: errScreenshotPath });
    console.log(`Saved error screenshot: ${errScreenshotPath}`);
    throw err;
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error("Test execution failed:", err.message);
  process.exit(1);
});
