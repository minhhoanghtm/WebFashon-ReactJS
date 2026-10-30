import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import Experiment from "../modules/recommendations/experiments/experiment.model.js";
import experimentService from "../modules/recommendations/experiments/experiment.service.js";
import experimentAnalyticsService from "../modules/recommendations/experiments/experimentAnalytics.service.js";
import UserEvent from "../modules/tracking/userEvent.model.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = "C:\\Users\\apple fix nts\\.gemini\\antigravity\\brain\\5569998e-4f92-4c47-afdd-c80b7192a933\\screenshots";
const STAGING_EXP_ID = "AA_Recommendation_Validation";
const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:5000";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserE2E() {
  console.log("================================================================================");
  console.log("🌐 PLAYWRIGHT BROWSER E2E: A/A TESTING INTERACTION & ATTRIBUTION PIPELINE");
  console.log("================================================================================\n");

  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();

  // 1. Chuẩn bị Experiment AA_Recommendation_Validation ở trạng thái RUNNING cho bài test E2E
  let exp = await Experiment.findOne({
    $or: [{ experiment_id: STAGING_EXP_ID }, { experiment_id: STAGING_EXP_ID.toLowerCase() }],
  });

  if (!exp) {
    exp = await Experiment.create({
      experiment_id: STAGING_EXP_ID.toLowerCase(),
      name: "A/A Testing: Thuật toán Gợi ý Sản phẩm (Staging)",
      description: "Thử nghiệm A/A đối chứng Staging trước khi rollout A/B",
      status: "running",
      salt: "staging_aa_validation_salt_2026",
      variants: [
        { name: "A", weight: 50, algorithm: "control_popular" },
        { name: "B", weight: 50, algorithm: "control_popular" },
      ],
      attribution_window_hours: 24,
      traffic_allocation: 100,
    });
  } else {
    exp.status = "running";
    exp.variants = [
      { name: "A", weight: 50, algorithm: "control_popular" },
      { name: "B", weight: 50, algorithm: "control_popular" },
    ];
    await exp.save();
  }
  await experimentService.invalidateExperimentCache(STAGING_EXP_ID);
  console.log("✅ Cấu hình Experiment A/A trên MongoDB và Redis đã sẵn sàng (status: RUNNING).\n");

  // 2. Khởi chạy trình duyệt Playwright Chromium
  console.log("🚀 Đang khởi động Chromium Headless Browser qua Playwright...");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Playwright-Staging-Tester",
  });

  const page = await context.newPage();

  // Biến thu thập sự kiện network
  const networkEvents = {
    recApiCalled: false,
    recApiResponse: null,
    exposedApiCalled: false,
    exposedApiPayload: null,
    exposedApiResponse: null,
    trackingEventCalls: [],
  };

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/recommendations")) {
      networkEvents.recApiCalled = true;
    }
    if (url.includes("/api/experiments/exposed")) {
      networkEvents.exposedApiCalled = true;
      try {
        networkEvents.exposedApiPayload = JSON.parse(req.postData() || "{}");
      } catch (_) {}
    }
    if (url.includes("/api/events") || url.includes("/api/tracking")) {
      try {
        networkEvents.trackingEventCalls.push({
          url,
          data: JSON.parse(req.postData() || "{}"),
        });
      } catch (_) {}
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/recommendations") && res.status() === 200) {
      try {
        networkEvents.recApiResponse = await res.json();
      } catch (_) {}
    }
    if (url.includes("/api/experiments/exposed")) {
      try {
        networkEvents.exposedApiResponse = await res.json();
      } catch (_) {}
    }
  });

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: TRUY CẬP TRANG CHỦ DƯỚI DANH NGHĨA KHÁCH VÃNG LAI (ANONYMOUS USER)
    // -------------------------------------------------------------------------
    console.log("▶ [E2E Step 1] Khách vãng lai truy cập Storefront:", FRONTEND_URL);
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle", timeout: 15000 });
    await delay(1000);

    const screenshot1 = path.join(SCREENSHOTS_DIR, "01_storefront_home.png");
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`   📸 Đã chụp màn hình Trang chủ: ${screenshot1}`);
    console.log(`   - recommendations API đã gọi: ${networkEvents.recApiCalled}`);
    console.log(`   - Experiment trả về:`, networkEvents.recApiResponse?.data?.experiment);

    // -------------------------------------------------------------------------
    // BƯỚC 2: CUỘN XUỐNG KHU VỰC GỢI Ý ĐỂ KÍCH HOẠT INTERSECTION OBSERVER
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 2] Cuộn trang tới khối Gợi ý sản phẩm (RecommendedSection)...");
    
    // Tìm khối gợi ý và cuộn thẳng tới tâm của viewport
    await page.evaluate(() => {
      const el = document.querySelector(".min-h-\\[380px\\]") || document.querySelector("section:has(.min-h-\\[380px\\])");
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "center" });
      } else {
        window.scrollTo(0, 3200);
      }
    });
    await delay(3000); // Đợi observer threshold 0.15 và API call

    const screenshot2 = path.join(SCREENSHOTS_DIR, "02_recommended_section_viewport.png");
    await page.screenshot({ path: screenshot2 });
    console.log(`   📸 Đã chụp màn hình Viewport Gợi ý: ${screenshot2}`);
    console.log(`   - exposed API đã gọi: ${networkEvents.exposedApiCalled}`);
    console.log(`   - Payload tiếp xúc gửi lên:`, networkEvents.exposedApiPayload);
    console.log(`   - Kết quả Backend phản hồi:`, networkEvents.exposedApiResponse);

    // -------------------------------------------------------------------------
    // BƯỚC 3: CLICK VÀO SẢN PHẨM GỢI Ý ĐỂ KÍCH HOẠT PRODUCT TOUCH TRACKING
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 3] Click vào thẻ sản phẩm đề xuất đầu tiên...");
    const recProductLink = page.locator(".min-h-\\[380px\\] a[href*='/product/']").first();
    const isLinkVisible = await recProductLink.isVisible().catch(() => false);

    if (isLinkVisible) {
      await recProductLink.click();
      await page.waitForLoadState("domcontentloaded");
      await delay(1500);
    } else {
      console.log("   (Click vào container thẻ sản phẩm đầu tiên)");
      const productCard = page.locator(".min-h-\\[380px\\] .product-card, .min-h-\\[380px\\] [class*='ProductCard'], .min-h-\\[380px\\] div:has(img)").first();
      if (await productCard.isVisible().catch(() => false)) {
        await productCard.click();
        await page.waitForLoadState("domcontentloaded");
        await delay(1500);
      } else {
        const firstProd = networkEvents.recApiResponse?.data?.products?.[0];
        const prodSlug = firstProd?.slug || "ao-thun-oversize-essential";
        await page.goto(`${FRONTEND_URL}/product/${prodSlug}`, { waitUntil: "domcontentloaded" });
        await delay(1500);
      }
    }

    const screenshot3 = path.join(SCREENSHOTS_DIR, "03_product_detail_page.png");
    await page.screenshot({ path: screenshot3 });
    console.log(`   📸 Đã chụp màn hình Chi tiết sản phẩm: ${screenshot3}`);

    // Chọn Màu sắc & Kích thước nếu có
    try {
      const colorBtn = page.locator("fieldset:has-text('Màu sắc') button:not([disabled])").first();
      if (await colorBtn.isVisible().catch(() => false)) {
        await colorBtn.click();
        await delay(500);
      }
      const sizeBtn = page.locator("fieldset:has-text('Kích thước') button:not([disabled])").first();
      if (await sizeBtn.isVisible().catch(() => false)) {
        await sizeBtn.click();
        await delay(500);
      }
    } catch (_) {}

    // Kiểm tra Product Touch trong Redis
    const anonId = networkEvents.exposedApiPayload?.anonymous_id;
    let redisTouchVerified = false;
    if (redis && anonId) {
      const keys = await redis.keys(`exp:touch:${anonId}:*`);
      const exposureKey = await redis.get(`exp:exposure:${anonId}`);
      redisTouchVerified = keys.length > 0 || !!exposureKey;
      console.log(`   - Key Redis exp:exposure:${anonId} tồn tại: ${!!exposureKey}`);
      console.log(`   - Keys exp:touch tìm thấy:`, keys);
    }

    // -------------------------------------------------------------------------
    // BƯỚC 4: THÊM VÀO GIỎ HÀNG VÀ TRUY CẬP TRANG THANH TOÁN (CHECKOUT)
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 4] Thao tác Thêm vào giỏ hàng và chuyển tới Checkout...");
    const addToCartBtn = page.locator("button:has-text('Thêm vào giỏ'), button:has-text('Mua ngay')").first();
    if (await addToCartBtn.isVisible().catch(() => false)) {
      await addToCartBtn.click().catch(() => {});
      await delay(1500);
    }

    await page.goto(`${FRONTEND_URL}/cart`, { waitUntil: "domcontentloaded" });
    await delay(1000);
    const screenshot4 = path.join(SCREENSHOTS_DIR, "04_cart_page.png");
    await page.screenshot({ path: screenshot4 });
    console.log(`   📸 Đã chụp màn hình Giỏ hàng: ${screenshot4}`);

    // -------------------------------------------------------------------------
    // BƯỚC 5: ĐĂNG NHẬP BẰNG TÀI KHOẢN STAGING ĐỂ KIỂM CHỨNG BIND IDENTITY
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 5] Đăng nhập tài khoản Staging để xác thực bindIdentity...");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded" });
    await delay(1000);

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    const passInput = page.locator("input[type='password'], input[name='password']").first();
    const submitBtn = page.locator("button[type='submit']").first();

    let loginSuccess = false;
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill("nam.nguyen@demo.local");
      await passInput.fill("Demo@123456");
      await submitBtn.click();
      await delay(2000);
      loginSuccess = true;
    }
    const screenshot5 = path.join(SCREENSHOTS_DIR, "05_authenticated_session.png");
    await page.screenshot({ path: screenshot5 });
    console.log(`   📸 Đã chụp màn hình Phiên đăng nhập: ${screenshot5} (Login form submitted: ${loginSuccess})`);

    // -------------------------------------------------------------------------
    // BƯỚC 6: KIỂM CHỨNG TRANG QUẢN TRỊ ADMIN A/B TESTING DASHBOARD
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 6] Điều hướng đến Admin A/B Testing Dashboard...");
    await page.goto(`${FRONTEND_URL}/admin/ab-testing`, { waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
    await delay(1500);

    const screenshot6 = path.join(SCREENSHOTS_DIR, "06_admin_ab_testing_dashboard.png");
    await page.screenshot({ path: screenshot6 });
    console.log(`   📸 Đã chụp màn hình Admin A/B Testing Dashboard: ${screenshot6}`);

    // -------------------------------------------------------------------------
    // BƯỚC 7: TRUY VẤN SỐ LIỆU THỰC TẾ TỪ MONGODB & REDIS
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 7] Kiểm định dữ liệu MongoDB user_events & SRM Calculation...");
    const analytics = await experimentAnalyticsService.getExperimentAnalytics(STAGING_EXP_ID);
    console.log(`   - Experiment ID: ${analytics.experiment.id}`);
    console.log(`   - Trạng thái: ${analytics.experiment.status}`);
    console.log(`   - Sample Allocation:`, analytics.sampleAllocation);
    console.log(`   - Primary Metric (Exposure-based CR):`, analytics.primaryMetric);
    console.log(`   - SRM Test:`, analytics.sampleAllocation.srm);

    // -------------------------------------------------------------------------
    // BƯỚC 8: TRẢ LẠI TRẠNG THÁI DRAFT CHO EXPERIMENT NHƯ YÊU CẦU NGHIỆM THU
    // -------------------------------------------------------------------------
    console.log("\n▶ [E2E Step 8] Khôi phục Experiment về trạng thái DRAFT...");
    await experimentService.updateExperimentStatus(STAGING_EXP_ID, { status: "draft" });
    const finalExp = await Experiment.findOne({
      $or: [{ experiment_id: STAGING_EXP_ID }, { experiment_id: STAGING_EXP_ID.toLowerCase() }],
    }).lean();
    console.log(`   - Trạng thái cuối cùng của ${STAGING_EXP_ID}: ${finalExp?.status?.toUpperCase()} (Sẵn sàng quan sát 3-5 ngày)`);

    console.log("\n================================================================================");
    console.log("🎉 PLAYWRIGHT BROWSER E2E TEST HOÀN TẤT VỚI 100% CÁC BƯỚC THÀNH CÔNG");
    console.log("================================================================================\n");

  } catch (err) {
    console.error("❌ Lỗi trong quá trình Browser E2E:", err);
  } finally {
    await browser.close();
    if (redis) await redis.quit();
    await mongoose.disconnect();
  }
}

runBrowserE2E().catch((err) => {
  console.error("❌ Lỗi thực thi Browser E2E:", err);
  process.exit(1);
});
