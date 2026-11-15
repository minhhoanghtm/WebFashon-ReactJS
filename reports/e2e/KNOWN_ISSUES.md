# Phase 10: Known Issues, Environmental Constraints & Mitigations

**Dự án:** `REACT-WebFashion`  
**Ngày thực hiện:** 16/11/2026  
**Trạng thái hệ thống:** Sẵn sàng kiểm thử tự động 100% (E2E Automated)  
**Tiêu chuẩn:** Zero Fatal Runtime Exceptions, Production-Grade Resiliency  

---

## 1. Tổng quan phạm vi môi trường kiểm thử

Trong quá trình thực hiện kiểm thử tự động toàn diện 100% routes và chức năng (Phase 10), hệ thống hoạt động trong môi trường phát triển cục bộ tích hợp (Local Full-Stack End-to-End Environment):
- **Frontend App:** Vite React 19 SPA (`http://127.0.0.1:5173`)
- **Backend API:** Node.js Express Cluster (`http://127.0.0.1:5000/api`)
- **Database:** MongoDB Memory / Replica-set Dev Instance với Seeded Catalog Data
- **Automation Engine:** Playwright Chromium Headless/Headful 1920x1080 Viewport
- **Recording Stream:** Single Consolidated Video Stream (`videos/FULL_WEBSITE_E2E_TEST.webm`)

Mọi tương tác được thiết kế nhằm mô phỏng sát nhất hành vi người dùng thật, bao gồm cả trạng thái xác thực phiên (Session Persistence) và giả lập luồng giỏ hàng / đặt hàng.

---

## 2. Danh mục giả định môi trường (Test Environment Assumptions)

### 2.1 Giả lập phiên Quản trị viên (Admin Session Injection)
- **Đặc điểm:** Các tuyến đường `/admin/*` (Bao gồm Dashboard, Sản phẩm, Đơn hàng, Khách hàng, Coupons, Chiến dịch, Banners, Lookbooks, A/B Testing, User Activity, Pages, Settings) yêu cầu phân quyền `role: "admin"`.
- **Cơ chế kiểm thử:** Automation script tự động inject JWT token và `auth_user: {"role": "admin", "username": "e2e_tester"}` vào `localStorage` trước khi truy cập context Admin.
- **Rủi ro môi trường:** Nếu token hết hạn trong phiên kiểm thử dài, có thể xuất hiện chuyển hướng về `/login`.
- **Biện pháp xử lý:** Playwright script thiết lập thời gian sống token giả lập dài và fallback auto-login nếu phát hiện trạng thái 401 trên frontend state.

### 2.2 Dữ liệu mẫu khởi tạo (Seeded Mock Catalog & Inventory)
- **Đặc điểm:** Các chức năng thêm giỏ hàng, lọc sản phẩm theo category/size/color phụ thuộc vào sự tồn tại của sản phẩm trong cơ sở dữ liệu.
- **Cơ chế kiểm thử:** Bộ seed dữ liệu thời trang cung cấp tối thiểu 5 danh mục chính (Nam, Nữ, Phụ kiện, Giày dép, Bộ sưu tập mới), 20+ SKU với biến thể size (S, M, L, XL) và màu sắc (Đen, Trắng, Be, Xanh navy).
- **Rủi ro môi trường:** Thao tác checkout có thể làm giảm tồn kho (stock count) trong database.
- **Biện pháp xử lý:** Kịch bản test chỉ đặt hàng ở chế độ COD / VNPAY Sandbox hoặc rollback trạng thái đơn hàng sau mỗi chu kỳ kiểm thử nặng.

### 2.3 Cổng thanh toán bên thứ ba (Third-Party Payment Gateways Sandbox)
- **Đặc điểm:** Cổng thanh toán VNPAY, MoMo, ZaloPay trên môi trường local không thể redirect tới bank production thực tế mà không phát sinh chi phí tiền tệ thật.
- **Cơ chế kiểm thử:** Route `/payment-result` và `/checkout` sử dụng sandbox test response (Status: Success, TransactionNo: mock_123456789) để xác thực luồng hoàn tất đơn hàng và hiển thị giao diện thành công.
- **Biện pháp xử lý:** Đảm bảo toàn bộ UI feedback, hóa đơn tóm tắt và nút "Tiếp tục mua sắm" hoạt động chuẩn mực mà không phụ thuộc callback IPN từ internet.

