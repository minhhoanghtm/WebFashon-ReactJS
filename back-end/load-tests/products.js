import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

export const successRate = new Rate("successRate");
export const errorCounter = new Counter("errorCounter");
export const latencyTrend = new Trend("latencyTrend");
export const throughput = new Counter("products_throughput");

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Tăng dần lên 50 user ảo trong 30s
    { duration: "1m", target: 50 }, // Giữ 50 user trong 1 phút
    { duration: "30s", target: 200 }, // Tăng lên 200 user
    { duration: "1m", target: 200 }, // Giữ 200 user
    { duration: "30s", target: 0 }, // Giảm về 0 (kết thúc)
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% request phải dưới 500ms
    http_req_failed: ["rate<0.01"], // Tỉ lệ lỗi phải dưới 1%
    // Threshold riêng cho từng endpoint bằng tag
    "http_req_duration{endpoint:products_list}": ["p(95)<300"],
    "http_req_duration{endpoint:search}": ["p(95)<500"],
    "http_req_duration{endpoint:product_detail}": ["p(95)<300"],
    "http_req_duration{endpoint:categories}": ["p(95)<250"],
  },
};

// Hàm kiểm tra phản hồi từ server
function checkResponse(res, name) {
  const ok = check(res, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: is body`]: (r) => r.body && r.body.length > 0,
  });

  successRate.add(ok); // Ghi nhận thành công/thất bại
  latencyTrend.add(res.timings.duration); // Ghi nhận thời gian phản hồi
  if (!ok) {
    errorCounter.add(1); // Nếu fail thì tăng bộ đếm lỗi
  }
  return ok;
}

// Hàm gửi yêu cầu
export default function () {
  // Gửi yêu cầu GET đến endpoint /api/products
  group("Get products", () => {
    const res = http.get(`${BASE_URL}/api/products`, {
      tags: { endpoint: "products_list" },
    });
    checkResponse(res, "Get products");
    throughput.add(1);
  });

  //Test api search products
  group("Search", () => {
    const res = http.get(`${BASE_URL}/api/products?keyword=shirt`, {
      tags: { endpoint: "search" },
    });
    checkResponse(res, "Search");
  });

  //Test api get product detail
  group("Product detail", () => {
    const res = http.get(`${BASE_URL}/api/products/ao-khoac-bomber`, {
      tags: { endpoint: "product_detail" },
    });
    checkResponse(res, "Product detail");
  });

  //Test api get categories
  group("Categories", () => {
    const res = http.get(`${BASE_URL}/api/categories`, {
      tags: { endpoint: "categories" },
    });
    checkResponse(res, "Categories");
  });

  sleep(1);
}
