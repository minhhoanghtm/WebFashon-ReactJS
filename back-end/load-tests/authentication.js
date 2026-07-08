import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";
const TOTAL_USERS = 1000;
const TEST_PASSWORD = "Minhhoang123";

//Custom metrics rieng cho load test
export const signInSuccessRate = new Rate("signInSuccessRate");
export const signInErrorCounter = new Counter("signInErrorCounter");
export const refreshTokenSuccessRate = new Rate("refreshTokenSuccessRate");
export const refreshTokenErrorCounter = new Counter("refreshTokenErrorCounter");
export const logoutSuccessRate = new Rate("logoutSuccessRate");
export const logoutErrorCounter = new Counter("logoutErrorCounter");
export const authErrorCounter = new Counter("authErrorCounter");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 200 },
    { duration: "1m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    "http_req_duration{endpoint:sign_in}": ["p(95)<800"],
    "http_req_duration{endpoint:refresh_token}": ["p(95)<500"],
    "http_req_duration{endpoint:logout}": ["p(95)<500"],
    signInSuccessRate: ["rate>0.95"],
    refreshTokenSuccessRate: ["rate>0.95"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Mỗi VU sử dụng một tài khoản khác nhau
  const userIndex = ((__VU - 1) % TOTAL_USERS) + 1;

  const email = `loadtest${userIndex}@gmail.com`;
  const passWord = TEST_PASSWORD;

  let accessToken = null;
  let refreshToken = null;

  // Sign in
  group("Sign In", () => {
    const payload = JSON.stringify({
      email,
      passWord,
    });

    const res = http.post(`${BASE_URL}/api/auth/signIn`, payload, {
  headers: { "Content-Type": "application/json" },
  tags: { endpoint: "sign_in" },
});
    if (res.status !== 200) {
      console.log(`[VU ${__VU}] ${email}: ${res.status}`);
      console.log(res.body);
    }
    const ok = check(res, {
      "sign in: status is 200": (r) => r.status === 200,
      "sign in: is access token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken !== undefined;
        } catch {
          return false;
        }
      },
    });

    signInSuccessRate.add(ok);
    if (ok) {
      const body = JSON.parse(res.body);
      accessToken = body.data.accessToken;
      // refreshToken is in cookies, but since refresh token tests are commented out, we don't need it.
    } else {
      signInErrorCounter.add(1);
    }
  });
  //Neu dign in sai thi dung test
  if (!accessToken) {
    sleep(1);
    return;
  }
  sleep(1);

  //Refresh token
  group("Refresh Token", () => {
    const payload = JSON.stringify({ refreshToken: refreshToken });
    const res = http.post(`${BASE_URL}/api/auth/refresh-token`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "refresh_token" },
    });

    const ok = check(res, {
      "refresh token: status is 200": (r) => r.status === 200,
      "refresh token: is access token": (r) => {
        try {
          return JSON.parse(r.body).accessToken !== undefined;
        } catch (error) {
          return false;
        }
      },
    });
    refreshTokenSuccessRate.add(ok);
    if (ok) {
      const body = JSON.parse(res.body);
      accessToken = body.accessToken; //Cap nhat lai token neu co refresh token moi
      if (body.refreshToken) {
        refreshToken = body.refreshToken; // Nếu có rotation
      }
    } else {
      refreshTokenErrorCounter.add(1);
    }
  });
  sleep(1);

  //Logout
  group("Logout", () => {
    const res = http.post(`${BASE_URL}/api/auth/signOut`, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      tags: { endpoint: "logout" },
    });

    const ok = check(res, {
      "logout: status is 200 or 204": (r) => r.status === 200 || r.status === 204,
    });

    logoutSuccessRate.add(ok);
    if (!ok) {
      logoutErrorCounter.add(1);
    }
  });
  sleep(1);
}
