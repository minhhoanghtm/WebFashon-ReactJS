import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const TOKEN = __ENV.TOKEN || "";
const STRESS_PATH = __ENV.STRESS_PATH || "/api/products";

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("stress_throughput");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 200 },
    { duration: "30s", target: 300 },
    { duration: "60s", target: 500 },
  ],
  thresholds: {
    successRate: ["rate>0.95"],
    errorCounter: ["count<200"],
    latencyTrend: ["p(95)<1500", "p(99)<3000", "max<5000"],
    http_req_duration: ["p(95)<1500", "p(99)<3000", "max<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  group("stress target endpoint", () => {
    const params = TOKEN
      ? {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      : {};
    const res = http.get(`${BASE_URL}${STRESS_PATH}`, params);

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
    });

    successRate.add(ok);
    latencyTrend.add(res.timings.duration);
    throughput.add(1);

    if (!ok) {
      errorCounter.add(1);
      console.log(
        `GET ${STRESS_PATH} failed under stress: status=${res.status}, duration=${res.timings.duration}ms, body=${res.body}`
      );
    }
  });

  sleep(1);
}
