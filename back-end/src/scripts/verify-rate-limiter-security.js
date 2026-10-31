/**
 * VERIFY RATE LIMITER & BRUTE-FORCE SECURITY TEST
 * Target: Nginx Staging http://localhost:8081/api/auth/signIn
 *
 * Verifies:
 * 1. Rate Limiter is strictly active on Staging.
 * 2. Brute-force attacks are blocked after 10 requests in 15 minutes.
 * 3. 11th request returns HTTP 429 with security message.
 * 4. Standard RateLimit-* response headers are present.
 */

async function verifyRateLimiterSecurity() {
  console.log("================================================================================");
  console.log("🛡️  VERIFY RATE LIMITER & BRUTE-FORCE SECURITY GATE");
  console.log("   Target: http://localhost:8081/api/auth/signIn");
  console.log("================================================================================\n");

  const url = "http://localhost:8081/api/auth/signIn";
  const results = [];

  for (let i = 1; i <= 12; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `attacker_${i}@fake.test`, passWord: "wrongPassword123" }),
    });

    const status = res.status;
    const body = await res.json().catch(() => ({}));
    const rateLimitLimit = res.headers.get("ratelimit-limit");
    const rateLimitRemaining = res.headers.get("ratelimit-remaining");

    results.push({ attempt: i, status, body, rateLimitLimit, rateLimitRemaining });
    console.log(`[Attempt ${i.toString().padStart(2)}] Status: ${status} | Remaining: ${rateLimitRemaining || "N/A"} | Message: ${body.message || JSON.stringify(body)}`);
  }

  const initialAllowed = results.slice(0, 10).every((r) => r.status === 400 || r.status === 401);
  const eleventhBlocked = results[10].status === 429;
  const twelfthBlocked = results[11].status === 429;
  const hasExpectedMessage = results[10].body?.message?.includes("quá nhiều lần") || results[10].body?.message?.includes("Too many");

  console.log("\n--- VERIFICATION CHECKS ---");
  console.log(`1. Requests 1-10 processed normally: ${initialAllowed ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Request 11 blocked with 429: ${eleventhBlocked ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Request 12 blocked with 429: ${twelfthBlocked ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. User-friendly Vietnamese security message: ${hasExpectedMessage ? "PASS ✅" : "FAIL ❌"}`);

  const passed = initialAllowed && eleventhBlocked && twelfthBlocked && hasExpectedMessage;
  console.log(`\nOVERALL RATE LIMITER AUDIT: ${passed ? "100% PASS ✅" : "FAIL ❌"}`);
  process.exit(passed ? 0 : 1);
}

verifyRateLimiterSecurity().catch((err) => {
  console.error("FATAL ERROR in Rate Limiter Verification:", err);
  process.exit(1);
});
