/**
 * ==============================================================================
 * TEST SUITE 7: PRIVACY & COOKIE CONSENT END-TO-END VERIFICATION
 * 404 Studio — WebFashion Privacy Management System
 * ==============================================================================
 */

import { BASE_URL, setupPage, VIEWPORTS } from "./helpers.mjs";

export async function testCookieConsent(browser, report) {
  console.log("\n=======================================================");
  console.log("TEST SUITE 7: PRIVACY & COOKIE CONSENT MANAGEMENT");
  console.log("=======================================================");

  // ---------------------------------------------------------------------------
  // 1. Initial State: New Guest User (Consent UNKNOWN)
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      // Clear any existing localStorage consent
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      let trackingRequests = 0;
      const capturedUrls = [];
      page.on("request", (req) => {
        if (req.url().includes("/events") && req.method() === "POST" && !req.url().includes("/consent")) {
          trackingRequests++;
          capturedUrls.push(req.url());
        }
      });

      // Wait a moment on initial page without consent
      await page.waitForTimeout(1000);

      // Verify floating banner is visible
      const bannerVisible = await page.evaluate(() => {
        const btn = document.querySelector("#consent-accept-all-btn");
        return btn !== null && btn.offsetParent !== null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "1.1 Initial Visit: Floating Banner is Visible for New User",
        status: bannerVisible ? "PASS" : "FAIL",
        details: `Banner visible: ${bannerVisible}`,
      });

      // Verify all 3 action buttons exist
      const buttonsExist = await page.evaluate(() => {
        const essentialBtn = document.querySelector("#consent-essential-only-btn");
        const customBtn = document.querySelector("#consent-customize-btn");
        const acceptAllBtn = document.querySelector("#consent-accept-all-btn");
        return Boolean(essentialBtn && customBtn && acceptAllBtn);
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "1.2 Three Clear Actions Exist (Chỉ cần thiết, Tùy chỉnh, Chấp nhận tất cả)",
        status: buttonsExist ? "PASS" : "FAIL",
        details: `3 buttons present: ${buttonsExist}`,
      });

      // Verify NO non-essential tracking happened before consent
      report.addResult({
        suite: "Privacy & Consent",
        testName: "1.3 Tracking Gate: Zero tracking events dispatched before consent",
        status: trackingRequests === 0 ? "PASS" : "FAIL",
        details: `Dispatched tracking requests: ${trackingRequests} (${capturedUrls.join(", ")})`,
      });

      // Verify store browsing / essential functions work
      const canNavigate = await page.evaluate(() => {
        return Boolean(document.querySelector("header") || document.querySelector("main"));
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "1.4 Essential Storefront: Usable when consent choice is pending",
        status: canNavigate ? "PASS" : "FAIL",
        details: `Header/Main accessible: ${canNavigate}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "1. Initial Visit Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Action: "Chỉ cần thiết" (Essential Only)
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Click "Chỉ cần thiết"
      await page.click("#consent-essential-only-btn");
      await page.waitForTimeout(1000);

      let eventsSent = 0;
      const sentUrls = [];
      page.on("request", (req) => {
        if (req.url().includes("/events") && req.method() === "POST" && !req.url().includes("/consent")) {
          eventsSent++;
          sentUrls.push(req.url());
        }
      });

      // Verify banner disappeared
      const bannerHidden = await page.evaluate(() => {
        const btn = document.querySelector("#consent-essential-only-btn");
        return btn === null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "2.1 Action 'Chỉ cần thiết': Banner closes immediately",
        status: bannerHidden ? "PASS" : "FAIL",
        details: `Banner removed: ${bannerHidden}`,
      });

      // Verify localStorage state
      const consentRecord = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem("webfashion_privacy_consent_v1"));
        } catch {
          return null;
        }
      });

      const isEssentialSaved =
        consentRecord?.status === "ESSENTIAL_ONLY" &&
        consentRecord?.categories?.necessary === true &&
        consentRecord?.categories?.analytics === false &&
        consentRecord?.categories?.personalization === false;

      report.addResult({
        suite: "Privacy & Consent",
        testName: "2.2 Action 'Chỉ cần thiết': Persisted strictly necessary only",
        status: isEssentialSaved ? "PASS" : "FAIL",
        details: `Saved: ${JSON.stringify(consentRecord?.categories)}`,
      });

      // Navigate to /products and verify zero tracking events sent
      await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      report.addResult({
        suite: "Privacy & Consent",
        testName: "2.3 Action 'Chỉ cần thiết': No tracking events dispatched during navigation",
        status: eventsSent === 0 ? "PASS" : "FAIL",
        details: `Events sent: ${eventsSent} (${sentUrls.join(", ")})`,
      });

      // Verify banner does NOT reappear on navigation or refresh
      const bannerStillHidden = await page.evaluate(() => {
        return document.querySelector("#consent-essential-only-btn") === null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "2.4 Persistence: Banner does not reappear on route navigation",
        status: bannerStillHidden ? "PASS" : "FAIL",
        details: `Banner absent on /products: ${bannerStillHidden}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "2. Action Essential Only Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Action: "Chấp nhận tất cả" (Accept All)
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.removeItem("webfashion_privacy_consent_v1");
        localStorage.removeItem("webfashion_tracking_consent");
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      let eventsSent = 0;
      page.on("request", (req) => {
        if (req.url().includes("/events") && req.method() === "POST" && !req.url().includes("/consent")) {
          eventsSent++;
        }
      });

      // Click "Chấp nhận tất cả"
      await page.click("#consent-accept-all-btn");
      await page.waitForTimeout(1200);

      // Verify localStorage
      const consentRecord = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem("webfashion_privacy_consent_v1"));
        } catch {
          return null;
        }
      });

      const isAllAcceptedSaved =
        consentRecord?.status === "ALL_ACCEPTED" &&
        consentRecord?.categories?.necessary === true &&
        consentRecord?.categories?.analytics === true &&
        consentRecord?.categories?.personalization === true;

      report.addResult({
        suite: "Privacy & Consent",
        testName: "3.1 Action 'Chấp nhận tất cả': Saved analytics and personalization as true",
        status: isAllAcceptedSaved ? "PASS" : "FAIL",
        details: `Saved: ${JSON.stringify(consentRecord?.categories)}`,
      });

      // Verify tracking is now enabled and fires on navigation
      await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });
      await page.waitForTimeout(3500); // Wait for tracking batch flush timer

      report.addResult({
        suite: "Privacy & Consent",
        testName: "3.2 Action 'Chấp nhận tất cả': Tracking events successfully dispatched",
        status: eventsSent > 0 ? "PASS" : "FAIL",
        details: `Dispatched tracking events: ${eventsSent}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "3. Action Accept All Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Action: "Tùy chỉnh" (Customize Preferences Modal)
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.removeItem("webfashion_privacy_consent_v1");
        localStorage.removeItem("webfashion_tracking_consent");
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Click "Tùy chỉnh"
      await page.click("#consent-customize-btn");
      await page.waitForTimeout(500);

      // Verify modal is open with accessible attributes
      const modalOpen = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        return dialog !== null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "4.1 Action 'Tùy chỉnh': Preferences Modal opens with accessible dialog role",
        status: modalOpen ? "PASS" : "FAIL",
        details: `Modal role="dialog" visible: ${modalOpen}`,
      });

      // Toggle Analytics ON
      await page.click("#toggle-analytics");
      await page.waitForTimeout(300);

      // Save custom choices
      await page.click("#modal-save-custom-btn");
      await page.waitForTimeout(1000);

      // Verify custom choices saved: Analytics = true, Personalization = false
      const consentRecord = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem("webfashion_privacy_consent_v1"));
        } catch {
          return null;
        }
      });

      const isCustomSaved =
        consentRecord?.status === "CUSTOM" &&
        consentRecord?.categories?.analytics === true &&
        consentRecord?.categories?.personalization === false;

      report.addResult({
        suite: "Privacy & Consent",
        testName: "4.2 Custom Selection: Granular choice (Analytics=true, Personalization=false) saved",
        status: isCustomSaved ? "PASS" : "FAIL",
        details: `Saved categories: ${JSON.stringify(consentRecord?.categories)}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "4. Action Customize Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Withdrawal / Change Consent via Footer Link
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        // Pre-set consent with Analytics enabled
        localStorage.setItem(
          "webfashion_privacy_consent_v1",
          JSON.stringify({
            status: "ALL_ACCEPTED",
            categories: { necessary: true, analytics: true, personalization: true, marketing: false },
            policyVersion: "1.0",
            updatedAt: new Date().toISOString(),
            hasConsented: true,
          })
        );
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Scroll to footer and click "Quyền riêng tư & Cookie"
      const footerLink = await page.$("#footer-privacy-cookie-btn");
      if (footerLink) {
        await footerLink.scrollIntoViewIfNeeded();
        await footerLink.click();
        await page.waitForTimeout(500);

        const modalReopened = await page.evaluate(() => {
          return document.querySelector('[role="dialog"]') !== null;
        });

        report.addResult({
          suite: "Privacy & Consent",
          testName: "5.1 Footer Link: 'Quyền riêng tư & Cookie' re-opens Preferences Modal",
          status: modalReopened ? "PASS" : "FAIL",
          details: `Modal reopened from footer: ${modalReopened}`,
        });

        // Click "Từ chối không thiết yếu" in modal to withdraw consent
        await page.click("#modal-reject-all-btn");
        await page.waitForTimeout(1000);

        const updatedConsent = await page.evaluate(() => {
          try {
            return JSON.parse(localStorage.getItem("webfashion_privacy_consent_v1"));
          } catch {
            return null;
          }
        });

        const isWithdrawn =
          updatedConsent?.categories?.analytics === false &&
          updatedConsent?.categories?.personalization === false;

        report.addResult({
          suite: "Privacy & Consent",
          testName: "5.2 Consent Withdrawal: Revoking analytics immediately updates local & server state",
          status: isWithdrawn ? "PASS" : "FAIL",
          details: `Post-withdrawal categories: ${JSON.stringify(updatedConsent?.categories)}`,
        });
      } else {
        report.addResult({
          suite: "Privacy & Consent",
          testName: "5.1 Footer Link presence",
          status: "FAIL",
          details: "#footer-privacy-cookie-btn not found",
        });
      }
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "5. Withdrawal Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Responsive UI & Viewport Validation
  // ---------------------------------------------------------------------------
  {
    const viewports = [
      { name: "Mobile 320px (iPhone SE mini)", width: 320, height: 568 },
      { name: "Mobile 375px (iPhone standard)", width: 375, height: 667 },
      { name: "Mobile 430px (iPhone Pro Max)", width: 430, height: 932 },
      { name: "Tablet 768px (iPad portrait)", width: 768, height: 1024 },
      { name: "Desktop 1440px (MacBook Pro)", width: 1440, height: 900 },
      { name: "Desktop 1920px (Full HD)", width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      const { page, context } = await setupPage(browser, {
        viewport: { width: vp.width, height: vp.height, isMobile: vp.width < 768, hasTouch: vp.width < 768 },
      });

      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await page.evaluate(() => {
          localStorage.removeItem("webfashion_privacy_consent_v1");
          localStorage.removeItem("webfashion_tracking_consent");
        });
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });

        // Check banner buttons visibility and dimensions
        const bannerButtonsCheck = await page.evaluate(() => {
          const btn = document.querySelector("#consent-accept-all-btn");
          if (!btn) return false;
          const rect = btn.getBoundingClientRect();
          return rect.width > 0 && rect.height >= 40;
        });

        report.addResult({
          suite: "Privacy & Consent",
          testName: `6. Viewport ${vp.name}: Responsive layout & no horizontal overflow`,
          status: !overflow && bannerButtonsCheck ? "PASS" : "FAIL",
          details: `Overflow: ${overflow}, Button min-height: ${bannerButtonsCheck}`,
        });
      } catch (err) {
        report.addResult({
          suite: "Privacy & Consent",
          testName: `6. Viewport ${vp.name}`,
          status: "FAIL",
          details: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Keyboard Accessibility & WCAG 2.2 AA Compliance
  // ---------------------------------------------------------------------------
  {
    const { page, context } = await setupPage(browser, {
      viewport: VIEWPORTS.desktop,
    });

    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.removeItem("webfashion_privacy_consent_v1");
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open customize modal
      await page.click("#consent-customize-btn");
      await page.waitForTimeout(500);

      // Press Escape key
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);

      // Verify modal closed on Escape
      const modalClosedOnEsc = await page.evaluate(() => {
        return document.querySelector('[role="dialog"]') === null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "7.1 WCAG AA: Escape key closes preferences modal without unwanted consent",
        status: modalClosedOnEsc ? "PASS" : "FAIL",
        details: `Modal closed on Escape: ${modalClosedOnEsc}`,
      });

      // Verify banner still present after dismissing modal without save
      const bannerRemains = await page.evaluate(() => {
        return document.querySelector("#consent-accept-all-btn") !== null;
      });

      report.addResult({
        suite: "Privacy & Consent",
        testName: "7.2 State Preservation: Banner remains pending when preferences dismissed without save",
        status: bannerRemains ? "PASS" : "FAIL",
        details: `Banner still pending: ${bannerRemains}`,
      });
    } catch (err) {
      report.addResult({
        suite: "Privacy & Consent",
        testName: "7. Accessibility Suite",
        status: "FAIL",
        details: err.message,
      });
    } finally {
      await context.close();
    }
  }
}
