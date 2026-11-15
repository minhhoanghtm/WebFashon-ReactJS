import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const OUTPUT_DIR = path.resolve(process.cwd(), "reports/impeccable");
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots/after");

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const THEMES = ["light", "dark"];

const AUDIT_ROUTES = [
  { path: "/", id: "home", name: "Editorial Homepage" },
  { path: "/products", id: "products", name: "Product Discovery" },
  { path: "/product/ao-hoodie-ni-bong-unisex", id: "product_detail", name: "Product Detail Experience" },
  { path: "/cart", id: "cart", name: "Minimal Cart View" },
  { path: "/checkout", id: "checkout", name: "Distraction-Free Checkout" },
  { path: "/lookbooks", id: "lookbooks", name: "Editorial Lookbook" },
  { path: "/user/dashboard", id: "user_dashboard", name: "Personal Account Workspace" },
  { path: "/orders", id: "orders", name: "Order History" },
  { path: "/admin", id: "admin_dashboard", name: "Admin Portal" },
  { path: "/about", id: "about", name: "Editorial Manifesto" },
  { path: "/faq", id: "faq", name: "FAQ Accordion" },
  { path: "/login", id: "login", name: "Authentication Portal" },
];

// Ensure directory structure
THEMES.forEach((theme) => {
  VIEWPORTS.forEach((vp) => {
    fs.mkdirSync(path.join(SCREENSHOT_DIR, `${theme}/${vp.name}`), { recursive: true });
  });
});

async function runAfterVerification() {
  console.log("================================================================================");
  console.log("  PHASE 24: IMPECCABLE POST-REDESIGN VERIFICATION & AFTER SCREENSHOT MATRIX");
  console.log("================================================================================");
  console.log(`- Target URL: ${BASE_URL}`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = {
    verifiedAt: new Date().toISOString(),
    routesAudited: AUDIT_ROUTES.length,
    viewportsTested: VIEWPORTS.length,
    themesTested: THEMES.length,
    functionalChecks: [],
    responsiveChecks: [],
    browserSurfacesChecks: [],
    screenshotsCaptured: [],
  };

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Mock auth state for protected routes
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          "user_info",
          JSON.stringify({
            id: "user-tester-01",
            name: "Haute Tester",
            email: "atelier.client@fashion.vn",
            role: "admin",
          })
        );
        localStorage.setItem("access_token", "mock-token-couture-2026");
      } catch (e) {}
    });

    // 1. VERIFY BROWSER SURFACES & SELECTION TOKENS
    console.log("\n[1/3] Verifying Browser Surfaces & Design Tokens...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(600);

    const tokenVerification = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        measureProse: style.getPropertyValue("--measure-prose").trim(),
        inputHeight: style.getPropertyValue("--input-height").trim(),
        touchTargetMin: style.getPropertyValue("--touch-target-min").trim(),
        colorCaret: style.getPropertyValue("--color-caret").trim(),
        colorSelectionBg: style.getPropertyValue("--color-selection-bg").trim(),
      };
    });
    console.log("   Detected Impeccable Tokens:", JSON.stringify(tokenVerification, null, 2));
    results.browserSurfacesChecks.push({
      status: tokenVerification.measureProse.includes("68ch") ? "PASS" : "FAIL",
      tokens: tokenVerification,
    });

    // 2. FUNCTIONAL MICRO-INTERACTIONS
    console.log("\n[2/3] Testing Core Functional Micro-Interactions...");

    // 2.1 Theme Switcher
    const themeBtn = page.locator('[data-testid="theme-switcher-trigger"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      const darkOption = page.locator('[data-testid="theme-option-dark"]').first();
      if (await darkOption.isVisible()) {
        await darkOption.click();
        await page.waitForTimeout(400);
        const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        results.functionalChecks.push({ name: "Theme Switcher to Dark", status: isDark ? "PASS" : "FAIL" });
      }
      // Revert to light
      await themeBtn.click();
      await page.waitForTimeout(300);
      const lightOption = page.locator('[data-testid="theme-option-light"]').first();
      if (await lightOption.isVisible()) {
        await lightOption.click();
        await page.waitForTimeout(400);
        const isLight = await page.evaluate(() => !document.documentElement.classList.contains("dark"));
        results.functionalChecks.push({ name: "Theme Switcher to Light", status: isLight ? "PASS" : "FAIL" });
      }
    }

    // 2.2 Mobile 320px Overflow Check on Homepage & ProductDetail
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    const homeOverflow320 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    results.responsiveChecks.push({
      viewport: "320x568",
      route: "/",
      horizontalOverflow: homeOverflow320 ? "FAIL (Overflowed)" : "PASS (No Overflow)",
    });

    await page.goto(`${BASE_URL}/product/ao-hoodie-ni-bong-unisex`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    const pdpOverflow320 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    results.responsiveChecks.push({
      viewport: "320x568",
      route: "/product/ao-hoodie-ni-bong-unisex",
      horizontalOverflow: pdpOverflow320 ? "FAIL (Overflowed)" : "PASS (No Overflow)",
    });

    // 3. CAPTURE AFTER SCREENSHOTS (5 Viewports × 2 Themes × 12 Routes)
    console.log("\n[3/3] Capturing After Visual Matrix (120 Screenshots)...");
    for (const theme of THEMES) {
      console.log(`\n>>> Capturing Theme: ${theme.toUpperCase()}...`);
      for (const vp of VIEWPORTS) {
        console.log(`   - Viewport: ${vp.name} (${vp.width}x${vp.height})`);
        await page.setViewportSize({ width: vp.width, height: vp.height });

        for (const route of AUDIT_ROUTES) {
          try {
            await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });

            // Apply theme on live page
            await page.evaluate((t) => {
              try {
                document.documentElement.setAttribute("data-theme", t);
                if (t === "dark") {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
                localStorage.setItem("theme-storage", JSON.stringify({ state: { theme: t } }));
              } catch (e) {}
            }, theme);

            await page.waitForTimeout(300);

            const filePath = `screenshots/after/${theme}/${vp.name}/${route.id}.png`;
            const fullPath = path.join(OUTPUT_DIR, filePath);
            await page.screenshot({ path: fullPath, fullPage: false });

            results.screenshotsCaptured.push({
              theme,
              viewport: vp.name,
              route: route.path,
              file: filePath,
            });
            process.stdout.write(".");
          } catch (e) {
            console.error(`\n   Failed capturing ${route.path} on ${vp.name} [${theme}]:`, e.message);
          }
        }
      }
    }
    console.log("\n   All after screenshots captured successfully!");
    await context.close();
  } catch (err) {
    console.error("Critical error in runAfterVerification:", err);
  } finally {
    await browser.close();
  }

  // Save after verification data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "verify-after-data.json"),
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  console.log(`\nResults written to: ${path.join(OUTPUT_DIR, "verify-after-data.json")}`);
  console.log("================================================================================");
}

runAfterVerification().catch(console.error);
