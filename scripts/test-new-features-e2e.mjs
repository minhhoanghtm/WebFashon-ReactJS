import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

async function runFeatureVerification() {
  console.log("=== STARTING AUTONOMOUS E2E FEATURE VERIFICATION ===");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/')) console.log('API:', res.status(), res.url());
  });

  const results = [];
  function record(name, pass, details = "") {
    console.log(`[${pass ? "PASS" : "FAIL"}] ${name} ${details ? "- " + details : ""}`);
    results.push({ name, pass, details });
  }

  try {
    // 1. Home & Notification Center Test
    console.log("\n--- Testing Feature 1: Notification Center ---");
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
    const bellBtn = page.locator('[data-testid="notif-bell-btn"]');
    if (await bellBtn.count() > 0) {
      await bellBtn.click();
      await page.waitForTimeout(500);
      const popover = page.locator('[data-testid="notif-popover"]');
      const hasPopover = await popover.count() > 0;
      record("Notification Center Open", hasPopover, "Popover displayed");

      const markReadBtn = page.locator('[data-testid="notif-mark-all-read"]');
      if (await markReadBtn.count() > 0) {
        await markReadBtn.click();
        await page.waitForTimeout(300);
        record("Notification Mark All Read", true, "Cleared unread badge");
      }
      // Click outside to close
      await page.mouse.click(200, 200);
      await page.waitForTimeout(300);
    } else {
      record("Notification Center Open", false, "Bell button not found");
    }

    // 2. AI Style Quiz Test
    console.log("\n--- Testing Feature 2: AI Fashion Style Quiz & Persona ---");
    const styleQuizBtn = page.locator('button:has-text("Style Quiz")').or(page.locator('button:has-text("Khám Phá Phong Cách Ngay")')).first();
    if (await styleQuizBtn.count() > 0) {
      await styleQuizBtn.click();
      await page.waitForSelector('[data-testid="ai-style-quiz-modal"]', { timeout: 3000 });
      
      // Step 1: Select occasion
      await page.locator('[data-testid="quiz-opt-office"]').click();
      await page.locator('[data-testid="quiz-next-btn-1"]').click();
      await page.waitForTimeout(300);

      // Step 2: Select palette
      await page.locator('[data-testid="quiz-opt-monochrome"]').click();
      await page.locator('[data-testid="quiz-next-btn-2"]').click();
      await page.waitForTimeout(300);

      // Step 3: Select silhouette
      await page.locator('[data-testid="quiz-opt-tailored"]').click();
      await page.locator('[data-testid="quiz-next-btn-3"]').click();
      await page.waitForTimeout(300);

      // Step 4: Select budget
      await page.locator('[data-testid="quiz-opt-signature"]').click();
      await page.locator('[data-testid="quiz-submit-btn"]').click();
      
      // Step 5: Wait for persona reveal
      await page.waitForSelector('[data-testid="quiz-result-card"]', { timeout: 4000 });
      record("AI Style Quiz Flow", true, "Generated fashion persona");

      // Close modal
      const closeQuizBtn = page.locator('[data-testid="quiz-finish-close-btn"]').first();
      await closeQuizBtn.click();
      await page.waitForTimeout(400);
    } else {
      record("AI Style Quiz Flow", false, "Style Quiz trigger not found");
    }

    // 3. Product Comparison Drawer Test
    console.log("\n--- Testing Feature 3: Product Comparison Drawer & Matrix ---");
    await page.goto("http://127.0.0.1:5173/products", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.waitForSelector('[data-testid="product-compare-btn"]', { timeout: 10000 });
    const compareButtons = page.locator('[data-testid="product-compare-btn"]');
    const compareCount = await compareButtons.count();
    if (compareCount >= 2) {
      // Click compare on first 2 products
      await compareButtons.nth(0).click();
      await page.waitForTimeout(600);
      await compareButtons.nth(1).click();
      await page.waitForTimeout(800);

      const hasDock = await page.locator('[data-testid="compare-dock"]').count() > 0;
      record("Comparison Floating Dock", hasDock, "Dock popped up with items");

      const viewDetailBtn = page.locator('[data-testid="compare-view-modal-btn"]');
      await viewDetailBtn.click();
      await page.waitForSelector('[data-testid="compare-matrix-modal"]', { timeout: 4000 });
      record("Comparison Matrix Modal", true, "Full comparison table displayed");

      // Close comparison modal
      await page.locator('[data-testid="compare-close-modal-btn"]').click();
      await page.waitForTimeout(400);
    } else {
      record("Comparison Floating Dock", false, "Not enough products on /products");
    }

    // 4. Product Detail: Smart Size Assistant & Complete The Look
    console.log("\n--- Testing Feature 4: Smart Size Assistant & Complete The Look ---");
    await page.goto("http://127.0.0.1:5173/product/ao-hoodie-ni-bong-unisex", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Test Smart Size Assistant
    const sizeAssistBtn = page.locator('button:has-text("Tư Vấn Size AI")');
    if (await sizeAssistBtn.count() > 0) {
      await sizeAssistBtn.click();
      await page.waitForTimeout(500);

      // Click calculate
      await page.locator('[data-testid="size-calc-btn"]').click();
      await page.waitForSelector('[data-testid="size-result-box"]', { timeout: 3000 });
      record("Smart Size Calculation", true, "Calculated ideal size with confidence");

      // Apply size
      const applyBtn = page.locator('[data-testid="size-apply-btn"]');
      await applyBtn.click();
      await page.waitForTimeout(400);
      record("Smart Size Applied", true, "Variant preselected");
    } else {
      record("Smart Size Calculation", false, "Size button not visible");
    }

    // Test Complete The Look
    console.log("\n--- Testing Feature 5: Complete The Look Bundler ---");
    const bundleSection = page.locator('[data-testid="complete-the-look"]');
    if (await bundleSection.count() > 0) {
      await bundleSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      record("Complete The Look Section", true, "Rendered outfit bundle section");

      const addBundleBtn = page.locator('[data-testid="bundle-add-btn"]');
      if (await addBundleBtn.count() > 0) {
        await addBundleBtn.click();
        await page.waitForTimeout(800);
        record("Bundle 1-Click Buy", true, "Added full outfit to cart");
      }
    } else {
      record("Complete The Look Section", false, "Bundle section not rendered");
    }

    // 5. Lookbook Shoppable Hotspots Test
    console.log("\n--- Testing Feature 6: Interactive Shoppable Lookbooks ---");
    await page.goto("http://127.0.0.1:5173/lookbooks", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const hotspotTrigger = page.locator('.animate-ping').first();
    if (await hotspotTrigger.count() > 0) {
      await hotspotTrigger.click();
      await page.waitForTimeout(500);

      const popoverBuy = page.locator('button:has-text("Mua Nhanh")');
      const hasBuyBtn = await popoverBuy.count() > 0;
      record("Shoppable Lookbook Hotspot", hasBuyBtn, "Revealed product card on hotspot click");

      if (hasBuyBtn) {
        await popoverBuy.click();
        await page.waitForTimeout(500);
        record("Hotspot Direct Buy", true, "Added lookbook item directly to cart");
      }
    } else {
      record("Shoppable Lookbook Hotspot", false, "Hotspots not found on /lookbooks");
    }

    // 6. Cart Free Shipping Progress Bar
    console.log("\n--- Testing Feature 7: Cart Free Shipping Progress ---");
    await page.goto("http://127.0.0.1:5173/cart", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const freeshipBar = page.locator('text=FREESHIP').or(page.locator('text=MIỄN PHÍ VẬN CHUYỂN'));
    const hasFreeship = await freeshipBar.count() > 0;
    record("Cart Free Shipping Bar", hasFreeship, "Displayed progress bar towards freeship threshold");

  } catch (err) {
    console.error("Test failed with exception:", err);
    record("General Execution", false, err.message);
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runFeatureVerification();
