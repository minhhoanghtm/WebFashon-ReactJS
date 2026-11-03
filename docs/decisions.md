# Nhật Ký Quyết Định Kỹ Thuật (Decisions Log)

## 8. AI action confirmation hardening (2026-11-03)
- Persist pending AI write actions in MongoDB with a five-minute TTL, normalized server-owned parameters and a SHA-256 digest. Confirmation is only accepted at `POST /chat/ai/actions/:id/confirm`; cancellation uses its own authenticated endpoint.
- The record is atomically claimed before calling the allowlisted tool. This makes confirmation idempotent under double-click/retry and rechecks price/stock via the existing cart service at execution time.
- Chose MongoDB rather than Redis-only storage so auditability and expiry-state diagnostics survive a Redis restart. Production vector reindex now refuses to run unless `AI_REINDEX_CONFIRM=true` is supplied deliberately.

## 9. Payment state safety (2026-11-03)
- Treat browser return URLs as navigation only. Payment state must be set by a verified gateway IPN or authorized back-office workflow, never query data from the browser.
- Added `bank_transfer` and richer payment status values compatibly at schema level. The new payment page is read-only and owner-gated; banking details remain empty unless configured by an administrator.

Tài liệu này ghi lại toàn bộ quyết định kỹ thuật tự chủ, lý do lựa chọn và giải pháp an toàn trong quá trình thực hiện nhiệm vụ rà soát toàn bộ API, loại bỏ hardcode/mock, kiểm thử và chuẩn hóa hệ thống.

---

## 2. Thiết Kế Hệ Thống Xác Thực SMS OTP & Nâng Cấp Auth (2026-11-01)
- **Quyết định nhánh:** Tạo nhánh `feat/sms-otp` từ `feat/api-coverage-20261031`.
- **Kiến trúc SMS Provider:**
  - Thiết kế interface chuẩn `sendSms(phone, text, meta)` với Provider Pattern (`sms.service.js`).
  - Hỗ trợ 2 provider: `esms` (eSMS REST API chính thức, hỗ trợ Sandbox) và `console` (in mã OTP ra console cho môi trường dev/test khi `NODE_ENV !== 'production'`).
  - Fallback an toàn: Khi SMS provider gặp sự cố mạng hoặc hết số dư, hệ thống tự động fallback gửi OTP qua email của người dùng (Nodemailer / BullMQ) nếu người dùng đã có email.
  - Bảo mật ghi log: Tuyệt đối không log khóa API, mã OTP thực tế hoặc số điện thoại đầy đủ ở môi trường production. Số điện thoại được che một phần (vd: `+8490***5678`).
- **Chuẩn hóa số điện thoại:**
  - Định dạng chuẩn lưu trữ: E.164 cho Việt Nam (`+84xxxxxxxxx`).
  - Chấp nhận đầu vào: `0xxxxxxxxx`, `84xxxxxxxxx`, `+84xxxxxxxxx`.
  - Validate theo quy chuẩn đầu số di động Việt Nam (03x, 05x, 07x, 08x, 09x).
- **Quản lý OTP bảo mật:**
  - Sinh OTP: 6 chữ số ngẫu nhiên an toàn bằng `crypto.randomInt(100000, 1000000)`, không dùng `Math.random`.
  - Lưu trữ: Băm HMAC-SHA256 kết hợp OTP secret, lưu trên Redis (hỗ trợ fallback Mongo/Memory) với TTL 5 phút.
  - Mỗi số điện thoại/email + purpose (`register`, `login`, `reset_password`, `verify_phone`) chỉ tồn tại tối đa 1 OTP hiệu lực.
  - Giới hạn: Tối đa 5 lần nhập sai/OTP (sau đó hủy OTP), cooldown gửi lại 60 giây, tối đa 5 OTP/giờ/số điện thoại, tối đa 20 OTP/giờ/IP.
  - So sánh mã bằng `crypto.timingSafeEqual` chống tấn công timing attack.
  - Chống liệt kê tài khoản (Anti-account enumeration): API quên mật khẩu trả cùng thông điệp chung thành công dù số điện thoại/email có tồn tại hay không.
