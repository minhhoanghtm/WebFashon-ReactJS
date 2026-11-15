import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const OUTPUT_DIR = path.resolve(process.cwd(), "reports/theme-audit");
const SCREENSHOTS_LIGHT = path.join(OUTPUT_DIR, "screenshots/light");
const SCREENSHOTS_DARK = path.join(OUTPUT_DIR, "screenshots/dark");

// Ensure output dirs exist
fs.mkdirSync(SCREENSHOTS_LIGHT, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DARK, { recursive: true });

function parseRgb(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

async function runThemeAudit() {
  console.log("🎨 [Phase 21] Starting Theme System Audit & Automated Test Matrix...");
  console.log(`🌐 Target: ${BASE_URL}`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = {
    testedAt: new Date().toISOString(),
    defaultThemeTest: null,
    themeSwitchTests: [],
    persistenceTest: null,
    contrastAudit: { light: [], dark: [] },
    screenshots: { light: [], dark: [] },
  };

  try {
    // 1. Fresh Context Test: Verify default theme is LIGHT
    console.log("\n--- TEST 1: Default Theme on Clean First Visit ---");
    const freshContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await freshContext.newPage();

    // Navigate to homepage with empty storage
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const initialThemeAttr = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        dataTheme: doc.getAttribute("data-theme"),
        hasDarkClass: doc.classList.contains("dark"),
        localStorageValue: localStorage.getItem("webfashion_theme"),
        metaThemeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
      };
    });

    console.log("Initial Document Theme State:", initialThemeAttr);
    const isDefaultLight = initialThemeAttr.dataTheme === "light" && !initialThemeAttr.hasDarkClass;
    console.log(`✅ Default is LIGHT: ${isDefaultLight ? "PASS" : "FAIL"}`);

    results.defaultThemeTest = {
      pass: isDefaultLight,
      ...initialThemeAttr,
    };

    // 2. Interactive Theme Switcher Test
    console.log("\n--- TEST 2: Interactive Theme Switching & LocalStorage Persistence ---");
    // Click theme switcher trigger
    const switcherTrigger = page.locator('[data-testid="theme-switcher-trigger"]').first();
    await switcherTrigger.waitFor({ state: "visible", timeout: 4000 });
    await switcherTrigger.click();
    await page.waitForTimeout(400);

    // Switch to DARK
    const darkOption = page.locator('[data-testid="theme-option-dark"]').first();
    await darkOption.waitFor({ state: "visible", timeout: 2000 });
    await darkOption.click();
    await page.waitForTimeout(500);

    const darkThemeState = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      hasDarkClass: document.documentElement.classList.contains("dark"),
      localStorageValue: localStorage.getItem("webfashion_theme"),
      metaThemeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    }));
    console.log("After Switching to Dark:", darkThemeState);

    const isDarkSwitched = darkThemeState.dataTheme === "dark" && darkThemeState.hasDarkClass && darkThemeState.localStorageValue === "dark";
    console.log(`✅ Switched to DARK: ${isDarkSwitched ? "PASS" : "FAIL"}`);
    results.themeSwitchTests.push({ target: "dark", pass: isDarkSwitched, ...darkThemeState });

    // Test Reload Persistence in Dark Mode
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const persistedDarkState = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      hasDarkClass: document.documentElement.classList.contains("dark"),
      localStorageValue: localStorage.getItem("webfashion_theme"),
    }));
    const isPersistedDark = persistedDarkState.dataTheme === "dark" && persistedDarkState.hasDarkClass;
    console.log(`✅ Persistence on Reload (Dark): ${isPersistedDark ? "PASS" : "FAIL"}`);
    results.persistenceTest = { pass: isPersistedDark, ...persistedDarkState };

    // Switch to SYSTEM
    await switcherTrigger.click();
    await page.waitForTimeout(400);
    const systemOption = page.locator('[data-testid="theme-option-system"]').first();
    await systemOption.waitFor({ state: "visible", timeout: 2000 });
    await systemOption.click();
    await page.waitForTimeout(500);

    const systemThemeState = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      localStorageValue: localStorage.getItem("webfashion_theme"),
    }));
    console.log("After Switching to System:", systemThemeState);
    const isSystemSwitched = systemThemeState.localStorageValue === "system";
    console.log(`✅ Switched to SYSTEM: ${isSystemSwitched ? "PASS" : "FAIL"}`);
    results.themeSwitchTests.push({ target: "system", pass: isSystemSwitched, ...systemThemeState });

    // Switch back to LIGHT
    await switcherTrigger.click();
    await page.waitForTimeout(400);
    const lightOption = page.locator('[data-testid="theme-option-light"]').first();
    await lightOption.waitFor({ state: "visible", timeout: 2000 });
    await lightOption.click();
    await page.waitForTimeout(500);

    const lightThemeState = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      hasDarkClass: document.documentElement.classList.contains("dark"),
      localStorageValue: localStorage.getItem("webfashion_theme"),
      metaThemeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    }));
    console.log("After Switching back to Light:", lightThemeState);
    const isLightSwitched = lightThemeState.dataTheme === "light" && !lightThemeState.hasDarkClass;
    console.log(`✅ Switched back to LIGHT: ${isLightSwitched ? "PASS" : "FAIL"}`);
    results.themeSwitchTests.push({ target: "light", pass: isLightSwitched, ...lightThemeState });

    // 3. Contrast & Color Evaluation Function
    const evaluatePageContrast = async (themeName) => {
      return await page.evaluate((currTheme) => {
        function rgbFromStr(str) {
          if (!str) return null;
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
        }

        const body = document.body;
        const bodyBg = window.getComputedStyle(body).backgroundColor;
        const bodyColor = window.getComputedStyle(body).color;

        const h1 = document.querySelector("h1, h2");
        const hColor = h1 ? window.getComputedStyle(h1).color : bodyColor;

        const p = document.querySelector("p");
        const pColor = p ? window.getComputedStyle(p).color : bodyColor;

        const btn = document.querySelector('button[class*="bg-["], a[class*="bg-["]');
        const btnBg = btn ? window.getComputedStyle(btn).backgroundColor : null;
        const btnColor = btn ? window.getComputedStyle(btn).color : null;

        const card = document.querySelector('article, [class*="bg-[#"], [class*="rounded"]');
        const cardBg = card ? window.getComputedStyle(card).backgroundColor : bodyBg;

        return {
          theme: currTheme,
          bodyBg,
          bodyColor,
          hColor,
          pColor,
          btnBg,
          btnColor,
          cardBg,
        };
      }, themeName);
    };

    // Key routes to test and screenshot
    const testRoutes = [
      { path: "/", id: "home", name: "Trang Chủ" },
      { path: "/products", id: "products", name: "Bộ Sưu Tập" },
      { path: "/cart", id: "cart", name: "Giỏ Hàng" },
      { path: "/checkout", id: "checkout", name: "Thanh Toán" },
      { path: "/login", id: "login", name: "Đăng Nhập" },
      { path: "/vouchers", id: "vouchers", name: "Săn Mã Giảm Giá" },
      { path: "/about", id: "about", name: "Về Thương Hiệu" },
      { path: "/admin", id: "admin_dashboard", name: "Admin Dashboard" },
    ];

    const viewports = [
      { name: "desktop", width: 1920, height: 1080 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 390, height: 844 },
    ];

    // 4. Test Matrix: Light Mode
    console.log("\n--- TEST 3: Capturing LIGHT MODE Across Routes & Viewports ---");
    // Ensure Light mode is active
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("webfashion_theme", "light");
    });

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of testRoutes) {
        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 8000 });
        } catch {
          await page.waitForTimeout(1000);
        }
        await page.waitForTimeout(400);

        const filename = `${route.id}_${vp.name}.png`;
        const filepath = path.join(SCREENSHOTS_LIGHT, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        results.screenshots.light.push({ route: route.path, viewport: vp.name, file: filename });

        if (vp.name === "desktop" && (route.id === "home" || route.id === "products")) {
          const metrics = await evaluatePageContrast("light");
          const bgRgb = parseRgb(metrics.bodyBg);
          const textRgb = parseRgb(metrics.pColor);
          const hRgb = parseRgb(metrics.hColor);
          const textContrast = getContrast(bgRgb, textRgb);
          const hContrast = getContrast(bgRgb, hRgb);

          results.contrastAudit.light.push({
            route: route.path,
            metrics,
            textContrast,
            hContrast,
            passAA: textContrast >= 4.5,
            passAAA: textContrast >= 7.0,
          });
          console.log(`[Light Mode] ${route.name} Contrast: Text=${textContrast}:1 (AA: ${textContrast >= 4.5}), Headings=${hContrast}:1`);
        }
      }
    }

    // 5. Test Matrix: Dark Mode
    console.log("\n--- TEST 4: Capturing DARK MODE Across Routes & Viewports ---");
    // Switch to Dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("webfashion_theme", "dark");
    });

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of testRoutes) {
        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 8000 });
        } catch {
          await page.waitForTimeout(1000);
        }
        await page.waitForTimeout(400);

        const filename = `${route.id}_${vp.name}.png`;
        const filepath = path.join(SCREENSHOTS_DARK, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        results.screenshots.dark.push({ route: route.path, viewport: vp.name, file: filename });

        if (vp.name === "desktop" && (route.id === "home" || route.id === "products")) {
          const metrics = await evaluatePageContrast("dark");
          const bgRgb = parseRgb(metrics.bodyBg);
          const textRgb = parseRgb(metrics.pColor);
          const hRgb = parseRgb(metrics.hColor);
          const textContrast = getContrast(bgRgb, textRgb);
          const hContrast = getContrast(bgRgb, hRgb);

          results.contrastAudit.dark.push({
            route: route.path,
            metrics,
            textContrast,
            hContrast,
            passAA: textContrast >= 4.5,
            passAAA: textContrast >= 7.0,
          });
          console.log(`[Dark Mode] ${route.name} Contrast: Text=${textContrast}:1 (AA: ${textContrast >= 4.5}), Headings=${hContrast}:1`);
        }
      }
    }

    // Save summary json
    const jsonPath = path.join(OUTPUT_DIR, "theme-matrix-data.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`\n🎉 Theme Audit completed successfully! Saved results to ${jsonPath}`);

    await freshContext.close();
  } catch (err) {
    console.error("❌ Theme Audit error:", err);
  } finally {
    await browser.close();
  }
}

runThemeAudit();