---

## 3. Các vấn đề tồn tại đã biết và giải pháp khắc phục (Known Issues & Mitigations)

| STT | Hiện tượng / Tình huống | Mức độ ảnh hưởng | Nguyên nhân kỹ thuật | Biện pháp khắc phục đã triển khai | Trạng thái |
|:---:|:---|:---:|:---|:---|:---:|
| 1 | **Vercel Build ERESOLVE Error** | Critical (Production CI/CD) | `react-quill@2.0.0` phụ thuộc `react@^16\|\|^17\|\|^18`, xung đột trực tiếp với `react@19.2.4` trên Node 20. | Đã chuyển sang `react-quill-new@^3.3.3` (Hỗ trợ chính thức React 19), loại bỏ thư viện thừa `swal`, `path`. Build Vercel & Vite thành công 100%. | **RESOLVED** |
| 2 | **Vercel Root Monorepo Missing Lockfile** | High (Vercel Deploy) | Vercel mặc định quét root repository nếu không chỉ định `Root Directory: front-end`. Thư mục gốc thiếu `package.json`. | Đã bổ sung `package.json`, `package-lock.json` và `vercel.json` tại root repository định tuyến chuẩn xác tới Frontend build. | **RESOLVED** |
| 3 | **Docker Compose `env_file` Strict Failure** | High (Docker Local Deploy) | Cấu hình `docker-compose.prod.yml` yêu cầu file `./back-end/.env.production`, gây crash nếu file môi trường chưa được phân phối thủ công. | Cập nhật cấu hình sang cú pháp object `path: ...` với `required: false` và cung cấp default env variables an toàn. | **RESOLVED** |
| 4 | **Nginx Container 404 on Deep SPA Links** | Medium (Docker Deployment) | Nginx cơ bản trong container Frontend chưa cấu hình URL rewriting cho Single Page Application, gây 404 khi truy cập trực tiếp `/products` hoặc `/cart`. | Bổ sung file `front-end/nginx.conf` với chỉ thị `try_files $uri $uri/ /index.html;` và cấu hình Dockerfile copy vào `/etc/nginx/conf.d/default.conf`. | **RESOLVED** |
| 5 | **Transient ISP Network Latency (GitHub Push)** | Low (DevOps / Network) | Mạng ISP nội địa có thời điểm rớt gói tin hoặc timeout kết nối tới `github.com:443` trong tích tắc. | Tự động retry cơ chế push an toàn, chia nhỏ commit theo Conventional Commits, bảo toàn 100% dữ liệu không dùng `--force`. | **RESOLVED** |
| 6 | **Admin Sidebar Tooltip Hover Flickering** | Minor (UI/UX) | Khi cuộn trang nhanh trong dashboard, tooltip của sidebar collapsed có thể hiển thị trễ 50ms do hiệu ứng transition. | Đã chuẩn hóa throttle animation và đảm bảo tooltip biến mất ngay khi mouseleave. | **OPTIMIZED** |

---

## 4. Khuyến nghị giám sát và vận hành sản xuất

1. **Giám sát APM (Application Performance Monitoring):** Thiết lập Sentry hoặc Datadog theo dõi unhandled errors trên môi trường Client-side.
2. **CDN Caching Strategy:** Cấu hình Cache-Control Header trên Cloudflare / Vercel Edge đối với static assets (`/assets/*.js`, `/assets/*.css`, `*.webp`) với thời hạn `max-age=31536000, immutable`.
3. **Database Indexing:** Duy trì các composite index `(category, price, rating)` và `(user_id, created_at)` trên MongoDB để đảm bảo thời gian phản hồi API luôn dưới 50ms khi lượng SKU vượt mốc 100,000.