- **Tương thích ngược (Backwards Compatibility):**
  - Giữ nguyên các API cũ (`/auth/signUp`, `/auth/signIn`, `/auth/sendOTP`, `/auth/verify-otp`, `/auth/resetPassword`).
  - Mở rộng `/auth/signIn` chấp nhận cả email hoặc số điện thoại.
  - Bổ sung các endpoint mới chuẩn REST: `/auth/register/send-otp`, `/auth/register/verify`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/login/otp/send`, `/auth/login/otp/verify`, `/auth/otp/resend`.
  - Cập nhật User Model: thêm trường `phone` với `default: null, sparse: true, unique: true, index: true`. Trường `email` trở thành optional sparse khi đăng ký bằng số điện thoại.

## 1. Khởi tạo & An toàn (2026-10-31)
- **Quyết định:** Tạo nhánh mới `feat/api-coverage-20261031` từ nhánh `feature/vector-ai-shopping-intelligence`.
- **Lý do:** Tuân thủ quy định nhánh mới `feat/api-coverage-YYYYMMDD`, không tác động lên `main`/`master` hay nhánh gốc.
- **Bảo toàn file có sẵn:**
  - `back-end/src/configs/redis.js`: Giữ nguyên tuyệt đối, không sửa, không add.
  - Các script benchmark/test có sẵn trong `back-end/src/scripts/`: Giữ nguyên.
  - Các file sửa đổi dở dang trước khi chạy lệnh: rà soát tích hợp đúng chức năng, không stash làm mất code của người dùng.
- **Quy tắc Git:** Chỉ dùng `git add <path-to-file>`, tuyệt đối không dùng `git add .` hoặc `git add -A`.

---

## 2. Thiết Kế Hệ Thống Xác Thực SMS OTP & Nâng Cấp Auth (2026-11-01)
- **Quyết định nhánh:** Tạo nhánh `feat/sms-otp` từ `feat/api-coverage-20261031`.
- **Kiến trúc SMS Provider:**
  - Thiết kế interface chuẩn `sendSms(phone, text, meta)` với Provider Pattern (`sms.service.js`).
  - Hỗ trợ 2 provider: `esms` (eSMS REST API chính thức, hỗ trợ Sandbox) và `console` (in mã OTP ra console cho môi trường dev/test khi `NODE_ENV !== 'production'`).
  - Fallback an toàn: Khi SMS provider gặp sự cố mạng hoặc hết số dư, hệ thống tự động fallback gửi OTP qua email của người dùng (Nodemailer / BullMQ) nếu người dùng đã có email.
  - Bảo mật ghi log: Tuyệt đối không log khóa API, mã OTP thực tế hoặc số điện thoại đầy đủ ở môi trường production. Số điện thoại được che một phần (vd: `+8490***5678`).
- **Chuẩn hóa số điện thoại:**
  - Định dạng chuẩn lưu trữ: E.164 cho Việt Nam (`+84xxxxxxxxx`).
  - Chấp nhận đầu vào: `0xxxxxxxxx`, `84xxxxxxxxx`, `+84xxxxxxxxx`.
  - Validate theo quy chuẩn đầu số di động Việt Nam (03x, 05x, 07x, 08x, 09x).
- **Quản lý OTP bảo mật:**
  - Sinh OTP: 6 chữ số ngẫu nhiên an toàn bằng `crypto.randomInt(100000, 1000000)`, không dùng `Math.random`.
  - Lưu trữ: Băm HMAC-SHA256 kết hợp OTP secret, lưu trên Redis (hỗ trợ fallback Mongo/Memory) với TTL 5 phút.
  - Mỗi số điện thoại/email + purpose (`register`, `login`, `reset_password`, `verify_phone`) chỉ tồn tại tối đa 1 OTP hiệu lực.
  - Giới hạn: Tối đa 5 lần nhập sai/OTP (sau đó hủy OTP), cooldown gửi lại 60 giây, tối đa 5 OTP/giờ/số điện thoại, tối đa 20 OTP/giờ/IP.
  - So sánh mã bằng `crypto.timingSafeEqual` chống tấn công timing attack.
  - Chống liệt kê tài khoản (Anti-account enumeration): API quên mật khẩu trả cùng thông điệp chung thành công dù số điện thoại/email có tồn tại hay không.
- **Tương thích ngược (Backwards Compatibility):**
  - Giữ nguyên các API cũ (`/auth/signUp`, `/auth/signIn`, `/auth/sendOTP`, `/auth/verify-otp`, `/auth/resetPassword`).
  - Mở rộng `/auth/signIn` chấp nhận cả email hoặc số điện thoại.
  - Bổ sung các endpoint mới chuẩn REST: `/auth/register/send-otp`, `/auth/register/verify`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/login/otp/send`, `/auth/login/otp/verify`, `/auth/otp/resend`.
  - Cập nhật User Model: thêm trường `phone` với `default: null, sparse: true, unique: true, index: true`. Trường `email` trở thành optional sparse khi đăng ký bằng số điện thoại.



