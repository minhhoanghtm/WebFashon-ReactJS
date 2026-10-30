import http from "http";
import express from "express";
import { chromium } from "playwright";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import experimentService, { DEFAULT_REC_EXPERIMENT_ID, AA_EXPERIMENT_ID } from "../modules/recommendations/experiments/experiment.service.js";
import recommendationRouter from "../modules/recommendations/recommendation.route.js";
import experimentRouter from "../modules/recommendations/experiments/experiment.route.js";
import trackingRouter from "../modules/tracking/tracking.route.js";

async function runBrowserE2EValidation() {
  console.log("================================================================================");
  console.log("🌐 PLAYWRIGHT BROWSER E2E TEST: REAL BROWSER A/A & A/B VALIDATION");
  console.log("================================================================================\n");

  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();

  // 1. Khởi tạo Express Test Server phục vụ API & Client HTML
  const app = express();
  app.use(express.json());

  // Mount API routes
  app.use("/api/recommendations", recommendationRouter);
  app.use("/api/experiments", experimentRouter);
  app.use("/api/events", trackingRouter);

  // Serve Single-Page Test Shell mô phỏng Storefront React
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>REACT-WebFashion Storefront Test Shell</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; background: #faf9f5; }
          .hero { height: 600px; background: #05251C; color: #FAF9F5; display: flex; align-items: center; justify-content: center; border-radius: 16px; margin-bottom: 40px; }
          .rec-container { min-height: 350px; background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #e8e5df; }
          .product-card { display: inline-block; width: 220px; padding: 16px; margin-right: 16px; border: 1px solid #e8e5df; border-radius: 12px; cursor: pointer; }
          .product-card:hover { border-color: #05251C; }
        </style>
      </head>
      <body>
        <div class="hero">
          <h1>404Studio Atelier - New Collection 2026</h1>
        </div>

        <div id="danh-cho-ban" class="rec-container">
          <h2 id="rec-title">Đang tải đề xuất...</h2>
          <div id="rec-products"></div>
        </div>

        <script>
          let currentExperiment = null;
          let currentProducts = [];

          async function loadRecommendations(anonId) {
            const res = await fetch('/api/recommendations?limit=4', {
              headers: { 'x-anonymous-id': anonId }
            });
            const data = await res.json();
            currentExperiment = data?.data?.experiment || {};
            window.currentExperiment = currentExperiment;
            currentProducts = data?.data?.products || [];

            document.getElementById('rec-title').innerText = 
              'CHAPTER 04 · ' + (data?.data?.mode === 'popular' ? 'Đang được yêu thích' : 'Dành riêng cho bạn');

            const container = document.getElementById('rec-products');
            container.innerHTML = '';
            currentProducts.forEach((p, idx) => {
              const div = document.createElement('div');
              div.className = 'product-card';
              div.id = 'product-card-' + idx;
              div.setAttribute('data-product-id', p._id || p.id);
              div.innerHTML = '<strong>' + (p.name || 'Sản phẩm') + '</strong><br/><span>' + (p.price || 0).toLocaleString('vi-VN') + ' đ</span>';
              div.onclick = () => onProductClick(p, idx);
              container.appendChild(div);
            });

            // Viewport Exposure Observer
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting && currentExperiment?.variant) {
                  fetch('/api/experiments/exposed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-anonymous-id': anonId },
                    body: JSON.stringify({
                      experiment_id: currentExperiment.experiment_id,
                      variant: currentExperiment.variant,
                      request_id: currentExperiment.request_id,
                      meta: { source: 'browser_e2e_viewport' }
                    })
                  }).then(() => {
                    window.__EXPOSURE_SENT = true;
                  });
                  observer.disconnect();
                }
              });
            }, { threshold: 0.2 });

            observer.observe(document.getElementById('danh-cho-ban'));
          }

          function onProductClick(p, idx) {
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-anonymous-id': window.__ANON_ID },
              body: JSON.stringify({
                event_type: 'recommendation_clicked',
                product_id: p._id || p.id,
                source: 'storefront_recommendation_card',
                meta: {
                  experiment_id: currentExperiment?.experiment_id,
                  variant: currentExperiment?.variant,
                  position: idx + 1
                }
              })
            }).then(() => {
              window.__CLICK_RECORDED = true;
            });
          }
        </script>
      </body>
      </html>
    `);
  });

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(5099, resolve));
  console.log("✅ Express Test Server đang chạy tại http://localhost:5099");

  // 2. Khởi chạy Playwright Chromium
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const e2eResults = [];

  try {
    // -------------------------------------------------------------------------
    // BROWSER E2E TEST 1: STOREFRONT LOAD & VIEWPORT EXPOSURE
    // -------------------------------------------------------------------------
    console.log("\n▶ [Browser E2E 1] Tải trang Storefront & Kích hoạt Viewport Exposure");
    const testAnonId = "playwright_browser_visitor_001";
    await page.goto("http://localhost:5099");
    await page.evaluate((anonId) => {
      window.__ANON_ID = anonId;
      window.loadRecommendations(anonId);
    }, testAnonId);

    // Chờ sản phẩm render
    await page.waitForSelector(".product-card", { timeout: 8000 });
    const productCount = await page.locator(".product-card").count();
    console.log(`   - Số lượng sản phẩm render trong card: ${productCount}`);

    // Cuộn màn hình tới khu vực danh sách gợi ý để kích hoạt IntersectionObserver
    await page.locator("#danh-cho-ban").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const exposureSent = await page.evaluate(() => window.__EXPOSURE_SENT === true);
    console.log(`   - Viewport Exposure đã phát tín hiệu tới Backend: ${exposureSent}`);
    e2eResults.push({ name: "Browser Viewport Exposure Trigger", passed: exposureSent && productCount > 0 });

    // -------------------------------------------------------------------------
    // BROWSER E2E TEST 2: CARD CLICK & TRACKING DISPATCH
    // -------------------------------------------------------------------------
    console.log("\n▶ [Browser E2E 2] Click Thẻ Gợi Ý & Xác nhận Ghi nhận Sự kiện Click");
    await page.locator("#product-card-0").click();
    await page.waitForTimeout(1000);

    const clickRecorded = await page.evaluate(() => window.__CLICK_RECORDED === true);
    console.log(`   - recommendation_clicked đã được gửi kèm experiment_id/variant: ${clickRecorded}`);
    e2eResults.push({ name: "Browser Recommendation Card Click", passed: clickRecorded });

    // -------------------------------------------------------------------------
    // BROWSER E2E TEST 3: RELOAD VARIANT CONSISTENCY IN REAL BROWSER
    // -------------------------------------------------------------------------
    console.log("\n▶ [Browser E2E 3] Kiểm tra Giữ nguyên Variant qua 5 lượt tải lại trang");
    let isConsistent = true;
    let initialVariant = null;

    for (let r = 1; r <= 5; r++) {
      await page.reload();
      await page.evaluate((anonId) => {
        window.__ANON_ID = anonId;
        window.loadRecommendations(anonId);
      }, testAnonId);
      await page.waitForSelector(".product-card");

      const exp = await page.evaluate(() => window.currentExperiment);
      if (!initialVariant) {
        initialVariant = exp?.variant;
      } else if (exp?.variant !== initialVariant) {
        isConsistent = false;
        break;
      }
    }
    console.log(`   - Variant qua 5 lượt reload trong browser: ${initialVariant} (Consistent: ${isConsistent})`);
    e2eResults.push({ name: "Browser Reload Sticky Invariance", passed: isConsistent && !!initialVariant });

    // -------------------------------------------------------------------------
    // BROWSER E2E TEST 4: KILL-SWITCH SHUTDOWN VIA ADMIN TOGGLE
    // -------------------------------------------------------------------------
    console.log("\n▶ [Browser E2E 4] Kiểm định Kill-Switch: Tạm dừng thử nghiệm lập tức chuyển về Control A");
    await experimentService.updateExperimentStatus(DEFAULT_REC_EXPERIMENT_ID, {
      status: "paused",
    });

    await page.reload();
    await page.evaluate((anonId) => {
      window.__ANON_ID = anonId;
      window.loadRecommendations(anonId);
    }, "playwright_emergency_visitor_999");
    await page.waitForSelector(".product-card");

    const pausedExp = await page.evaluate(() => window.currentExperiment);
    const killSwitchWorking = pausedExp?.variant === "A";
    console.log(`   - Variant trả về sau khi pause thử nghiệm: ${pausedExp?.variant} (Is Control A: ${killSwitchWorking})`);
    e2eResults.push({ name: "Browser Emergency Kill-switch Response", passed: killSwitchWorking });

    // Khôi phục trạng thái running
    await experimentService.updateExperimentStatus(DEFAULT_REC_EXPERIMENT_ID, {
      status: "running",
    });

  } finally {
    await browser.close();
    testServer.close();
  }

  console.log("\n================================================================================");
  console.log("🏁 KẾT QUẢ KIỂM THỬ PLAYWRIGHT BROWSER E2E");
  console.log("================================================================================");
  let allE2EPassed = true;
  e2eResults.forEach((r, idx) => {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} | Test ${idx + 1}: ${r.name}`);
    if (!r.passed) allE2EPassed = false;
  });
  console.log("================================================================================\n");

  if (redis) await redis.quit();
  await mongoose.disconnect();
}

runBrowserE2EValidation().catch((err) => {
  console.error("❌ Lỗi Playwright E2E:", err);
  process.exit(1);
});
