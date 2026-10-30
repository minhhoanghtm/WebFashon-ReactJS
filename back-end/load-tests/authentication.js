import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";
const TOTAL_USERS = 1000;
const TEST_PASSWORD = "Minhhoang123";

export const signInSuccessRate = new Rate("signInSuccessRate");
export const signInErrorCounter = new Counter("signInErrorCounter");
export const refreshTokenSuccessRate = new Rate("refreshTokenSuccessRate");
export const refreshTokenErrorCounter = new Counter("refreshTokenErrorCounter");
export const logoutSuccessRate = new Rate("logoutSuccessRate");
export const logoutErrorCounter = new Counter("logoutErrorCounter");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m",  target: 50 },
    { duration: "30s", target: 200 },
    { duration: "1m",  target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // sign-in chạy bcrypt.compare (cost=10, ~80-120ms/op) trên single-thread Node.js.
    // Dưới 200 VUs concurrent, event loop bão hòa → p95 ~1.7s là expected behavior.
    // Đây là trade-off bảo mật vs tốc độ — cost=10 là chuẩn production OWASP.
    "http_req_duration{endpoint:sign_in}":       ["p(95)<2500"],

    // refresh và logout chỉ thao tác Redis (del/get) — nhanh về mặt logic,
    // nhưng chạy sau sign-in trong cùng iteration nên bị ảnh hưởng bởi event loop lag.
    "http_req_duration{endpoint:refresh_token}": ["p(95)<2000"],
    "http_req_duration{endpoint:logout}":        ["p(95)<1500"],

    // Functional correctness — quan trọng hơn latency
    signInSuccessRate:       ["rate>0.95"],
    refreshTokenSuccessRate: ["rate>0.95"],
    http_req_failed:         ["rate<0.01"],
  },
};

export default function () {
  const userIndex = ((__VU - 1) % TOTAL_USERS) + 1;
  const email    = `loadtest${userIndex}@gmail.com`;
  const passWord = TEST_PASSWORD;

  // k6 tự động lưu cookie Set-Cookie từ response vào jar của VU.
  // Dùng cookieJar() để đọc lại refreshToken sau sign-in.
  const jar = http.cookieJar();

  let accessToken = null;

  // ── 1. Sign In ──────────────────────────────────────────────────────────────
  group("Sign In", () => {
    const res = http.post(
      `${BASE_URL}/api/auth/signIn`,
      JSON.stringify({ email, passWord }),
      {
        headers: { "Content-Type": "application/json" },
        tags:    { endpoint: "sign_in" },
      }
    );

    if (res.status !== 200) {
      console.log(`[VU ${__VU}] signIn ${email} → ${res.status}: ${res.body}`);
    }

    const ok = check(res, {
      "sign in: status is 200":   (r) => r.status === 200,
      "sign in: has accessToken": (r) => {
        try { return !!JSON.parse(r.body).data?.accessToken; } catch { return false; }
      },
    });

    signInSuccessRate.add(ok);
    if (ok) {
      accessToken = JSON.parse(res.body).data.accessToken;
      // BUG FIX 1: refreshToken KHÔNG nằm trong body —
      // server dùng res.cookie() → Set-Cookie header → k6 jar tự lưu.
      // Không cần lấy thủ công, k6 sẽ tự gửi lại khi gọi /refreshToken.
    } else {
      signInErrorCounter.add(1);
    }
  });

  if (!accessToken) { sleep(1); return; }
  sleep(1);

  // ── 2. Refresh Token ─────────────────────────────────────────────────────────
  // BUG FIX 2: endpoint thực tế là /refreshToken (xem auth.route.js dòng 36),
  //            không phải /refresh-token.
  // BUG FIX 3: server đọc refreshToken từ req.cookies, KHÔNG đọc từ body.
  //            Gửi request KHÔNG có body, k6 jar tự attach cookie.
  group("Refresh Token", () => {
    const res = http.post(
      `${BASE_URL}/api/auth/refreshToken`,
      null,   // body rỗng — server chỉ cần cookie
      {
        headers: { "Content-Type": "application/json" },
        tags:    { endpoint: "refresh_token" },
      }
    );

    if (res.status !== 200) {
      console.log(`[VU ${__VU}] refreshToken → ${res.status}: ${res.body}`);
    }

    const ok = check(res, {
      "refresh token: status is 200":   (r) => r.status === 200,
      "refresh token: has accessToken": (r) => {
        try { return !!JSON.parse(r.body).data?.accessToken; } catch { return false; }
      },
    });

    refreshTokenSuccessRate.add(ok);
    if (ok) {
      // Cập nhật accessToken mới (RTR — Refresh Token Rotation)
      accessToken = JSON.parse(res.body).data.accessToken;
      // refreshToken mới đã được server set lại vào cookie tự động
    } else {
      refreshTokenErrorCounter.add(1);
    }
  });
  sleep(1);

  // ── 3. Logout ────────────────────────────────────────────────────────────────
  // Cookie refreshToken trong jar sẽ được gửi kèm → server xoá session
  group("Logout", () => {
    const res = http.post(
      `${BASE_URL}/api/auth/signOut`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        tags: { endpoint: "logout" },
      }
    );

    const ok = check(res, {
      "logout: status is 200 or 204": (r) => r.status === 200 || r.status === 204,
    });

    logoutSuccessRate.add(ok);
    if (!ok) {
      logoutErrorCounter.add(1);
      console.log(`[VU ${__VU}] logout → ${res.status}: ${res.body}`);
    }
  });
  sleep(1);
}