---

## 3. Tái Cấu Trúc Bố Cục Trang Chủ & Chuẩn Hóa Footer (2026-11-01)
- **Thứ tự Section Mới Trên Trang Chủ:**
  1. `CinematicHero`: Điều chỉnh chiều cao còn `h-[90svh] min-h-[88svh] max-h-[92svh]` để mép trên của phần "Tất cả thiết kế" lấp ló ở đáy màn hình đầu tiên (tọa độ top < 1.1 * chiều cao màn hình) trên cả Desktop (1920x1080), Laptop (1366x768) và Mobile (390x844), kích thích hành vi cuộn tự nhiên.
  2. `TẤT CẢ THIẾT KẾ` (`#home-collection-heading`): Di chuyển lên đầu tiên ngay sau Hero trong `#home-content`. Giảm padding trên xuống `pt-8 sm:pt-10 lg:pt-12 pb-14 sm:pb-20` để loại bỏ khoảng cách quá rộng (> 160px). Giữ nguyên lọc danh mục cha-con (hỗ trợ cuộn ngang trên mobile), hiển thị 12 sản phẩm đầu tiên, và bổ sung nút CTA "Xem toàn bộ thiết kế" dẫn tới `/products`.
  3. `BrandChapterSection` (Chương thương hiệu): Điều chỉnh padding dọc `py-16 sm:py-20 lg:py-24`, hiệu ứng clip-path reveal và parallax cột 2 tốc độ được tính toán lại mượt mà.
  4. `ManifestoVideoSection` (Tuyên ngôn): Khi không có video/ảnh thật từ API (`videoUrl` rỗng), ẩn hoàn toàn khung rỗng "ATELIER ARCHIVE", chỉ hiển thị khối chữ tuyên ngôn phát sáng theo cuộn và mô tả thương hiệu, triệt tiêu khoảng trống thừa.
  5. `CollageLookbookSection` (Collage Lookbook): Tinh chỉnh chiều cao tối thiểu và khoảng cách dọc để đảm bảo không có khoảng cách nào giữa các section > 160px.
  - **Rà soát các section khác (Boutique, Timeline...):** Đã kiểm tra toàn bộ codebase không có component section Boutique/Timeline độc lập nào bị render trùng lặp; nội dung sản phẩm tập trung duy nhất ở lưới "Tất cả thiết kế" để trang chủ không bị phân tán.
- **Tích Hợp & Chuẩn Hóa Footer:**
  - `MainLayout.jsx` đã bao bọc `<Footer />` toàn cục, trên trang chủ hiển thị DUY NHẤT 1 footer ở cuối trang (không trùng lặp).
  - Tích hợp dữ liệu từ `useWebsiteSettings` (tên thương hiệu, địa chỉ, hotline, email, mạng xã hội, bản quyền). Các mục không có dữ liệu thật sẽ tự động ẩn, không bịa đặt thông tin.
  - Form newsletter nhận tin giữ đầy đủ logic kiểm tra định dạng email và thông báo toast.
  - Đăng ký các route còn thiếu trong `AppRouter.jsx` (`/lookbooks` -> `LookbookList`, `/policy` -> `Policy`, `/faq` -> `FAQ`, `/guide` -> `Guide`, `/about` -> `Policy`, `/blog` -> `LookbookList`) để đảm bảo 100% liên kết trong footer hoạt động bình thường, không bị 404.
  - Chữ "404STUDIO" khổng lồ dạng watermark được đặt `leading-[1.2]` và `py-10` đảm bảo không bao giờ bị cắt đỉnh đối với ký tự có dấu hoặc viết hoa.
  - Toàn bộ vùng chạm (links/buttons) đạt chuẩn tiếp cận >= 44px (`min-h-[44px] touch-target`).
  - Thêm padding an toàn đáy ở mobile `pb-[calc(6rem+env(safe-area-inset-bottom,0px))]` để nút chat nổi `CustomerChatWidget` không che khuất liên kết hay thông tin colophon.
