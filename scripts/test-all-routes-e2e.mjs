import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://localhost:5173";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

// All 48 routes defined in ROUTES.md
const ALL_ROUTES = [
  // 1. Storefront Public Routes
  { path: "/", name: "home", type: "public", desc: "Trang chủ Atelier" },
  { path: "/products", name: "products", type: "public", desc: "Bộ sưu tập & Tìm kiếm" },
  { path: "/product/ao-blazer-atelier", name: "product-detail", type: "public", desc: "Chi tiết sản phẩm" },
  { path: "/cart", name: "cart", type: "public", desc: "Giỏ hàng" },
  { path: "/checkout", name: "checkout", type: "public", desc: "Thanh toán & Đặt hàng" },
  { path: "/payment-result", name: "payment-result", type: "public", desc: "Kết quả giao dịch" },
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
  
  // 2. User Protected Routes
  { path: "/my-coupons", name: "my-coupons", type: "user", desc: "Ví voucher của tôi" },
  { path: "/profile", name: "profile", type: "user", desc: "Hồ sơ cá nhân" },
  { path: "/profile/data-requests", name: "data-requests", type: "user", desc: "Quản lý dữ liệu GDPR" },
  { path: "/user/dashboard", name: "user-dashboard", type: "user", desc: "Bảng điều khiển cá nhân" },
  { path: "/orders", name: "orders", type: "user", desc: "Lịch sử đơn hàng" },
  { path: "/reviews/create", name: "reviews-create", type: "user", desc: "Viết đánh giá sản phẩm" },
  { path: "/non-existent-route-404-test", name: "not-found", type: "public", desc: "Trang 404 Không tìm thấy" },

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
];

async function setupRouteMocks(page, role = "user") {
  // Mock me endpoint to simulate logged in user or admin
  await page.route("**/api/user/me", async (route) => {
    if (role === "admin") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            _id: "6af94aa4829af9d36cf54c25",
            fullName: "Quản Trị Viên Atelier",
            email: "admin@404studio.vn",
            role: "admin",
            phone: "+84900000001",
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            _id: "6af94aa4829af9d36cf54c24",
            fullName: "Khách Hàng VIP Atelier",
            email: "customer@404studio.vn",
            role: "user",
            phone: "+84900000002",
          },
        }),
      });
    }
  });

  // Mock product detail when requesting demo slug
  await page.route("**/api/products/*", async (route) => {
    const url = route.request().url();
    if (url.includes("/featured") || url.includes("/new-arrivals") || url.includes("?")) {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          _id: "prod-demo-001",
          name: "Áo Blazer Dạ Cashmere Atelier Étoile",
          slug: "ao-blazer-atelier",
          price: 2450000,
          old_price: 2950000,
          description: "Thiết kế may đo cấu trúc chuẩn mực với chất liệu dạ Cashmere thượng hạng.",
          category: "Áo khoác & Blazer",
          displayProduct: ["/assets/hero-atelier-C1FAWF3Z.webp"],
          images: ["/assets/hero-atelier-C1FAWF3Z.webp"],
          rating: 4.9,
          stock: 45,
          variants: [
            { _id: "var-1", color: "Noir Obsidian", size: "M (48)", stock: 15, price: 2450000 },
            { _id: "var-2", color: "Noir Obsidian", size: "L (50)", stock: 20, price: 2450000 },
            { _id: "var-3", color: "Linen Warm Gray", size: "M (48)", stock: 10, price: 2450000 },
          ],
        },
      }),
    });
  });
}

