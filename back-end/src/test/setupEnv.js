// Test-only values. They are deliberately not production credentials.
// Modules validate these at import time, so they must be installed before tests load.
process.env.NODE_ENV = "test";
process.env.OTP_SECRET ??= "test-otp-secret-at-least-thirty-two-characters";
process.env.ACTION_SECRET ??= "test-action-secret-at-least-thirty-two-chars";
process.env.ACCESS_TOKEN_SECRET ??= "test-access-token-secret-at-least-32-chars";
process.env.REFRESH_TOKEN_SECRET ??= "test-refresh-token-secret-at-least-32-chars";
process.env.DISABLE_RATE_LIMIT_FOR_TESTS = "true";