- **ScrollTrigger & Hiệu Năng:**
  - Bổ sung `ScrollTrigger.refresh()` khi thay đổi kích thước cửa sổ (`resize`) và sau khi dữ liệu sản phẩm tải xong.
  - Kiểm thử tự động bằng Playwright trên 3 độ phân giải (1920x1080, 1366x768, 390x844) ở cả chế độ Sáng và Tối:
    + 6/6 test cases đạt 100% (tọa độ top < 1.1 * viewport, khoảng cách < 160px, đúng 1 footer, tương tác lọc danh mục và nút xem tất cả chuẩn xác, 0 lỗi console khi cuộn hết trang, không tràn ngang).
    + Chụp ảnh màn hình toàn trang (full-page screenshot) lưu tại `docs/screenshots/`.


---

## 4. Tách Biệt & Chuẩn Hóa Tương Phản CinematicHeader (2026-11-01)
- **Vấn đề giải quyết:** Header ở trạng thái cuộn qua hero hoặc ở các trang trong có nền trắng/nhạt hòa lẫn vào các section trắng bên dưới ("Tất cả thiết kế", "Chương thương hiệu", trang `/products`), khiến thanh header bị mất ranh giới và chữ lơ lửng.
- **Phương án màu Header đã chọn:**
  - **Trạng thái nền đặc (Solid state):** Áp dụng nền ĐEN ĐẬM NOIR `#0C0C0E` (100% solid, loại bỏ `backdrop-blur` gây trong suốt) kết hợp chữ và icon màu BONE `#F5F4F0` ở cả Light và Dark Mode.
  - **Lý do lựa chọn:**
    + Nhất quán tuyệt đối với DNA thiết kế thương hiệu thời trang tối giản đơn sắc ("Noir / Bone / Slate") của 404 STUDIO.
    + Khi cuộn qua các section nền trắng/kem (`#FBF9F5` hay `#FFFFFF`), nền đen `#0C0C0E` tạo ra độ tương phản vượt trội: **18.58:1** (vượt xa yêu cầu >= 1.5).
    + Chữ và biểu tượng màu `#F5F4F0` trên nền `#0C0C0E` đạt độ tương phản: **17.76:1** (gấp 4 lần chuẩn WCAG AAA >= 4.5:1).
    + Có viền dưới sắc nét `border-b border-white/15` và bóng đổ đa tầng `shadow-[0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.22)]` tạo chiều sâu kiến trúc rõ ràng.
  - **Trạng thái trên Hero (Transparent state):** Giữ nền trong suốt kèm gradient tối nhẹ từ đỉnh xuống (`bg-gradient-to-b from-black/85 via-black/40 to-transparent text-white`) đảm bảo chữ/icon luôn đọc rõ ràng trên mọi hình ảnh banner.
- **Ngưỡng chuyển trạng thái & Hiệu ứng chuyển động:**
  - Thời gian chuyển trạng thái: 200ms (`duration-200 ease-out`), chỉ áp dụng transition trên `[background-color,color,box-shadow,border-color,transform]`.
  - Hỗ trợ `motion-reduce:transition-none` khi người dùng bật `prefers-reduced-motion`.
  - Ngưỡng chuyển trên trang chủ: Khi cuộn qua ~80% chiều cao Hero (`window.scrollY > window.innerHeight * 0.72`).
  - Trên các trang trong (`/products`, `/cart`, `/checkout`...): Header luôn ở trạng thái solid `#0C0C0E` tách biệt với nội dung có `pt-20` bên dưới.
  - Khi mở Menu Overlay toàn màn hình (`isMenuOpen`) hoặc Cart Drawer (`isCartOpen`), header giữ nguyên trạng thái đóng băng, không chớp tắt hoặc nhảy giật.
