import { createTestBrowser } from "./helpers.mjs";
import { testCookieConsent } from "./07_cookie_consent.spec.mjs";

process.env.TEST_FRONTEND_URL = process.env.TEST_FRONTEND_URL || "http://localhost:8081";
process.env.TEST_BACKEND_URL = process.env.TEST_BACKEND_URL || "http://localhost:8081/api";

async function main() {
  console.log("Running Consent E2E against:", process.env.TEST_FRONTEND_URL);
  const browser = await createTestBrowser();
  const results = [];
  const report = {
    addResult: (r) => {
      results.push(r);
      console.log(`  [${r.status}] ${r.suite} > ${r.testName} (${r.details})`);
    },
  };

  try {
    await testCookieConsent(browser, report);
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log("\n=======================================================");
  console.log(`CONSENT E2E SUMMARY: Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main();
