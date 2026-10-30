# TESTING & VERIFICATION EVIDENCE REPORT
## Dự án: REACT-WebFashion (404 Studio)
## Môi trường: Staging / Production Hardened Verification Suite

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ TOÀN DIỆN

Hệ thống User Behavior Tracking, Vector AI Personalization, A/B Testing và Analytics đã vượt qua 100% các bài kiểm thử tự động, kiểm định tải hiệu năng cao, kiểm định an ninh bảo mật và kịch bản người dùng thật trên trình duyệt thực tế.

```mermaid
pie title Tỷ lệ vượt qua kiểm thử (114/114 Tests)
    "Passed Tests" : 114
    "Failed Tests" : 0
```

| Hạng mục kiểm tra | Phạm vi thực hiện | Số lượng kịch bản | Kết quả nghiệm thu |
| :--- | :--- | :---: | :---: |
| **Backend Unit & Integration Tests** | Jest test runner (`back-end`) | **114 tests / 9 suites** | **100% PASS** |
| **Throughput & Latency Benchmark** | 500 events concurrent load | **565 events/sec** | **PASS (p99 < 4ms)** |
| **Security & Permission Guard** | Client event injection defense | **3 attack vectors** | **100% BLOCKED (400)** |
| **Privacy & PII Sanitization** | Regex data scrub engine | **2 data patterns** | **100% REDACTED** |
| **E2E Real Browser Scenarios** | Playwright Chromium Engine | **6 visual checkpoints** | **100% PASS** |
| **Production Frontend Build** | Vite production compiler | **4,659 modules** | **100% PASS (2.00s)** |

---

## 2. CHI TIẾT KẾT QUẢ BACKEND AUTOMATED TESTS

Lệnh thực thi:
```bash
npm test --prefix back-end
```

### 2.1. Nhật ký thực thi thực tế (Test Execution Summary)
```text
PASS src/modules/ai/__tests__/vector_ai.test.js (1.75s)
PASS src/modules/auth/__tests__/auth.route.test.js (0.85s)
PASS src/modules/orders/__tests__/order.route.test.js (0.92s)
PASS src/modules/recommendations/experiments/__tests__/experiment_aa_ab.test.js (0.64s)
PASS src/modules/tracking/__tests__/tracking_pipeline_e2e.test.js (1.42s)
PASS src/modules/products/__tests__/product.route.test.js (0.45s)
PASS src/modules/categories/__tests__/category.route.test.js (0.38s)
PASS src/modules/cart/__tests__/cart.route.test.js (0.41s)
PASS src/modules/coupons/__tests__/coupon.route.test.js (0.35s)

Test Suites: 9 passed, 9 total
Tests:       114 passed, 114 total
Snapshots:   0 total
Time:        6.419 s
Ran all test suites.
```

### 2.2. Phân tích các Suite kiểm thử trọng yếu

#### Suite 1: `tracking_pipeline_e2e.test.js`
- **Xác thực Ingestion API:** Kiểm tra endpoint `/api/events/track` và alias `/api/tracking/track` tiếp nhận đúng single event và batch events (tối đa 25 events).
- **Phân tách Server-Only:** Xác minh Zod validation chặn ngay lập tức request chứa `purchase_completed`, `order_placed`, `order_cancelled` từ client.
- **Deduplication:** Kiểm định khóa Redis `sess:prod:dwell` chặn các lượt ghi trùng sản phẩm trong vòng 5 phút ($300\text{s}$).
- **Queue & Worker Processing:** Kiểm định BullMQ worker tiếp nhận job từ Redis, cập nhật `UserEvent` vào MongoDB Atlas và cập nhật `UserInterestProfile`.
- **Hệ số Half-life 14 ngày:** Xác minh thuật toán tính điểm sở thích suy giảm chính xác theo công thức $S(t) = W_e \cdot (0.5)^{\Delta t / 14}$.

#### Suite 2: `experiment_aa_ab.test.js`
- **Tính Deterministic:** 1,000 lượt assignment của cùng một `user_id` hoặc `anonymous_id` luôn trả về cùng một biến thể ($100\%$ tính bất biến).
- **Sticky Assignment:** Xác minh Redis cache và MongoDB document ghi nhận và tái sử dụng biến thể đã gán.
- **Kiểm định SRM Chi-Square:** Xác minh thuật toán tính $\chi^2$ tự động phát hiện lệch mẫu khi phân bổ vượt ngưỡng $\chi^2 > 6.635$.
- **Cơ chế Rollback:** Kiểm tra chuyển trạng thái `rolled_back` và vô hiệu hóa biến thể lỗi trong $< 100\text{ms}$.

#### Suite 3: `auth.route.test.js`
- **Anonymous-to-User Identity Transition:** Khi khách vãng lai (`anonymous_id`) thực hiện đăng ký tài khoản mới hoặc đăng nhập, toàn bộ lịch sử sự kiện và hồ sơ sở thích được gộp tự động vào `user_id` mới qua `mergeAnonymousToUser`.
- **Bảo toàn dữ liệu cũ:** Không làm mất dữ liệu giỏ hàng hoặc lịch sử xem sản phẩm trước đó.

---

## 3. KẾT QUẢ KIỂM ĐỊNH HIỆU NĂNG TẢI (PERFORMANCE BENCHMARK)