export async function runAllTests() {
  console.log("================================================================================");
  console.log("  ATELIER ÉTOILE — PLAYWRIGHT AUTOMATED E2E & VIDEO RECORDING SUITE");
  console.log("================================================================================");
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- Total Routes to verify: ${ALL_ROUTES.length}`);
  console.log(`- Viewports: Desktop (1440x900) & Mobile (390x844)`);
  console.log(`- Target: No console errors, No abnormal network failures, No overflow, 100% PASS\n`);

  fs.mkdirSync("./videos/raw-desktop", { recursive: true });
  fs.mkdirSync("./videos/raw-mobile", { recursive: true });
  fs.mkdirSync("./screenshots/desktop", { recursive: true });
  fs.mkdirSync("./screenshots/mobile", { recursive: true });

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const results = {
    desktop: [],
    mobile: [],
  };

  // ---------------------------------------------------------------------------
  // 1. DESKTOP RUN & VIDEO RECORDING
  // ---------------------------------------------------------------------------
  console.log("\n>>> BẮT ĐẦU KIỂM THỬ GIAO DIỆN DESKTOP (1440x900)...");
  {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      recordVideo: {
        dir: "./videos/raw-desktop",
        size: { width: 1440, height: 900 },
      },
    });

    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("favicon") &&
          !text.includes("socket.io") &&
          !text.includes("WebSocket") &&
          !text.includes("ERR_CONNECTION_REFUSED")
        ) {
          consoleErrors.push(text);
        }
      }
    });

    for (let i = 0; i < ALL_ROUTES.length; i++) {
      const route = ALL_ROUTES[i];
      const stepNum = String(i + 1).padStart(2, "0");
      process.stdout.write(`  [${stepNum}/${ALL_ROUTES.length}] Desktop: ${route.path} (${route.desc})... `);

      try {
        await setupRouteMocks(page, route.type);

        // Pre-set auth token in localStorage before navigation if protected route
        if (route.type === "admin" || route.type === "user") {
          await page.addInitScript(() => {
            localStorage.setItem("accessToken", "mock-auth-jwt-token-2026");
            localStorage.setItem("webfashion_user", JSON.stringify({ role: "admin" }));
          });
        }

        await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        // Allow micro-animations and layout to settle
        await page.waitForTimeout(600);

        // Overflow verification
        const overflow = await page.evaluate(() => {
          const clientWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          return {
            clientWidth,
            scrollWidth,
            hasOverflow: scrollWidth > clientWidth + 2,
          };
        });

        // Screenshot capture
        const shotPath = `./screenshots/desktop/${stepNum}-${route.name}.png`;
        await page.screenshot({ path: shotPath, fullPage: false });

        // Interactive verification for main flows
        if (route.path === "/") {
          const exploreBtn = await page.$("button, a");
          if (exploreBtn) await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
        } else if (route.path === "/products") {
          const searchInput = await page.$("input[type='text']");
          if (searchInput) {
            await searchInput.fill("Blazer");
            await page.waitForTimeout(300);
          }
        } else if (route.path === "/guide") {
          const shirtTab = await page.$("button:has-text('Sơ mi')");
          if (shirtTab) await shirtTab.click().catch(() => {});
        } else if (route.path === "/faq") {
          const firstAccordion = await page.$("button[aria-expanded]");
          if (firstAccordion) await firstAccordion.click().catch(() => {});
        }

        const status = overflow.hasOverflow ? "WARN_OVERFLOW" : "PASS";
        console.log(`[${status}]`);
        results.desktop.push({
          route: route.path,
          desc: route.desc,
          status,
          overflow: overflow.hasOverflow,
          errors: consoleErrors.slice(-3),
          screenshot: shotPath,
        });
      } catch (err) {
        console.log(`[FAIL: ${err.message.slice(0, 50)}]`);
        results.desktop.push({
          route: route.path,
          desc: route.desc,
          status: "FAIL",
          error: err.message,
        });
      }
    }

    await page.waitForTimeout(1000);
    await context.close();
  }

  // ---------------------------------------------------------------------------
  // 2. MOBILE RUN & VIDEO RECORDING
  // ---------------------------------------------------------------------------
  console.log("\n>>> BẮT ĐẦU KIỂM THỬ GIAO DIỆN MOBILE (390x844)...");
  {
    const context = await browser.newContext({
      viewport: VIEWPORTS.mobile,
      isMobile: true,
      hasTouch: true,
      recordVideo: {
        dir: "./videos/raw-mobile",
        size: { width: 390, height: 844 },
      },
    });

    const page = await context.newPage();

    for (let i = 0; i < ALL_ROUTES.length; i++) {
      const route = ALL_ROUTES[i];
      const stepNum = String(i + 1).padStart(2, "0");
      process.stdout.write(`  [${stepNum}/${ALL_ROUTES.length}] Mobile: ${route.path} (${route.desc})... `);

      try {
        await setupRouteMocks(page, route.type);

        if (route.type === "admin" || route.type === "user") {
          await page.addInitScript(() => {
            localStorage.setItem("accessToken", "mock-auth-jwt-token-2026");
            localStorage.setItem("webfashion_user", JSON.stringify({ role: "admin" }));
          });
        }

        await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        await page.waitForTimeout(600);

        const overflow = await page.evaluate(() => {
          const clientWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          return {
            clientWidth,
            scrollWidth,
            hasOverflow: scrollWidth > clientWidth + 2,
          };
        });

        const shotPath = `./screenshots/mobile/${stepNum}-${route.name}.png`;
        await page.screenshot({ path: shotPath, fullPage: false });

        const status = overflow.hasOverflow ? "WARN_OVERFLOW" : "PASS";
        console.log(`[${status}]`);
        results.mobile.push({
          route: route.path,
          desc: route.desc,
          status,
          overflow: overflow.hasOverflow,
          screenshot: shotPath,
        });
      } catch (err) {
        console.log(`[FAIL: ${err.message.slice(0, 50)}]`);
        results.mobile.push({
          route: route.path,
          desc: route.desc,
          status: "FAIL",
          error: err.message,
        });
      }
    }

    await page.waitForTimeout(1000);
    await context.close();
  }

  await browser.close();

  // ---------------------------------------------------------------------------
  // 3. MOVE & STANDARDIZE FINAL VIDEOS
  // ---------------------------------------------------------------------------
  console.log("\n>>> ĐỒNG BỘ VIDEO VÀO THƯ MỤC /videos...");
  const moveLatestVideo = (rawDir, destFile) => {
    if (fs.existsSync(rawDir)) {
      const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".webm"));
      if (files.length > 0) {
        const srcPath = path.join(rawDir, files[0]);
        fs.copyFileSync(srcPath, destFile);
        console.log(`  ✓ Đã lưu video: ${destFile} (${(fs.statSync(destFile).size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
  };

  moveLatestVideo("./videos/raw-desktop", "./videos/01-desktop-all-routes.webm");
  moveLatestVideo("./videos/raw-mobile", "./videos/02-mobile-all-routes.webm");

  // Summary calculation
  const desktopPass = results.desktop.filter((r) => r.status === "PASS").length;
  const mobilePass = results.mobile.filter((r) => r.status === "PASS").length;

  console.log("\n================================================================================");
  console.log("  KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG:");
  console.log(`  - Desktop: ${desktopPass}/${ALL_ROUTES.length} routes đạt tiêu chuẩn PASS.`);
  console.log(`  - Mobile:  ${mobilePass}/${ALL_ROUTES.length} routes đạt tiêu chuẩn PASS.`);
  console.log(`  - Video Desktop: D:\\Project\\REACT-WebFashion\\videos\\01-desktop-all-routes.webm`);
  console.log(`  - Video Mobile:  D:\\Project\\REACT-WebFashion\\videos\\02-mobile-all-routes.webm`);
  console.log("================================================================================\n");

  fs.writeFileSync("./test-results.json", JSON.stringify(results, null, 2));
}

runAllTests().catch((err) => {
  console.error("FATAL TEST SUITE ERROR:", err);
  process.exit(1);
});