- **Đồng bộ toàn bộ thành phần con:**
  - Nút Menu: 3 vạch hamburger và chữ MENU chuyển `#F5F4F0`.
  - Logo & Atelier watermark: Chuyển `#F5F4F0` và subtext `#9E9EA8`.
  - Icon Search, Heart, Theme Toggle: Chuyển `#F5F4F0`, outline bàn phím `focus-visible:outline-white`.
  - Badge yêu thích & Badge giỏ hàng: Nền BONE `#F5F4F0` chữ đen `#0C0C0E` với viền rõ ràng, nổi bật tuyệt đối trên nền header đen, không bao giờ bị chìm.
  - Dropdown tìm kiếm trực tiếp: Khung nền `#0C0C0E` với viền `border-white/20`, ô input nền `bg-white/[0.06]` viền `border-white/15` và danh sách gợi ý phân tách bằng `divide-white/10`.
- **Kiểm thử Playwright tự động:**
  - Kiểm tra trên 3 kích thước: 1920x1080 (Desktop), 1366x768 (Laptop), 390x844 (Mobile) ở cả 2 chế độ Sáng và Tối (6/6 suites PASS).
  - Kết quả đo đạc:
    + Tương phản nền Header vs "Tất cả thiết kế" (`#FBF9F5`): **18.58:1** (chuẩn >= 1.5).
    + Tương phản nền Header vs "Chương thương hiệu" (`#FFFFFF`): **19.54:1** (chuẩn >= 1.5).
    + Tương phản nền Header vs Main trang `/products` (`#F7F6F2`): **18.07:1** (chuẩn >= 1.5).
    + Tương phản chữ Header vs nền Header: **17.76:1** (chuẩn >= 4.5).
    + 0 lỗi console, 0 lỗi tràn ngang màn hình.
  - Ảnh chụp màn hình kiểm chứng đã được lưu trong `docs/screenshots/`:
    + Header trên Hero: `header_hero_*.png`
    + Header sau Hero: `header_after_hero_*.png`
    + Header tại section trắng: `header_white_section_*.png`
    + Header tại trang `/products`: `header_products_*.png`
    + Dropdown tìm kiếm mở: `header_search_open_*.png`
    + Menu overlay mở: `header_menu_overlay_*.png`

---

## 5. Chuẩn Hóa & Đồng Bộ Hạ Tầng DevOps, Docker & CI/CD (2026-11-01)
- **Mục tiêu:** Rà soát toàn bộ cấu hình container, docker compose (dev/staging/production), reverse proxy Nginx, bảo mật images, và GitHub Actions workflows để đạt chuẩn production thống nhất.
- **Back-end Dockerfile & Security:**
  - Nâng cấp runtime lên `node:22-alpine` đồng bộ toàn dự án.
  - Áp dụng nguyên tắc Least Privilege: thực thi bằng non-root user `USER node` (uid: 1000). Thư mục `/app/uploads` và toàn bộ mã nguồn được thiết lập quyền sở hữu `node:node` khi build (`COPY --chown=node:node`).
  - Signal Handling: Thay thế `npm start` (PID 1 không chuyển tín hiệu POSIX) bằng `CMD ["node", "src/server.js"]` để container phản hồi tức thì với `SIGTERM`/`SIGINT` khi scale/restart, chấm dứt tình trạng treo 10 giây chờ timeout.
  - Tích hợp sẵn `HEALTHCHECK` trong Dockerfile sử dụng native fetch của Node 22 (`fetch('http://localhost:5000/api/health')`).
- **Front-end Dockerfile & High-Performance Nginx:**
  - Multi-stage build: Giai đoạn 1 biên dịch bằng `node:22-alpine` với Vite; Giai đoạn 2 phục vụ tĩnh bằng `nginx:stable-alpine`.
  - Hỗ trợ truyền biến môi trường build-time `ARG VITE_API_URL` và `ARG VITE_GOOGLE_CLIENT_ID`.
  - Cấu hình Nginx runtime (`front-end/nginx.conf`):
    + Kích hoạt nén Gzip level 6 cho mọi định dạng (text, css, js, json, svg, xml).
    + Header bảo mật: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
    + Cache vĩnh viễn (`Cache-Control: public, immutable, max-age=1y`) cho tài nguyên tĩnh được băm hash trong `/assets/`.
    + Định tuyến SPA: `try_files $uri $uri/ /index.html;`.
    + Bổ sung endpoint `/healthz` trả về HTTP 200 "healthy".
