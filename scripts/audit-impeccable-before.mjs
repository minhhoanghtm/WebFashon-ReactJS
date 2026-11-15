import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { chromium } = require("../back-end/node_modules/playwright");

const BASE_URL = process.env.TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const OUTPUT_DIR = path.resolve(process.cwd(), "reports/impeccable");
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots/before");

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

async function runBeforeAudit() {
  console.log("================================================================================");
  console.log("  PHASE 24: IMPECCABLE LIVE UI/UX AUDIT & BEFORE CAPTURE MATRIX");
  console.log("================================================================================");
  console.log(`- Target URL: ${BASE_URL}`);
  console.log(`- Routes: ${AUDIT_ROUTES.length}`);
  console.log(`- Viewports: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
  console.log(`- Themes: ${THEMES.join(", ")}`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const auditLog = [];

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

    for (const theme of THEMES) {
      console.log(`\n>>> Auditing Theme: ${theme.toUpperCase()}...`);
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

            const filePath = `screenshots/before/${theme}/${vp.name}/${route.id}.png`;
            const fullPath = path.join(OUTPUT_DIR, filePath);
            await page.screenshot({ path: fullPath, fullPage: false });

            // Analyze UI metrics on desktop light
            if (theme === "light" && vp.name === "1920x1080") {
              const analysis = await page.evaluate(() => {
                const doc = document;
                const hasEyebrow = !!doc.querySelector(".font-mono.tracking-widest.uppercase");
                const buttonCount = doc.querySelectorAll("button").length;
                const textNodes = doc.querySelectorAll("h1, h2, h3, p, span");
                let hasOverflow = false;
                if (doc.documentElement.scrollWidth > window.innerWidth) {
                  hasOverflow = true;
                }
                return {
                  hasEyebrow,
                  buttonCount,
                  hasOverflow,
                  title: doc.title,
                };
              });

              auditLog.push({
                route: route.path,
                name: route.name,
                analysis,
              });
            }
            process.stdout.write(".");
          } catch (e) {
            console.error(`\n   Failed capturing ${route.path} on ${vp.name} [${theme}]:`, e.message);
          }
        }
      }
    }
    console.log("\n   All before screenshots captured successfully!");
    await context.close();
  } catch (err) {
    console.error("Critical error in runBeforeAudit:", err);
  } finally {
    await browser.close();
  }

  // Save audit data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "audit-before-data.json"),
    JSON.stringify(auditLog, null, 2),
    "utf-8"
  );
  console.log(`\nAudit log saved to: ${path.join(OUTPUT_DIR, "audit-before-data.json")}`);
}

runBeforeAudit().catch(console.error);
