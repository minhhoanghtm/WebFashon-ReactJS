import { BASE_URL, createTestBrowser, setupPage } from "./helpers.mjs";
import path from "path";
import fs from "fs";

const VIEWPORTS = [
  { name: "desktop_1920x1080", width: 1920, height: 1080 },
  { name: "laptop_1366x768", width: 1366, height: 768 },
  { name: "mobile_390x844", width: 390, height: 844, isMobile: true, hasTouch: true },
];

const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// WCAG relative luminance and contrast ratio calculator
function parseRgb(colorStr) {
  if (!colorStr) return { r: 12, g: 12, b: 14 };
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return { r: 12, g: 12, b: 14 };
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(color1Str, color2Str) {
  const c1 = parseRgb(color1Str);
  const c2 = parseRgb(color2Str);
  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function run() {
  console.log("=======================================================");
  console.log("VERIFICATION: CINEMATIC HEADER CONTRAST & RESPONSIVENESS");
  console.log("=======================================================\n");

  const browser = await createTestBrowser();
  let totalTests = 0;
  let passedTests = 0;

  try {
    for (const vp of VIEWPORTS) {
      for (const theme of ["light", "dark"]) {
        totalTests++;
        const testLabel = `${vp.name} [${theme.toUpperCase()}]`;
        console.log(`\n--- Running Suite: ${testLabel} ---`);

        const { page, context, getErrors, checkOverflow } = await setupPage(browser, {
          viewport: { width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.hasTouch },
          theme,
        });

        try {
          await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(600);

          // 1. Snapshot on Hero (Transparent State)
          const heroScreenshotPath = path.join(SCREENSHOT_DIR, `header_hero_${vp.name}_${theme}.png`);
          await page.screenshot({ path: heroScreenshotPath, clip: { x: 0, y: 0, width: vp.width, height: 120 } });
          console.log(`✓ 1. Captured header on Hero: ${heroScreenshotPath}`);

          // 2. Scroll past hero to "Tất cả thiết kế" section
          const heroHeight = await page.evaluate(() => {
            const hero = document.querySelector("section[aria-label*='Khám phá bộ sưu tập']");
            return hero ? hero.getBoundingClientRect().height : window.innerHeight * 0.9;
          });

          await page.evaluate((hh) => {
            window.scrollTo({ top: hh + 80, behavior: "instant" });
          }, heroHeight);
          await page.waitForTimeout(500);

          // Measure colors at "Tất cả thiết kế"
          const collectionMeasurements = await page.evaluate(() => {
            const getEffectiveBgColor = (el) => {
              let cur = el;
              while (cur && cur !== document.documentElement) {
                const bg = window.getComputedStyle(cur).backgroundColor;
                if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
                  return bg;
                }
                cur = cur.parentElement;
              }
              return window.getComputedStyle(document.body).backgroundColor || "rgb(251, 249, 245)";
            };

            const header = document.querySelector("header[role='banner']");
            const collectionSection = document.querySelector("#home-collection-heading")?.closest("section") || document.getElementById("home-content");
            const headerTextEl = header?.querySelector("span.font-condensed");

            const headerStyle = window.getComputedStyle(header);
            const sectionBg = getEffectiveBgColor(collectionSection);
            const textStyle = headerTextEl ? window.getComputedStyle(headerTextEl) : null;

            return {
              headerBg: headerStyle.backgroundColor,
              sectionBg: sectionBg,
              textColor: textStyle?.color || "rgb(245, 244, 240)",
            };
          });

          const contrastHeaderVsSection1 = getContrastRatio(collectionMeasurements.headerBg, collectionMeasurements.sectionBg);
          const contrastTextVsHeader1 = getContrastRatio(collectionMeasurements.textColor, collectionMeasurements.headerBg);

          console.log(`At "Tất cả thiết kế": HeaderBg=${collectionMeasurements.headerBg}, SectionBg=${collectionMeasurements.sectionBg}, TextColor=${collectionMeasurements.textColor}`);
          console.log(`Contrast Header vs Section: ${contrastHeaderVsSection1.toFixed(2)} (Requirement >= 1.5)`);
          console.log(`Contrast Text vs Header: ${contrastTextVsHeader1.toFixed(2)} (Requirement >= 4.5)`);

          if (contrastHeaderVsSection1 < 1.5) {
            throw new Error(`Contrast between header and section below (${contrastHeaderVsSection1.toFixed(2)}) is < 1.5`);
          }
          if (contrastTextVsHeader1 < 4.5) {
            throw new Error(`Contrast between text and header (${contrastTextVsHeader1.toFixed(2)}) is < 4.5`);
          }
          console.log(`✓ 2. WCAG Contrast requirements passed at "Tất cả thiết kế"`);

          const afterHeroScreenshotPath = path.join(SCREENSHOT_DIR, `header_after_hero_${vp.name}_${theme}.png`);
          await page.screenshot({ path: afterHeroScreenshotPath, clip: { x: 0, y: 0, width: vp.width, height: 160 } });

          // 3. Scroll to "Chương thương hiệu" (White section)
          await page.evaluate(() => {
            const brandSec = document.querySelector("section[aria-label*='Chương thương hiệu']");
            if (brandSec) brandSec.scrollIntoView({ behavior: "instant" });
          });
          await page.waitForTimeout(500);

          const brandMeasurements = await page.evaluate(() => {
            const getEffectiveBgColor = (el) => {
              let cur = el;
              while (cur && cur !== document.documentElement) {
                const bg = window.getComputedStyle(cur).backgroundColor;
                if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
                  return bg;
                }
                cur = cur.parentElement;
              }
              return window.getComputedStyle(document.body).backgroundColor || "rgb(255, 255, 255)";
            };

            const header = document.querySelector("header[role='banner']");
            const brandSec = document.querySelector("section[aria-label*='Chương thương hiệu']");
            const headerTextEl = header?.querySelector("span.font-condensed");

            const headerStyle = window.getComputedStyle(header);
            const sectionBg = getEffectiveBgColor(brandSec);
            const textStyle = headerTextEl ? window.getComputedStyle(headerTextEl) : null;

            return {
              headerBg: headerStyle.backgroundColor,
              sectionBg: sectionBg,
              textColor: textStyle?.color || "rgb(245, 244, 240)",
            };
          });

          const contrastHeaderVsBrand = getContrastRatio(brandMeasurements.headerBg, brandMeasurements.sectionBg);
          const contrastTextVsBrandHeader = getContrastRatio(brandMeasurements.textColor, brandMeasurements.headerBg);

          console.log(`At "Chương thương hiệu": HeaderBg=${brandMeasurements.headerBg}, SectionBg=${brandMeasurements.sectionBg}`);
          console.log(`Contrast Header vs Brand Section: ${contrastHeaderVsBrand.toFixed(2)} (>= 1.5)`);
          console.log(`Contrast Text vs Header: ${contrastTextVsBrandHeader.toFixed(2)} (>= 4.5)`);

          if (contrastHeaderVsBrand < 1.5) {
            throw new Error(`Contrast at white section (${contrastHeaderVsBrand.toFixed(2)}) is < 1.5`);
          }
          console.log(`✓ 3. WCAG Contrast requirements passed at white section`);

          const whiteSectionScreenshotPath = path.join(SCREENSHOT_DIR, `header_white_section_${vp.name}_${theme}.png`);
          await page.screenshot({ path: whiteSectionScreenshotPath, clip: { x: 0, y: 0, width: vp.width, height: 160 } });

          // 4. Test on inner page: /products
          await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(600);

          const productsMeasurements = await page.evaluate(() => {
            const getEffectiveBgColor = (el) => {
              let cur = el;
              while (cur && cur !== document.documentElement) {
                const bg = window.getComputedStyle(cur).backgroundColor;
                if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
                  return bg;
                }
                cur = cur.parentElement;
              }
              return window.getComputedStyle(document.body).backgroundColor || "rgb(247, 246, 242)";
            };

            const header = document.querySelector("header[role='banner']");
            const main = document.querySelector("main");
            const headerTextEl = header?.querySelector("span.font-condensed");

            const headerStyle = window.getComputedStyle(header);
            const sectionBg = getEffectiveBgColor(main);
            const textStyle = headerTextEl ? window.getComputedStyle(headerTextEl) : null;

            return {
              headerBg: headerStyle.backgroundColor,
              sectionBg: sectionBg,
              textColor: textStyle?.color || "rgb(245, 244, 240)",
            };
          });

          const contrastHeaderVsProducts = getContrastRatio(productsMeasurements.headerBg, productsMeasurements.sectionBg);
          const contrastTextVsProducts = getContrastRatio(productsMeasurements.textColor, productsMeasurements.headerBg);

          console.log(`On /products: HeaderBg=${productsMeasurements.headerBg}, MainBg=${productsMeasurements.sectionBg}`);
          console.log(`Contrast Header vs Main on /products: ${contrastHeaderVsProducts.toFixed(2)}`);
          console.log(`Contrast Text vs Header on /products: ${contrastTextVsProducts.toFixed(2)}`);

          if (contrastTextVsProducts < 4.5) {
            throw new Error(`Text contrast on /products (${contrastTextVsProducts.toFixed(2)}) is < 4.5`);
          }
          console.log(`✓ 4. Header on /products verified and distinct`);

          const productsScreenshotPath = path.join(SCREENSHOT_DIR, `header_products_${vp.name}_${theme}.png`);
          await page.screenshot({ path: productsScreenshotPath, clip: { x: 0, y: 0, width: vp.width, height: 160 } });

          // 5. Test Live Search Dropdown Open
          const searchBtn = await page.$("button[aria-label*='tìm kiếm']");
          if (searchBtn) {
            await searchBtn.click();
            await page.waitForTimeout(300);
            const searchDropdown = await page.$("form[role='search']");
            if (!searchDropdown) throw new Error("Search dropdown did not open");

            const searchScreenshotPath = path.join(SCREENSHOT_DIR, `header_search_open_${vp.name}_${theme}.png`);
            await page.screenshot({ path: searchScreenshotPath, clip: { x: 0, y: 0, width: vp.width, height: 260 } });
            console.log(`✓ 5. Search dropdown opened and captured`);

            // Close search
            const closeSearchBtn = await page.$("button[aria-label*='Đóng tìm kiếm']");
            if (closeSearchBtn) await closeSearchBtn.click();
            await page.waitForTimeout(200);
          }

          // 6. Test Fullscreen Menu Overlay Open
          const menuBtn = await page.$("button[aria-label*='menu']");
          if (menuBtn) {
            await menuBtn.click();
            await page.waitForTimeout(300);
            const menuDialog = await page.$("div[role='dialog'][aria-label*='Menu']");
            if (!menuDialog) throw new Error("Menu overlay did not open");

            const menuScreenshotPath = path.join(SCREENSHOT_DIR, `header_menu_overlay_${vp.name}_${theme}.png`);
            await page.screenshot({ path: menuScreenshotPath });
            console.log(`✓ 6. Menu overlay opened and captured`);

            const closeMenuBtn = await page.$("button[aria-label*='Đóng menu']");
            if (closeMenuBtn) await closeMenuBtn.click();
            await page.waitForTimeout(200);
          }

          // 7. Verify No Console Errors & Overflow
          const { consoleErrors, networkErrors } = getErrors();
          const realErrors = consoleErrors.filter(
            (err) => !err.includes("Failed to load resource") && !err.includes("favicon")
          );
          if (realErrors.length > 0) {
            throw new Error(`Console errors encountered: ${realErrors.join("; ")}`);
          }
          console.log(`✓ 7. Zero console errors`);

          const overflow = await checkOverflow();
          if (overflow.hasOverflow) {
            throw new Error(`Horizontal overflow detected`);
          }
          console.log(`✓ 8. No horizontal overflow`);

          passedTests++;
        } catch (err) {
          console.error(`✗ SUITE FAILED [${testLabel}]:`, err.message);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedTests}/${totalTests} suites PASSED`);
  console.log("=======================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