- **Đồng bộ Docker Compose (Dev, Staging, Production):**
  - **Docker Compose Dev (`docker-compose.yml`):**
    + Định nghĩa bridge network rõ ràng `webfashion-network`.
    + Bổ sung healthcheck cho MongoDB 7.0 (`mongosh --eval 'db.adminCommand("ping")'`) và Redis 7 Alpine (`redis-cli ping`).
    + Ràng buộc `depends_on` với `condition: service_healthy` đảm bảo backend chỉ khởi động khi cơ sở dữ liệu đã sẵn sàng tiếp nhận kết nối.
    + Bổ sung persistent volume `uploads-data:/app/uploads` và `redis-data:/data` tránh mất dữ liệu ảnh tải lên và cache khi container restart.
  - **Docker Compose Staging (`docker-compose.staging.yml`):**
    + Thêm persistent volume cho uploads (`uploads-staging-data:/app/uploads`) và Redis (`redis-staging-data:/data`).
    + Tinh chỉnh cổng cô lập (API: 5050, Nginx: 8081, Mongo: 27018, Redis: 6381).
  - **Docker Compose Production (`docker-compose.prod.yml`):**
    + Đồng bộ toàn bộ healthchecks (`nginx`, `api`, `front`, `mongo`, `redis`) và `condition: service_healthy`.
    + Bổ sung persistent volume `uploads-data` và `redis-data`.
    + Sử dụng cú pháp `env_file: [{ path: ..., required: false }]` giúp validation cú pháp hoạt động an toàn kể cả khi chưa có file secret trên máy dev.
- **Nginx Reverse Proxy Gateway (`nginx/nginx.conf` & `nginx/nginx.staging.conf`):**
  - Cấu hình Upstream blocks với `keepalive 32` kết nối thường trực đến backend và frontend, giảm độ trễ TCP handshake.
  - Tích hợp đầy đủ reverse proxy cho REST API (`/api/`), WebSocket chat trực tiếp (`/socket.io/`), uploads tĩnh (`/uploads/`), và frontend SPA (`/`).
  - Hỗ trợ SSL/TLS hiện đại (TLSv1.2, TLSv1.3), Gzip compression, và client_max_body_size 25M phục vụ tải ảnh sản phẩm chất lượng cao.
- **Chuẩn Hóa CI/CD GitHub Actions (`ci-develop.yml` & `ci-main.yml`):**
  - Đồng bộ Node.js 22 LTS và MongoDB 7.0 trên tất cả các workflow.
  - Tách bạch rõ ràng 3 giai đoạn: `test-backend`, `test-frontend` (lint, test, build Vite), `validate-docker` (kiểm tra cú pháp cấu hình compose của dev/staging/prod).
  - Sửa lỗi bảo mật deploy: Chỉ kích hoạt job `deploy-staging` khi có sự kiện `push` vào nhánh `develop`, ngăn chặn kích hoạt deploy nhầm trên các pull request chưa được duyệt.
  - Sửa lỗi đường dẫn SSH deploy trên VPS (`/root/WebFashion` / `/opt/webfashion`).
- **Mẫu Biến Môi Trường (`.env.example` & `front-end/.env.example`):**
  - Cập nhật đầy đủ các biến môi trường mới nhất bao gồm SMS Provider (`SMS_PROVIDER`, `ESMS_API_KEY`, `ESMS_SECRET_KEY`, `ESMS_SANDBOX`), Vector AI, JWT, thanh toán MoMo/VNPay, vận chuyển GHN.
  - Tạo mới file mẫu `front-end/.env.example` hướng dẫn cấu hình chuẩn client.

---

## 6. Ghi Nhận Console Log Khi Gửi OTP Thành Công (2026-11-01)
- **Mục tiêu:** Bổ sung `console.log` chi tiết cả ở phía Back-end (Server) và Front-end (Client/Browser) mỗi khi gửi mã OTP thành công.
- **Back-end:**
  - `sms.service.js`: Ghi log `[SMS Service] Gửi OTP thành công qua SMS` và `[SMS Fallback] Gửi OTP thành công qua Email` kèm thông tin số điện thoại đã mask (`+84 98*** ***21`), mục đích gửi, channel và messageId.
  - `auth.service.js`: Ghi log chi tiết cho từng luồng:
    + Đăng ký tài khoản (`sendRegisterOtp`)
    + Đăng nhập OTP (`sendLoginOtp`)
    + Quên mật khẩu (`forgotPassword`)
    + Gửi lại OTP (`resendOtp`)
    + Cập nhật số điện thoại (`sendUpdatePhoneOtp`)
    + Xác thực email cũ (`sendOTP`)
