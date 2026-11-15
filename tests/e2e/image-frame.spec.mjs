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

const TEST_VIEWPORTS = [
  { name: "desktop_1920x1080", width: 1920, height: 1080 },
  { name: "laptop_1366x768", width: 1366, height: 768 },
  { name: "tablet_768x1024", width: 768, height: 1024 },
  { name: "mobile_390x844", width: 390, height: 844, isMobile: true, hasTouch: true },
];

export async function testImageFraming(browser, report) {
  console.log("\n--- BẮT ĐẦU KIỂM THỬ KHUNG ẢNH & TỶ LỆ CROP (ZERO-CROP VERIFICATION) ---");

  for (const vp of TEST_VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      const { page, context } = await setupPage(browser, { viewport: vp, theme });
      const testPrefix = `[${vp.name} | ${theme}]`;

      try {
        // 1. Kiểm tra Trang Chủ & ProductCard
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(1000);

        // Đo đạc các ảnh thẻ sản phẩm trên trang chủ
        const cardCropStats = await page.evaluate(() => {
          const cards = document.querySelectorAll("[data-product-card]");
          const stats = [];
          cards.forEach((card, idx) => {
            const img = card.querySelector("img");
            if (!img) return;
            const style = window.getComputedStyle(img);
            const objectFit = style.objectFit;
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            let cropPercent = 0;

            if (objectFit === "contain") {
              cropPercent = 0;
            } else if (objectFit === "cover" && nw > 0 && nh > 0) {
              const frameRect = img.parentElement.getBoundingClientRect();
              const frameAspect = frameRect.width / frameRect.height;
              const imgAspect = nw / nh;
              const ratioDelta = Math.abs(imgAspect - frameAspect) / frameAspect;
              cropPercent = ratioDelta * 100;
            }

            stats.push({
              index: idx,
              objectFit,
              naturalWidth: nw,
              naturalHeight: nh,
              cropPercent: Math.round(cropPercent * 10) / 10,
            });
          });
          return stats;
        });

        const maxCardCrop = cardCropStats.reduce((max, c) => Math.max(max, c.cropPercent), 0);
        const passCardCrop = maxCardCrop <= 8; // Cho phép <= 8% với cover chuẩn 3:4 hoặc 0% với contain

        report.addResult({
          suite: "Image Framing",
          testName: `${testPrefix} ProductCard Framing Check`,
          status: passCardCrop ? "PASS" : "FAIL",
          details: `Kiểm tra ${cardCropStats.length} thẻ sản phẩm. Max Crop: ${maxCardCrop}%. Tỷ lệ chấp thuận <= 8%`,
        });

        // Chụp screenshot trang chủ
        if (theme === "dark" || vp.name === "laptop_1366x768") {
          const ssPath = path.join(SCREENSHOT_DIR, `home_${vp.name}_${theme}.png`);
          await page.screenshot({ path: ssPath, fullPage: false });
        }

        // 2. Kiểm tra Chi tiết sản phẩm (Product Detail Gallery)
        // Tìm link sản phẩm đầu tiên
        const productLink = await page.evaluate(() => {
          const a = document.querySelector("a[href*='/product/']");
          return a ? a.getAttribute("href") : null;
        });

        if (productLink) {
          await page.goto(`${BASE_URL}${productLink}`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(1000);

          const galleryMetrics = await page.evaluate(() => {
            const galleryImg = document.querySelector(".fit-image-container img");
            const galleryContainer = document.querySelector(".fit-image-container");
            const actionSection = document.querySelector("button[type='button'], .btn-cta, input");

            if (!galleryImg || !galleryContainer) {
              return { found: false };
            }

            const imgStyle = window.getComputedStyle(galleryImg);
            const containerRect = galleryContainer.getBoundingClientRect();
            const nw = galleryImg.naturalWidth;
            const nh = galleryImg.naturalHeight;
            const windowHeight = window.innerHeight;

            // Kiểm tra crop
            const isContain = imgStyle.objectFit === "contain";
            const cropRatio = isContain ? 0 : 1;

            // Kiểm tra chiều cao không vượt quá viewport
            const fitsViewport = containerRect.bottom <= windowHeight + 100;

            return {
              found: true,
              objectFit: imgStyle.objectFit,
              containerHeight: Math.round(containerRect.height),
              windowHeight,
              fitsViewport,
              cropRatio,
              hasActionsInScreen: actionSection ? actionSection.getBoundingClientRect().top < windowHeight : true,
            };
          });

          if (galleryMetrics.found) {
            const passGallery = galleryMetrics.cropRatio === 0;
            report.addResult({
              suite: "Image Framing",
              testName: `${testPrefix} Product Gallery Adaptive Framing`,
              status: passGallery ? "PASS" : "FAIL",
              details: `Gallery object-fit: ${galleryMetrics.objectFit}, Crop: ${galleryMetrics.cropRatio * 100}%, Vừa khung nhìn: ${galleryMetrics.fitsViewport}`,
            });

            // Chụp screenshot chi tiết sản phẩm minh chứng
            if (vp.name === "laptop_1366x768" && theme === "light") {
              const ssPath = path.join(SCREENSHOT_DIR, `product_detail_1366x768_light.png`);
              await page.screenshot({ path: ssPath, fullPage: false });
            }
          }
        }
      } catch (err) {
        report.addResult({
          suite: "Image Framing",
          testName: `${testPrefix} Execution Check`,
          status: "FAIL",
          details: `Lỗi thực thi kiểm thử: ${err.message}`,
        });
      } finally {
        await page.close();
        if (context) await context.close();
      }
    }
  }

  console.log("--- HOÀN TẤT KIỂM THỬ KHUNG ẢNH & TỶ LỆ CROP ---\n");
}

// Cho phép chạy độc lập: node tests/e2e/image-frame.spec.mjs
if (process.argv[1] && process.argv[1].endsWith("image-frame.spec.mjs")) {
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
      await testImageFraming(browser, report);
      const passed = report.results.filter((r) => r.status === "PASS").length;
      const failed = report.results.filter((r) => r.status === "FAIL").length;
      console.log(`\nTổng kết: PASS = ${passed}, FAIL = ${failed}`);
    } finally {
      await browser.close();
      process.exit(0);
    }
  })();
}