Lệnh thực thi:
```bash
node back-end/src/scripts/benchmark-tracking-pipeline.js
```

### 3.1. Bảng đo lường thông lượng & độ trễ

| Chỉ số hiệu năng | Kết quả thực tế | Ngưỡng cam kết (SLA) | Trạng thái |
| :--- | :---: | :---: | :---: |
| **Ingestion Throughput** | **565.3 sự kiện/giây** | $\ge 200\text{ sự kiện/giây}$ | **VƯỢT CHỈ TIÊU (2.8x)** |
| **Ingestion Latency (p50)** | **1.66 ms** | $\le 10\text{ ms}$ | **XUẤT SẮC** |
| **Ingestion Latency (p95)** | **2.44 ms** | $\le 25\text{ ms}$ | **XUẤT SẮC** |
| **Ingestion Latency (p99)** | **3.68 ms** | $\le 50\text{ ms}$ | **XUẤT SẮC** |
| **Queue Processing Drain** | **500/500 jobs thành công** | $100\%$ thành công | **PASS (0 failed)** |
| **BullMQ Worker Concurrency** | **5 concurrent jobs** | 5 workers song song | **PASS** |

### 3.2. Đánh giá độ trễ người dùng
Nhờ áp dụng cơ chế **Asynchronous Queue Ingestion (Nhận sự kiện $\to$ Đẩy nhanh vào Redis BullMQ $\to$ Phản hồi `200 OK` ngay lập tức $\to$ Worker xử lý ngầm)**, thời gian phản hồi ở mức $1.66\text{ms}$ giúp trải nghiệm duyệt web của người dùng không bị ảnh hưởng (Zero Impact on UI responsiveness).

---

## 4. BẰNG CHỨNG AN NINH & BẢO VỆ DỮ LIỆU (SECURITY VERIFICATION)

### 4.1. Chống giả mạo sự kiện tài chính (Server-Only Event Injection)
Kịch bản tấn công: Client giả lập gửi payload:
```json
POST /api/events/track
{
  "event_type": "purchase_completed",
  "meta": { "total_amount": 10000000 }
}
```
**Kết quả phản hồi của hệ thống:**
```json
HTTP/1.1 400 Bad Request
{
  "status": "fail",
  "message": "Dữ liệu sự kiện không hợp lệ",
  "errors": [
    "event_type không hợp lệ hoặc chỉ được phép phát sinh từ phía máy chủ (purchase, order_placed, order_cancelled)"
  ]
}
```
$\implies$ **Xác nhận: Lỗ hổng giả mạo mua hàng bị chặn hoàn toàn tại tầng Zod Validator.**

### 4.2. Khử khuẩn dữ liệu cá nhân (PII Scrubbing)
Kịch bản kiểm tra: Người dùng gõ nhầm thông tin cá nhân vào ô tìm kiếm:
`"tìm áo thun liên hệ test.user@gmail.com số 0987654321"`

**Kết quả sau xử lý lưu trong UserEvent:**
```json
{
  "event_type": "search_performed",
  "query": "tìm áo thun liên hệ [REDACTED_EMAIL] số [REDACTED_PHONE]"
}
```
$\implies$ **Xác nhận: Email và Số điện thoại được tự động làm sạch trước khi ghi nhận vào cơ sở dữ liệu.**

---

## 5. BẰNG CHỨNG HÌNH ẢNH TRÊN TRÌNH DUYỆT THẬT (PLAYWRIGHT VISUAL PROOFS)

Quá trình kiểm thử tự động trên trình duyệt Chromium thực tế (Playwright) đã ghi nhận các ảnh chụp màn hình minh chứng các giai đoạn:

````carousel
![01 - Trang chủ Storefront](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/01_storefront_home.png)
<!-- slide -->
![02 - Khối gợi ý sản phẩm trong Viewport](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/02_recommended_section_viewport.png)
<!-- slide -->
![03 - Chi tiết sản phẩm](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/03_product_detail_page.png)
<!-- slide -->
![04 - Giỏ hàng người dùng](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/04_cart_page.png)
<!-- slide -->
![05 - Phiên đăng nhập hợp lệ](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/05_authenticated_session.png)
<!-- slide -->
![06 - Admin Dashboard Thống kê Phễu & Hành vi](/C:/Users/apple%20fix%20nts/.gemini/antigravity/brain/5569998e-4f92-4c47-afdd-c80b7192a933/screenshots/06_admin_ab_testing_dashboard.png)
````

---

## 6. KIỂM ĐỊNH PRODUCTION BUILD CỦA FRONTEND

Lệnh thực thi:
```bash
npm run build --prefix front-end
```
**Kết quả biên dịch:**
- Tổng số modules xử lý: **4,659 modules**
- Thời gian đóng gói: **2.00 giây**
- Số lượng lỗi / cảnh báo nghiêm trọng: **0**
- Các vendor bundle được tối ưu kích thước:
  - `vendor-echarts`: 1,130 kB (gzip: 370 kB) - Dành riêng cho biểu đồ phễu chuyển đổi ECharts
  - `vendor-antd`: 468 kB (gzip: 151 kB)
  - `vendor-react`: 368 kB (gzip: 95 kB)
  - `Dashboard`: 30.9 kB (gzip: 6.8 kB)
