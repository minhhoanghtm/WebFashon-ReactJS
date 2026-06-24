import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("products_throughput");

export const options = {
  vus: 50,
  duration: "30s",
  thresholds: {
    successRate: ["rate>0.99"],
    errorCounter: ["count<10"],
    latencyTrend: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  group("GET /api/products", () => {
    const res = http.get(`${BASE_URL}/api/products`);

    const ok = check(res, {
      "status is exactly 200": (r) => r.status === 200,
    });

    successRate.add(ok);
    latencyTrend.add(res.timings.duration);
    throughput.add(1);

    if (!ok) {
      errorCounter.add(1);
      console.log(
        `GET /api/products failed: status=${res.status}, duration=${res.timings.duration}ms, body=${res.body}`
      );
    }
  });

  sleep(1);
}
