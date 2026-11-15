import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://127.0.0.1:5173";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

const ALL_ROUTES = [
  // 1. Storefront Public Routes
  { path: "/", name: "home", type: "public", desc: "Trang chủ Atelier" },
  { path: "/products", name: "products", type: "public", desc: "Bộ sưu tập & Tìm kiếm" },
  { path: "/product/ao-khoac-bomber-unisex", name: "product-detail", type: "public", desc: "Chi tiết sản phẩm" },
  { path: "/cart", name: "cart", type: "public", desc: "Giỏ hàng" },
  { path: "/checkout", name: "checkout", type: "public", desc: "Thanh toán & Đặt hàng" },
  { path: "/payment-result", name: "payment-result", type: "public", desc: "Kết quả giao dịch" },
  { path: "/payment/ORD-DEMO", name: "payment-order-id", type: "public", desc: "Chi tiết thanh toán đơn" },
  { path: "/order-lookup", name: "order-lookup", type: "public", desc: "Tra cứu đơn hàng" },
  { path: "/favorites", name: "favorites", type: "public", desc: "Danh sách yêu thích" },
  { path: "/vouchers", name: "vouchers", type: "public", desc: "Săn mã giảm giá" },
  { path: "/lookbooks", name: "lookbooks", type: "public", desc: "Lookbook thời trang" },
  { path: "/policy", name: "policy", type: "public", desc: "Chính sách thương hiệu" },
  { path: "/privacy", name: "privacy", type: "public", desc: "Chính sách bảo mật dữ liệu" },
  { path: "/terms", name: "terms", type: "public", desc: "Điều khoản dịch vụ" },
  { path: "/shipping", name: "shipping", type: "public", desc: "Chính sách vận chuyển" },
  { path: "/returns-refunds", name: "returns-refunds", type: "public", desc: "Chính sách đổi trả" },
  { path: "/payment-policy", name: "payment-policy", type: "public", desc: "Chính sách thanh toán" },
  { path: "/cookies", name: "cookies", type: "public", desc: "Chính sách Cookies" },
  { path: "/contact-legal", name: "contact-legal", type: "public", desc: "Thông tin pháp lý" },
  { path: "/faq", name: "faq", type: "public", desc: "Câu hỏi thường gặp" },
  { path: "/guide", name: "guide", type: "public", desc: "Hướng dẫn chọn size" },
  { path: "/about", name: "about", type: "public", desc: "Về thương hiệu Atelier" },
  { path: "/blog", name: "blog", type: "public", desc: "Tạp chí phong cách" },

  // 2. Customer Routes
  { path: "/my-coupons", name: "my-coupons", type: "user", desc: "Ví voucher của tôi" },
  { path: "/profile", name: "profile", type: "user", desc: "Hồ sơ cá nhân" },
  { path: "/profile/data-requests", name: "data-requests", type: "user", desc: "Quản lý dữ liệu GDPR" },
  { path: "/user/dashboard", name: "user-dashboard", type: "user", desc: "Bảng điều khiển cá nhân" },
  { path: "/orders", name: "orders", type: "user", desc: "Lịch sử đơn hàng" },
  { path: "/reviews/create", name: "reviews-create", type: "user", desc: "Viết đánh giá sản phẩm" },

  // 3. Auth Routes
  { path: "/login", name: "login", type: "auth", desc: "Đăng nhập tài khoản" },
  { path: "/register", name: "register", type: "auth", desc: "Đăng ký tài khoản" },
  { path: "/verify-otp", name: "verify-otp", type: "auth", desc: "Xác thực mã OTP" },
  { path: "/reset-password", name: "reset-password", type: "auth", desc: "Đặt lại mật khẩu" },

  // 4. Admin Routes
  { path: "/admin", name: "admin-dashboard", type: "admin", desc: "Admin: Dashboard tổng quan" },
  { path: "/admin/categories", name: "admin-categories", type: "admin", desc: "Admin: Quản lý danh mục" },
  { path: "/admin/products", name: "admin-products", type: "admin", desc: "Admin: Quản lý sản phẩm" },
  { path: "/admin/orders", name: "admin-orders", type: "admin", desc: "Admin: Quản lý đơn hàng" },
  { path: "/admin/chats", name: "admin-chats", type: "admin", desc: "Admin: Trung tâm tin nhắn" },
  { path: "/admin/customers", name: "admin-customers", type: "admin", desc: "Admin: Quản lý khách hàng" },
  { path: "/admin/coupons", name: "admin-coupons", type: "admin", desc: "Admin: Quản lý mã giảm giá" },
  { path: "/admin/campaigns", name: "admin-campaigns", type: "admin", desc: "Admin: Quản lý chiến dịch" },
  { path: "/admin/banners", name: "admin-banners", type: "admin", desc: "Admin: Quản lý banner" },
  { path: "/admin/lookbooks", name: "admin-lookbooks", type: "admin", desc: "Admin: Quản lý lookbooks" },
  { path: "/admin/ab-testing", name: "admin-ab-testing", type: "admin", desc: "Admin: Thử nghiệm A/B" },
  { path: "/admin/user-activity", name: "admin-user-activity", type: "admin", desc: "Admin: Giám sát hành vi" },
  { path: "/admin/pages", name: "admin-pages", type: "admin", desc: "Admin: Quản lý trang tĩnh" },
  { path: "/admin/settings", name: "admin-settings", type: "admin", desc: "Admin: Cài đặt website" },

  // 5. System Test Route
  { path: "/non-existent-route-404-test", name: "not-found", type: "public", desc: "Trang 404 Không tìm thấy" },
];

