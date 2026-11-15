import { createTestBrowser, setupPage, BASE_URL } from "./helpers.mjs";

async function main() {
  console.log("=== KIỂM CHỨNG MỤC C: LOẠI TRỪ TỰ THAM CHIẾU & STATUS 0 ===");

  const browser = await createTestBrowser();
  const { page } = await setupPage(browser);

  const apiErrors = [];
  const apiTraces = [];

  page.on("request", (req) => {
    if (req.url().includes("/events") && req.method() === "POST") {
      try {
        const postData = JSON.parse(req.postData() || "{}");
        const events = postData.events || [postData];
        for (const ev of events) {
          if (ev.event_type === "api_error" || ev.eventType === "api_error") {
            apiErrors.push(ev);
          }
          if (ev.event_type === "api_trace" || ev.eventType === "api_trace") {
            apiTraces.push(ev);
          }
        }
      } catch {}
    }
  });

  // 1. Visit homepage
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 2. Perform regular page navigation
  await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.goto(`${BASE_URL}/policy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 3. Inspect if any api_error was generated for /events or status 0
  const spuriousErrors = apiErrors.filter((e) => {
    const ep = e.meta?.endpoint || "";
    return ep.includes("/events") || ep.includes("/tracking") || e.meta?.status === 0;
  });

  console.log(`Tổng api_error ghi nhận: ${apiErrors.length}`);
  console.log(`Spurious api_error (/events hoặc status 0): ${spuriousErrors.length}`);

  const passed = spuriousErrors.length === 0;
  console.log(`Kết quả: ${passed ? "PASS (Không có tự tham chiếu / status 0)" : "FAIL"}`);

  await browser.close();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