- **Front-end:**
  - `services/auth.service.js`: Tự động log `✅ Gửi OTP thành công` ở tất cả các hàm service (`sendRegisterOtpService`, `sendLoginOtpService`, `forgotPasswordOtpService`, `resendOtpService`, `sendUpdatePhoneOtpService`, `sendOTPService`).
  - Giao diện người dùng (`LoginForm.jsx`, `RegisterForm.jsx`, `ResetPasswordForm.jsx`, `UpdatePhoneModal.jsx`): Log trực tiếp kết quả trả về từ API ngay khi hoàn thành gửi mã OTP và gửi lại mã.

---

## 7. Khắc Phục Lỗi ReferenceError filteredMenuItems ở CinematicHeader (2026-11-03)
- **Nguyên nhân:** Trong component `CinematicHeader.jsx`, JSX điều hướng toàn màn hình (`isMenuOpen`) đã được cập nhật gọi `filteredMenuItems.map` thay vì `MENU_ITEMS.map`, nhưng biến `filteredMenuItems` chưa được khai báo và khởi tạo trong thân component, dẫn đến runtime error `ReferenceError: filteredMenuItems is not defined`.
- **Giải pháp:**
  - Tích hợp `useFeatureFlags()` và `useMemo` để tính toán `filteredMenuItems` từ danh sách `MENU_ITEMS`.
  - Hỗ trợ lọc động:
    + Ẩn các mục yêu cầu tài khoản (`requireAuth: true` như Ví voucher, Đơn hàng, Hồ sơ) khi khách chưa đăng nhập.
    + Ẩn các mục gắn với feature flag (như `enableVoucher`) khi tính năng bị vô hiệu hóa trong hệ thống CMS.
    + Đánh số thứ tự tự động chuẩn format `01`, `02`... sau khi lọc danh sách.
  - Bổ sung hiệu ứng bảo vệ chỉ số mảng: tự động reset `activeMenuIndex` về `0` khi số lượng mục trong menu thay đổi để tránh lỗi out-of-bounds preview.
  - Kiểm thử Playwright tự động: 6/6 test suites (Desktop, Laptop, Mobile ở cả 2 chế độ Light/Dark) đều PASS và ghi nhận 0 console error.

---

## 7. Khắc Phục Triệt Để Lỗi API Flash Sale & Chiến Dịch (2026-11-01)
- **Nguyên nhân cốt lõi sự cố 500 khi tạo / tải chiến dịch Flash Sale (`/api/admin/campaigns`):**
  1. `MissingSchemaError: Schema hasn't been registered for model "User"`: Khi Mongoose thực hiện query `.populate("createdBy", "fullName name email").populate("updatedBy", "fullName name email")`, model `User` chưa từng được import trong chu trình khởi động của module `campaigns`, dẫn đến ném ngoại lệ 500 làm đổ vỡ API lấy danh sách quản trị chiến dịch ngay sau khi người dùng tạo mới thành công.
  2. Model `Page` bị lỗi `OverwriteModelError: Cannot overwrite Page model once compiled`: Được khởi tạo ở cả `modules/pages/page.model.js` và `modules/websiteSettings/page.model.js`.
  3. Thiếu trường `bannerId`, `pageId` và `discountRule.categoryIds` trong Mongoose schema `campaign.model.js` so với Zod validator và controller populate logic.
  4. Lỗi `TypeError: Cannot read properties of null (reading 'userId')` trong `order.controller.js` khi khách vãng lai đặt hàng không qua đăng nhập (`req.user` là null).
