import { BASE_URL, setupPage, VIEWPORTS } from "./helpers.mjs";

export async function testStorefront(browser, report) {
  console.log("\n=======================================================");
  console.log("TEST SUITE 1: STOREFRONT & CATALOG");
  console.log("=======================================================");

  const viewportsToTest = [
    { name: "Desktop (1920x1080)", viewport: VIEWPORTS.desktop },
    { name: "Mobile (390x844)", viewport: VIEWPORTS.mobile },
  ];

  for (const vp of viewportsToTest) {
    for (const theme of ["light", "dark"]) {
      const label = `Storefront Home [${vp.name} - ${theme.toUpperCase()}]`;
      const { page, context, getErrors, checkOverflow } = await setupPage(browser, {
        viewport: vp.viewport,
        theme,
      });

      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(1000);

        // 1. Verify Home dynamic content from BE
        const heroTitle = await page.textContent("h1, h2").catch(() => "");
        const hasHeroText = await page.evaluate(() => {
          const body = document.body.innerText;
          return (
            body.includes("ATELIER EDITION") ||
            body.includes("CẤU TRÚC") ||
            body.includes("BỘ SƯU TẬP")
          );
        });

        // 2. Check Footer dynamic content from BE
        const footerHasBE = await page.evaluate(() => {
          const body = document.body.innerText;
          return body.includes("404 STUDIO") || body.includes("Đồng Khởi");
        });

        // 3. Overflow check
        const overflow = await checkOverflow();

        // 4. Console & network errors
        const { consoleErrors, networkErrors } = getErrors();

        const passed = hasHeroText && footerHasBE && !overflow.hasOverflow;
        report.addResult({
          suite: "Storefront",
          testName: label,
          status: passed ? "PASS" : "FAIL",
          details: `Hero content: ${hasHeroText ? "OK" : "Missing"}, Footer content: ${footerHasBE ? "OK" : "Missing"}, Overflow: ${overflow.hasOverflow ? "FAIL" : "None"}, Console Errors: ${consoleErrors.length}, Network 4xx/5xx: ${networkErrors.length}`,
        });
      } catch (err) {
        report.addResult({
          suite: "Storefront",
          testName: label,
          status: "FAIL",
          details: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  // --- CATALOG & SEARCH FLOW (Desktop) ---
  {
    const label = "Catalog & Search Flow [Desktop]";
    const { page, context, getErrors } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
      theme: "light",
    });

    try {
      await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000);

      // Verify product list loaded
      const productCards = await page.$$("a[href*='/product/']");
      const hasProducts = productCards.length > 0;

      // Verify search input
      const searchInput = await page.$("input[type='text'], input[placeholder*='tìm kiếm' i], input[placeholder*='search' i]");
      let searchWorks = false;
      if (searchInput) {
        await searchInput.fill("Blazer");
        await page.waitForTimeout(800);
        searchWorks = true;
      }

      // Check product detail navigation
      let detailLoaded = false;
      let variantSelectable = false;
      if (hasProducts) {
        await productCards[0].click();
        await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);

        // Verify product title on detail page
        detailLoaded = await page.evaluate(() => {
          return document.body.innerText.includes("đ") || document.body.innerText.includes("VND") || document.body.innerText.includes("Giá");
        });

        // Test clicking variant buttons if any
        const variantButtons = await page.$$("button[aria-label*='Màu' i], button[data-variant], button:has-text('S'), button:has-text('M'), button:has-text('41')");
        if (variantButtons.length > 0) {
          await variantButtons[0].click().catch(() => {});
          variantSelectable = true;
        } else {
          variantSelectable = true; // No selectable variants or auto-selected
        }
      }

      const { consoleErrors, networkErrors } = getErrors();
      const passed = hasProducts && detailLoaded;
      report.addResult({
        suite: "Storefront",
        testName: label,
        status: passed ? "PASS" : "FAIL",
        details: `Products found: ${productCards.length}, Detail loaded: ${detailLoaded ? "OK" : "FAIL"}, Variants: ${variantSelectable ? "OK" : "N/A"}, Console Errors: ${consoleErrors.length}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Storefront",
        testName: label,
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }
}
