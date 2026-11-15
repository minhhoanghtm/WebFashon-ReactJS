import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createTestBrowser, setupPage, BASE_URL } from "./helpers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, "../../docs/ui/screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "desktop_1920x1080", width: 1920, height: 1080, isDesktop: true },
  { name: "laptop_1366x768", width: 1366, height: 768, isDesktop: true },
  { name: "tablet_768x1024", width: 768, height: 1024, isDesktop: true },
  { name: "mobile_390x844", width: 390, height: 844, isMobile: true, hasTouch: true },
];

export async function testChatWidget(browser, report) {
  console.log("\n--- BẮT ĐẦU KIỂM THỬ KHUNG CHAT KHÁCH HÀNG (CUSTOMER CHAT WIDGET) ---");

  for (const vp of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      const { page, context } = await setupPage(browser, { viewport: vp, theme });
      const testPrefix = `[${vp.name} | ${theme}]`;

      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(500);

        // 1. Mở khung chat bằng nút launcher
        const launcher = await page.waitForSelector("button[aria-haspopup='dialog']", { timeout: 8000 });
        await launcher.click();
        await page.waitForTimeout(400);

        const panel = await page.waitForSelector("[data-chat-panel]", { state: "visible", timeout: 5000 });

        // Đo đạc tọa độ vị trí (Desktop vs Mobile)
        const metrics = await page.evaluate(() => {
          const l = document.querySelector("button[aria-haspopup='dialog']");
          const p = document.querySelector("[data-chat-panel]");
          if (!l || !p) return null;

          const lRect = l.getBoundingClientRect();
          const pRect = p.getBoundingClientRect();
          const header = p.querySelector("[data-chat-header]");
          const headerStyle = window.getComputedStyle(header);

          return {
            launcher: {
              top: lRect.top,
              bottom: lRect.bottom,
              left: lRect.left,
              right: lRect.right,
              width: lRect.width,
              height: lRect.height,
            },
            panel: {
              top: pRect.top,
              bottom: pRect.bottom,
              left: pRect.left,
              right: pRect.right,
              width: pRect.width,
              height: pRect.height,
            },
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            header: {
              activeAttr: header?.getAttribute("data-active"),
              bgColor: headerStyle.backgroundColor,
              color: headerStyle.color,
            },
          };
        });

        if (vp.isDesktop) {
          // Yêu cầu: khung bên trái nút (khung.right <= nút.left - 8)
          const gap = metrics.launcher.left - metrics.panel.right;
          const isLeftOfLauncher = metrics.panel.right <= metrics.launcher.left - 8;
          // Đáy khung thẳng hàng với đáy nút (|khung.bottom - nút.bottom| <= 4px)
          const bottomDelta = Math.abs(metrics.panel.bottom - metrics.launcher.bottom);
          const isAlignedBottom = bottomDelta <= 4;
          // Không vượt khỏi viewport và không tràn header
          const withinViewport =
            metrics.panel.left >= 0 &&
            metrics.panel.top >= 0 &&
            metrics.panel.bottom <= metrics.viewport.height &&
            metrics.panel.right <= metrics.viewport.width;

          const passPosition = isLeftOfLauncher && isAlignedBottom && withinViewport;

          report.addResult({
            suite: "Customer Chat Widget",
            testName: `${testPrefix} Desktop Side-by-Side Positioning`,
            status: passPosition ? "PASS" : "FAIL",
            details: `Khoảng cách khung-nút: ${gap}px (chuẩn >=8px), Lệch đáy: ${bottomDelta}px (chuẩn <=4px), Trong viewport: ${withinViewport}`,
          });
        } else {
          // Mobile: khung toàn màn hình (100dvh)
          const isFullScreen =
            metrics.panel.width >= metrics.viewport.width - 2 &&
            metrics.panel.height >= metrics.viewport.height - 2;

          report.addResult({
            suite: "Customer Chat Widget",
            testName: `${testPrefix} Mobile Fullscreen Positioning`,
            status: isFullScreen ? "PASS" : "FAIL",
            details: `Kích thước khung: ${metrics.panel.width}x${metrics.panel.height}px / Màn hình: ${metrics.viewport.width}x${metrics.viewport.height}px`,
          });
        }

        // 2. Kiểm tra Header Active & Inactive transition
        const initialActive = metrics.header.activeAttr === "true";
        const initialBg = metrics.header.bgColor;

        // Chụp screenshot Active
        if (vp.name === "desktop_1920x1080" || vp.name === "mobile_390x844") {
          const ssActive = path.join(SCREENSHOT_DIR, `chat_active_${vp.name}_${theme}.png`);
          await page.screenshot({ path: ssActive });
        }

        // Bấm ra ngoài khung chat (ví dụ góc trái phía trên)
        await page.mouse.click(50, 50);
        await page.waitForTimeout(300);

        const inactiveMetrics = await page.evaluate(() => {
          const p = document.querySelector("[data-chat-panel]");
          if (!p) return { panelClosed: true };
          const header = p.querySelector("[data-chat-header]");
          const headerStyle = window.getComputedStyle(header);
          return {
            panelClosed: false,
            activeAttr: header?.getAttribute("data-active"),
            bgColor: headerStyle.backgroundColor,
            color: headerStyle.color,
          };
        });

        const staysOpenWhenClickedOutside = !inactiveMetrics.panelClosed;
        const becomesInactive = inactiveMetrics.activeAttr === "false";
        const styleChanged = inactiveMetrics.bgColor !== initialBg;
        const passHeaderInteraction = staysOpenWhenClickedOutside && becomesInactive && styleChanged;

        report.addResult({
          suite: "Customer Chat Widget",
          testName: `${testPrefix} Active/Inactive Header Behavior`,
          status: passHeaderInteraction ? "PASS" : "FAIL",
          details: `Active khi mở: ${initialActive}, Vẫn mở khi click ngoài: ${staysOpenWhenClickedOutside}, Đổi trạng thái: ${becomesInactive}, Đổi màu header: ${styleChanged}`,
        });

        // Chụp screenshot Inactive
        if (vp.name === "desktop_1920x1080" || vp.name === "mobile_390x844") {
          const ssInactive = path.join(SCREENSHOT_DIR, `chat_inactive_${vp.name}_${theme}.png`);
          await page.screenshot({ path: ssInactive });
        }

        // 3. Tự đóng khi chuyển trang & giữ lịch sử
        // Nhập draft text vào ô input
        const textarea = await page.$("textarea");
        if (textarea) {
          await textarea.focus();
          await textarea.fill("Thử nghiệm tin nhắn atelier");
          await page.waitForTimeout(100);
        }

        // 3.1. Chuyển trang (click link client-side trên desktop & mobile)
        const targetLink = await page.$("a[href='/products'], a[href*='products'], a[href='/cart']");
        if (targetLink) {
          await page.evaluate((el) => el.click(), targetLink);
        } else {
          await page.evaluate(() => {
            const a = document.querySelector("a[href*='product'], a[href='/cart'], a[href='/']");
            if (a) a.click();
          });
        }
        await page.waitForTimeout(600);

        // Kiểm tra khung chat đã tự đóng chưa
        const isClosedAfterLink = await page.evaluate(() => {
          return document.querySelector("[data-chat-panel]") === null;
        });

        // 3.2. Mở lại khung chat: kiểm tra nội dung draft vẫn còn nguyên
        const isPanelStillOpen = await page.evaluate(() => document.querySelector("[data-chat-panel]") !== null);
        if (!isPanelStillOpen) {
          const launcherReopen = await page.waitForSelector("button[aria-haspopup='dialog']", { timeout: 8000 });
          await launcherReopen.click({ force: true });
          await page.waitForTimeout(400);
        }

        const retainedDraft = await page.evaluate(() => {
          const t = document.querySelector("textarea");
          return t ? t.value : "";
        });

        // 3.3. Chuyển trang bằng goBack: khung chat tự đóng
        await page.goBack().catch(() => {});
        await page.waitForTimeout(600);

        const isClosedAfterBack = await page.evaluate(() => {
          return document.querySelector("[data-chat-panel]") === null;
        });

        const passAutoClose = isClosedAfterLink && isClosedAfterBack && retainedDraft === "Thử nghiệm tin nhắn atelier";
        report.addResult({
          suite: "Customer Chat Widget",
          testName: `${testPrefix} Auto-close on Page Navigation & Draft Retention`,
          status: passAutoClose ? "PASS" : "FAIL",
          details: `Đóng khi click link: ${isClosedAfterLink}, Đóng khi goBack: ${isClosedAfterBack}, Giữ nguyên draft: ${retainedDraft === "Thử nghiệm tin nhắn atelier"}`,
        });

        // 4. Kiểm tra nút đóng trên mobile & nâng launcher trên trang chi tiết sản phẩm
        if (vp.isMobile) {
          // Mở lại khung chat (nếu đang đóng) và bấm nút đóng (X) trong header
          const isPanelOpenNow = await page.evaluate(() => document.querySelector("[data-chat-panel]") !== null);
          if (!isPanelOpenNow) {
            const reopenBtn = await page.waitForSelector("button[aria-haspopup='dialog']", { timeout: 8000 });
            await reopenBtn.click({ force: true });
            await page.waitForTimeout(300);
          }

          const closeBtn = await page.waitForSelector("button[data-chat-close-btn]", { timeout: 5000 });
          await closeBtn.click({ force: true });
          await page.waitForTimeout(400);

          const isClosedByCloseBtn = await page.evaluate(() => document.querySelector("[data-chat-panel]") === null);
          report.addResult({
            suite: "Customer Chat Widget",
            testName: `${testPrefix} Mobile Header Close Button`,
            status: isClosedByCloseBtn ? "PASS" : "FAIL",
            details: `Nút đóng (X) trên mobile đóng khung: ${isClosedByCloseBtn}`,
          });

          await page.goto(`${BASE_URL}/product/674b9a5e8f498967ac8b0001`, { waitUntil: "networkidle" }).catch(() => {});
          await page.waitForTimeout(500);

          const mobileLauncherPosition = await page.evaluate(() => {
            const l = document.querySelector("button[aria-haspopup='dialog']");
            if (!l) return null;
            const lRect = l.getBoundingClientRect();
            return {
              launcherBottom: lRect.bottom,
              viewportHeight: window.innerHeight,
              liftedAboveBottom: window.innerHeight - lRect.bottom >= 80,
            };
          });

          if (mobileLauncherPosition) {
            report.addResult({
              suite: "Customer Chat Widget",
              testName: `${testPrefix} Mobile Product Detail Lift Placement`,
              status: mobileLauncherPosition.liftedAboveBottom ? "PASS" : "FAIL",
              details: `Khoảng cách đáy: ${mobileLauncherPosition.viewportHeight - mobileLauncherPosition.launcherBottom}px (trên thanh mua hàng cố định)`,
            });
          }
        }
      } catch (err) {
        report.addResult({
          suite: "Customer Chat Widget",
          testName: `${testPrefix} Test Execution`,
          status: "FAIL",
          details: `Lỗi thực thi: ${err.message}`,
        });
      } finally {
        await page.close();
        if (context) await context.close();
      }
    }
  }

  console.log("--- HOÀN TẤT KIỂM THỬ KHUNG CHAT KHÁCH HÀNG ---\n");
}

// Chạy độc lập: node tests/e2e/chat-widget.spec.mjs
if (process.argv[1] && process.argv[1].endsWith("chat-widget.spec.mjs")) {
  (async () => {
    const browser = await createTestBrowser();
    const report = {
      results: [],
      addResult(res) {
        this.results.push(res);
        console.log(`[${res.status}] ${res.testName}: ${res.details}`);
      },
    };

    try {
      await testChatWidget(browser, report);
      const passed = report.results.filter((r) => r.status === "PASS").length;
      const failed = report.results.filter((r) => r.status === "FAIL").length;
      console.log(`\nTổng kết: PASS = ${passed}, FAIL = ${failed}`);
    } finally {
      await browser.close();
      process.exit(0);
    }
  })();
}