- **Giải pháp xử lý:**
  - Import đầy đủ và đăng ký an toàn các model tham chiếu (`User`, `Category`, `Banner`, `Page`, `Product`, `product_variants`) trong `campaign.model.js` và `campaign.service.js`.
  - Áp dụng guard `mongoose.models.X || mongoose.model(...)` trên toàn bộ các model `User`, `Page` để chống xung đột `OverwriteModelError`.
  - Bổ sung `scope`, `categoryIds` vào `discountRuleSchema` và `bannerId`, `pageId` vào `campaignSchema`.
  - Bổ sung route `campaignRouter.get("/", getActiveCampaigns)` phục vụ fallback công khai cho client.
  - Sửa `const userId = req.user?.userId || null;` trong `order.controller.js`.
  - Tự động hóa kiểm thử hồi quy: Tạo test suite `back-end/src/scripts/test-campaign-apis.mjs` bao phủ 100% các endpoint Public & Admin của Campaign/Flash Sale và xác nhận `test-feature-switches.mjs` đạt 5/5 cases.

---

## 8. Sửa Lỗi Điều Phối Ý Định AI & Tích Hợp Giữ Hàng Tồn Kho Redis 5 Phút (2026-11-03)
- **Vấn đề:** Người dùng yêu cầu thanh toán trực tiếp qua AI Chat ("Thanh toán giúp tôi sản phẩm... size M màu..."), nhưng AI phân loại nhầm thành `ADD_TO_CART`, hỏi ngược "Bạn muốn thêm 1 sản phẩm vào giỏ hàng phải không?" và chỉ thực thi thêm giỏ hàng thay vì điều hướng thanh toán và giữ hàng.
- **Quyết định & Giải pháp kiến trúc:**
  1. **Tách biệt rõ rệt Intent:**
     - Tạo công cụ Gemini `start_checkout` (hoặc `buy_now`) và `cancel_checkout`.
     - Phân định rõ trong `systemPrompt.js` và hàm nhận diện intent `detectCheckoutIntent(content)`: Tuyệt đối không để câu lệnh checkout rơi vào luồng `add_to_cart`.
  2. **Kiến trúc Giữ hàng tồn kho Redis (Redis Inventory Reservation):**
     - Giữ hàng chính xác **300 giây (5 phút)**. Không tự động gia hạn khi reload trang.
     - Sử dụng **Redis Lua Scripts nguyên tử** (`LUA_RESERVE`, `LUA_RELEASE`, `LUA_COMMIT`) để kiểm tra toàn bộ danh mục sản phẩm (All-or-Nothing check) và tăng bộ đếm `stock:reserved:{sku}` cùng lúc, loại bỏ 100% nguy cơ bán vượt (Zero Overselling).
     - Thiết lập Sorted Set `stock:expirations` và Background Reconciler Worker (chạy mỗi 10 giây) kèm Lazy on-read check để tự động giải phóng hàng hết hạn.
     - Xây dựng sổ cái bền vững hai tầng bằng MongoDB Model `InventoryReservation` và cơ chế phục hồi `reconcileReservationsFromDB()` khi server hoặc Redis khởi động lại.
  3. **Trải nghiệm Frontend & Đồng hồ đếm ngược:**
     - Thiết kế card xác nhận hành động chuyên biệt trên `MessageBubble.jsx`: Thẻ "Xác nhận thanh toán (Giữ hàng 5 phút)", nút "Tiếp tục thanh toán" và "Hủy thanh toán".
     - Trang `/checkout?reservationId=...`: Tự động nạp thông tin từ phiên giữ hàng, hiển thị đồng hồ đếm ngược thời gian thực, đổi màu cảnh báo khi dưới 60 giây, khóa nút submit khi hết 300 giây và nút hủy giữ hàng chủ động.
  4. **Kiểm thử xác thực:**
     - Kiểm thử kịch bản tranh chấp 5 tồn kho: User A giữ 3, User B giữ 2, User C yêu cầu 1 bị từ chối do còn 0, User A hủy giải phóng 3, User C yêu cầu lại thành công ngay lập tức.
     - Jest Test Suites Backend: 15/15 passed (167/167 tests).
     - Frontend Build: Passed 100% trong 2.35s với 0 lỗi.
     - Báo cáo hoàn thiện:
       + `docs/ai/AI_CHECKOUT_INTENT_FIX_REPORT.md`
       + `docs/inventory/REDIS_INVENTORY_RESERVATION_ARCHITECTURE.md`
       + `docs/inventory/REDIS_CHECKOUT_RESERVATION_TEST_REPORT.md`
