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

async function run() {
  console.log("=======================================================");
  console.log("VERIFICATION: HOMEPAGE LAYOUT & FOOTER INTEGRATION");
  console.log("=======================================================\n");

  const browser = await createTestBrowser();
  let totalTests = 0;
  let passedTests = 0;

  try {
    for (const vp of VIEWPORTS) {
      for (const theme of ["light", "dark"]) {
        totalTests++;
        const testLabel = `${vp.name} [${theme.toUpperCase()}]`;
        console.log(`\n--- Running: ${testLabel} ---`);

        const { page, context, getErrors, checkOverflow } = await setupPage(browser, {
          viewport: { width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.hasTouch },
          theme,
        });

        try {
          await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(1000);

          // 1. Verify Top Position of "Tất cả thiết kế" section
          const heroMetrics = await page.evaluate(() => {
            const hero = document.querySelector("section[aria-label*='Khám phá bộ sưu tập']");
            const collection = document.querySelector("#home-content > section[aria-labelledby='home-collection-heading']");
            const heroRect = hero ? hero.getBoundingClientRect() : null;
            const collectionRect = collection ? collection.getBoundingClientRect() : null;
            return {
              heroHeight: heroRect ? heroRect.height : 0,
              collectionTop: collectionRect ? collectionRect.top : 0,
              windowHeight: window.innerHeight,
            };
          });

          console.log(`Viewport height: ${heroMetrics.windowHeight}px, Hero height: ${heroMetrics.heroHeight}px, Collection top: ${heroMetrics.collectionTop}px`);

          const isTopPeekVisible = heroMetrics.collectionTop <= heroMetrics.windowHeight * 1.1;
          if (!isTopPeekVisible) {
            throw new Error(`Collection top (${heroMetrics.collectionTop}px) is > 1.1 * viewport height (${heroMetrics.windowHeight * 1.1}px)`);
          }
          console.log(`✓ Collection top peeks inside first screen (< 1.1 * viewport height)`);

          // 2. Verify Section Ordering in DOM
          const sectionOrder = await page.evaluate(() => {
            const homeContent = document.getElementById("home-content");
            if (!homeContent) return [];
            return Array.from(homeContent.children).map((child) => {
              if (child.tagName.toLowerCase() === "section") {
                return child.getAttribute("aria-labelledby") || "collection-section";
              }
              const innerSection = child.querySelector("section");
              return innerSection ? innerSection.getAttribute("aria-label") || "inner-section" : child.className;
            });
          });

          console.log(`Section DOM order:`, JSON.stringify(sectionOrder, null, 2));
          if (!sectionOrder[0]?.includes("home-collection-heading") && !sectionOrder[0]?.includes("collection")) {
            throw new Error(`First child of #home-content is not collection section! Got: ${sectionOrder[0]}`);
          }
          console.log(`✓ "Tất cả thiết kế" is first section right after Hero`);

          // 3. Verify Manifesto Section hides empty "ATELIER ARCHIVE" frame when no video
          const manifestoHasArchiveBox = await page.evaluate(() => {
            const manifestoSec = document.querySelector("section[aria-label*='Tuyên ngôn']");
            if (!manifestoSec) return false;
            return (
              manifestoSec.innerText.includes("ATELIER ARCHIVE") ||
              manifestoSec.innerText.includes("MONOCHROME VISUAL RECORD") ||
              manifestoSec.innerText.includes("PHÁT PHIM TƯ LIỆU")
            );
          });

          if (manifestoHasArchiveBox) {
            throw new Error(`Empty frame "ATELIER ARCHIVE" is still rendered in Manifesto section!`);
          }
          console.log(`✓ Empty frame "ATELIER ARCHIVE" is cleanly hidden in Manifesto section`);

          // 4. Verify Vertical Gaps Between Sections <= 160px
          const gapsOk = await page.evaluate(() => {
            const homeContent = document.getElementById("home-content");
            if (!homeContent) return false;
            const children = Array.from(homeContent.children);
            for (let i = 0; i < children.length - 1; i++) {
              const currentRect = children[i].getBoundingClientRect();
              const nextRect = children[i + 1].getBoundingClientRect();
              const gap = nextRect.top - currentRect.bottom;
              if (gap > 160) {
                return { ok: false, gap, i };
              }
            }
            return { ok: true };
          });

          if (!gapsOk.ok) {
            throw new Error(`Gap between section ${gapsOk.i} and ${gapsOk.i + 1} exceeds 160px: ${gapsOk.gap}px`);
          }
          console.log(`✓ No vertical gap between sections exceeds 160px`);

          // 5. Verify Exactly 1 Footer in DOM
          const footerCount = await page.$$eval("footer", (els) => els.length);
          if (footerCount !== 1) {
            throw new Error(`Expected exactly 1 footer, found ${footerCount}`);
          }
          console.log(`✓ Exactly 1 footer rendered on homepage`);

          // 6. Test Category Filter & Interaction
          const categoryTabs = await page.$$("div[role='tablist'] button[role='tab']");
          if (categoryTabs.length > 1) {
            await categoryTabs[1].click();
            await page.waitForTimeout(400);
            const isTabActive = await categoryTabs[1].evaluate((btn) => btn.getAttribute("aria-selected") === "true");
            if (!isTabActive) throw new Error("Category tab did not become active when clicked");
            console.log(`✓ Category filtering interaction responsive`);
          }

          // 7. Verify Bottom "Xem toàn bộ thiết kế" Button exists and points to /products
          const bottomCtaHref = await page.$eval("a[href='/products']", (el) => el.getAttribute("href")).catch(() => null);
          if (bottomCtaHref !== "/products") {
            throw new Error(`Bottom CTA link to /products missing or invalid`);
          }
          console.log(`✓ Bottom CTA leading to /products verified`);

          // 8. Scroll top-to-bottom and verify 0 console errors
          await page.evaluate(async () => {
            const distance = 300;
            const delay = 100;
            while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
              document.scrollingElement.scrollBy(0, distance);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          });
          await page.waitForTimeout(600);

          const { consoleErrors, networkErrors } = getErrors();
          if (consoleErrors.length > 0) {
            throw new Error(`Console errors encountered during scroll: ${consoleErrors.join("; ")}`);
          }
          console.log(`✓ 0 console errors during full page scroll`);

          // 9. Verify Overflow Check
          const overflow = await checkOverflow();
          if (overflow.hasOverflow) {
            throw new Error(`Horizontal overflow detected: clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}`);
          }
          console.log(`✓ No horizontal overflow`);

          // 10. Take Full Page Screenshot
          const screenshotPath = path.join(SCREENSHOT_DIR, `home_${vp.name}_${theme}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`✓ Full-page screenshot saved: ${screenshotPath}`);

          passedTests++;
        } catch (err) {
          console.error(`✗ TEST FAILED [${testLabel}]:`, err.message);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n=======================================================");
  console.log(`SUMMARY: ${passedTests}/${totalTests} tests PASSED`);
  console.log("=======================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
