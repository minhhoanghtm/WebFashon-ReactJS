import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../back-end/node_modules/playwright");

export const BASE_URL = process.env.TEST_FRONTEND_URL || "http://localhost:5173";
export const API_URL = process.env.TEST_BACKEND_URL || "http://localhost:5000/api";

export const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

export async function createTestBrowser() {
  return await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
}

export async function setupPage(browser, options = {}) {
  const {
    viewport = VIEWPORTS.desktop,
    theme = "light", // 'light' | 'dark'
    storageState = null,
  } = options;

  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    storageState: storageState || undefined,
  });

  const page = await context.newPage();

  const errors = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known third-party / benign websocket disconnect during reload
      if (!text.includes("favicon") && !text.includes("Socket.IO") && !text.includes("vite")) {
        errors.push(text);
      }
    }
  });

  page.on("response", (resp) => {
    const status = resp.status();
    const url = resp.url();
    if (status >= 400 && !url.includes("/favicon") && !url.includes("google") && !url.includes("avatar")) {
      networkErrors.push({ url, status });
    }
  });

  // Helper to apply theme
  await page.addInitScript((mode) => {
    localStorage.setItem("webfashion_theme", mode);
    localStorage.setItem("theme", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, theme);

  return {
    context,
    page,
    getErrors: () => ({ consoleErrors: errors, networkErrors }),
    checkOverflow: async () => {
      return await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          hasOverflow: scrollWidth > docWidth,
        };
      });
    },
  };
}

export async function loginAs(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="passWord"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle", timeout: 8000 }).catch(() => {});
  // Give extra 500ms for state persistence
  await page.waitForTimeout(500);
}