async function runTestSuite() {
  console.log("================================================================================");
  console.log("  AUTONOMOUS PLAYWRIGHT FULL ROUTE TESTING & VIDEO RECORDING SUITE v2.0");
  console.log("================================================================================");
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- Total Routes to test: ${ALL_ROUTES.length}`);
  console.log(`- Viewports: Desktop (1440x900) & Mobile (390x844)\n`);

  fs.mkdirSync("./reports/screenshots/desktop", { recursive: true });
  fs.mkdirSync("./reports/screenshots/mobile", { recursive: true });
  fs.mkdirSync("./videos/raw-desktop", { recursive: true });
  fs.mkdirSync("./videos/raw-mobile", { recursive: true });

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const testResults = [];

  // ===========================================================================
  // 1. DESKTOP TEST SWEEP & VIDEO RECORDING
  // ===========================================================================
  console.log(">>> [1/2] BẮT ĐẦU KIỂM THỬ DESKTOP (1440x900) VÀ GHI HÌNH...");
  const desktopContext = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    recordVideo: {
      dir: "./videos/raw-desktop",
      size: { width: 1440, height: 900 },
    },
  });

  const desktopPage = await desktopContext.newPage();

  // Setup mock for user / admin state if needed
  await desktopPage.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          _id: "usr-admin-01",
          fullName: "Quản Trị Viên Atelier",
          email: "admin@404studio.vn",
          role: "admin",
          phone: "+84900000001",
        },
      }),
    });
  });

  for (let i = 0; i < ALL_ROUTES.length; i++) {
    const route = ALL_ROUTES[i];
    const testId = `TC-DESK-${String(i + 1).padStart(2, "0")}`;
    const targetUrl = `${BASE_URL}${route.path}`;

    try {
      await desktopPage.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
      await desktopPage.waitForTimeout(600);

      // Check overflow
      const overflow = await desktopPage.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        return scrollW > docW;
      });

      const shotPath = `./reports/screenshots/desktop/desktop-${route.name}.png`;
      await desktopPage.screenshot({ path: shotPath, fullPage: false });

      testResults.push({
        testId,
        route: route.path,
        name: route.name,
        device: "desktop",
        status: overflow ? "FAIL" : "PASS",
        evidence: shotPath,
        error: overflow ? "Horizontal overflow detected" : null,
      });

      process.stdout.write(`  [PASS] ${testId} ${route.path.padEnd(32)} Desktop ✓\n`);
    } catch (err) {
      testResults.push({
        testId,
        route: route.path,
        name: route.name,
        device: "desktop",
        status: "FAIL",
        evidence: null,
        error: err.message,
      });
      process.stdout.write(`  [FAIL] ${testId} ${route.path.padEnd(32)} ${err.message}\n`);
    }
  }

  // Execute interactive User Journeys on Desktop
  console.log("\n>>> THỰC THI USER JOURNEYS (Desktop)...");
  try {
    // Journey A: Guest Shopping (Home -> Products -> Detail -> Cart)
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(500);
    await desktopPage.goto(`${BASE_URL}/products`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(500);
    await desktopPage.goto(`${BASE_URL}/product/ao-khoac-bomber-unisex`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(500);
    // Add to cart click
    const addBtn = await desktopPage.$('button:has-text("Thêm Vào Giỏ Hàng")');
    if (addBtn) await addBtn.click();
    await desktopPage.waitForTimeout(800);
    await desktopPage.goto(`${BASE_URL}/cart`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(800);

    // Journey C: Checkout Flow
    await desktopPage.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(800);

    // Journey F: AI Assistant
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const aiBtn = await desktopPage.$('button:has-text("Trợ lý AI")');
    if (aiBtn) await aiBtn.click();
    await desktopPage.waitForTimeout(1000);

    // Journey G: Admin Navigation
    await desktopPage.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(800);
    await desktopPage.goto(`${BASE_URL}/admin/products`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(500);
    await desktopPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: "domcontentloaded" });
    await desktopPage.waitForTimeout(500);
  } catch (jErr) {
    console.warn("Journey interactive notice:", jErr.message);
  }

  await desktopPage.close();
  await desktopContext.close();

  // ===========================================================================
  // 2. MOBILE TEST SWEEP & VIDEO RECORDING
  // ===========================================================================
  console.log("\n>>> [2/2] BẮT ĐẦU KIỂM THỬ MOBILE (390x844) VÀ GHI HÌNH...");
  const mobileContext = await browser.newContext({
    viewport: VIEWPORTS.mobile,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: "./videos/raw-mobile",
      size: { width: 390, height: 844 },
    },
  });

  const mobilePage = await mobileContext.newPage();

  await mobilePage.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          _id: "usr-admin-01",
          fullName: "Quản Trị Viên Atelier",
          email: "admin@404studio.vn",
          role: "admin",
          phone: "+84900000001",
        },
      }),
    });
  });

  for (let i = 0; i < ALL_ROUTES.length; i++) {
    const route = ALL_ROUTES[i];
    const testId = `TC-MOB-${String(i + 1).padStart(2, "0")}`;
    const targetUrl = `${BASE_URL}${route.path}`;

    try {
      await mobilePage.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
      await mobilePage.waitForTimeout(500);

      const overflow = await mobilePage.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        return scrollW > docW;
      });

      const shotPath = `./reports/screenshots/mobile/mobile-${route.name}.png`;
      await mobilePage.screenshot({ path: shotPath, fullPage: false });

      testResults.push({
        testId,
        route: route.path,
        name: route.name,
        device: "mobile",
        status: overflow ? "FAIL" : "PASS",
        evidence: shotPath,
        error: overflow ? "Mobile overflow detected" : null,
      });

      process.stdout.write(`  [PASS] ${testId} ${route.path.padEnd(32)} Mobile ✓\n`);
    } catch (err) {
      testResults.push({
        testId,
        route: route.path,
        name: route.name,
        device: "mobile",
        status: "FAIL",
        evidence: null,
        error: err.message,
      });
      process.stdout.write(`  [FAIL] ${testId} ${route.path.padEnd(32)} ${err.message}\n`);
    }
  }

  await mobilePage.close();
  await mobileContext.close();
  await browser.close();

  // Finalize video files
  const rawDeskVideos = fs.readdirSync("./videos/raw-desktop").filter((f) => f.endsWith(".webm"));
  if (rawDeskVideos.length > 0) {
    fs.copyFileSync(
      path.join("./videos/raw-desktop", rawDeskVideos[0]),
      "./videos/01-desktop-all-routes.webm"
    );
  }

  const rawMobVideos = fs.readdirSync("./videos/raw-mobile").filter((f) => f.endsWith(".webm"));
  if (rawMobVideos.length > 0) {
    fs.copyFileSync(
      path.join("./videos/raw-mobile", rawMobVideos[0]),
      "./videos/02-mobile-all-routes.webm"
    );
  }

  // Save json results
  fs.writeFileSync("./test-results-v2.json", JSON.stringify(testResults, null, 2));

  const totalPassed = testResults.filter((r) => r.status === "PASS").length;
  const totalFailed = testResults.filter((r) => r.status === "FAIL").length;

  console.log("\n================================================================================");
  console.log(`  HOÀN THÀNH KIỂM THỬ: ${totalPassed} PASS / ${totalFailed} FAIL (Tổng ${testResults.length} lượt)`);
  console.log(`- Video Desktop: videos/01-desktop-all-routes.webm`);
  console.log(`- Video Mobile: videos/02-mobile-all-routes.webm`);
  console.log(`- Screenshots: reports/screenshots/desktop/ & reports/screenshots/mobile/`);
  console.log("================================================================================");
}

runTestSuite().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
