# Ma Trận Phủ API & Kiểm Kê Hợp Đồng Dữ Liệu (API Coverage Matrix)

> **Dự án:** WebFashion / 404 STUDIO — Atelier Edition  
> **Thời điểm kiểm kê:** 2026-10-31  
> **Nhánh thực hiện:** `feat/api-coverage-20261031`  

---

## 1. Tổng Quan Kiến Trúc & Kiểm Kê

### 1.1. Back-end Endpoints & Sockets
- **Tổng số endpoint đã đăng ký:** 266 endpoints (bao gồm các alias tương thích ngược như `/events` & `/tracking`, `/order` & `/order_items`).
- **Phân loại Router chính (32 mounts):**
  - `/api/auth`: 10 endpoints (đăng nhập, đăng ký, OTP, refresh token, đổi/quên mật khẩu, Google auth, đăng xuất).
  - `/api/categories`: 5 endpoints (CRUD danh mục cha-con).
  - `/api/products` & `/api/product_variants`: 30 endpoints (danh sách, chi tiết, tìm kiếm từ khóa, tìm kiếm ngữ nghĩa Vector AI, gợi ý, biến thể, tồn kho).
  - `/api/reviews`: 4 endpoints (đánh giá sản phẩm, điểm trung bình, danh sách review theo sản phẩm).
  - `/api/upload`: 1 endpoint (upload ảnh multer phục vụ tĩnh qua `/uploads`).
  - `/api/settings`: 2 endpoints (`GET /api/settings` công khai, `PUT /api/settings` quản trị).
  - `/api/banners`: 8 endpoints (CRUD banner, banner theo vị trí, tăng lượt click).
  - `/api/campaigns` & `/api/admin/campaigns`: 20 endpoints (Flash sale, chiến dịch khuyến mãi theo khung giờ, áp dụng sản phẩm).
  - `/api/pages`, `/api/admin/pages`, `/api/lookbooks`: 39 endpoints (CMS pages, lookbook nghệ thuật, lượt xem, ghim nổi bật).
  - `/api/page-sections` & `/api/admin/page-sections`: 10 endpoints (khối section động cho từng page).
  - `/api/events` & `/api/tracking`: 14 endpoints (tracking hành vi người dùng, pageview, click, funnel, báo cáo phân tích, consent quản lý cookie).
  - `/api/search`: 2 endpoints (lịch sử tìm kiếm người dùng, gợi ý tìm kiếm gần đây).
  - `/api/recommendations` & `/api/experiments`: 8 endpoints (gợi ý sản phẩm cá nhân hóa, A/B & A/A testing phân bổ lưu lượng).
  - `/api/ai`: 5 endpoints (trợ lý mua sắm AI thông minh, semantic search embedding, đồng bộ vector index).
  - `/api/user`: 7 endpoints (profile, đổi mật khẩu cá nhân, admin quản lý người dùng).
  - `/api/cart` & `/api/cart_items`: 16 endpoints (giỏ hàng, thêm/sửa/xóa biến thể, kiểm tra tồn kho).
  - `/api/favorites`: 5 endpoints (danh sách yêu thích, toggle, xóa sản phẩm yêu thích).
  - `/api/order` & `/api/order_items`: 34 endpoints (tạo đơn, cập nhật trạng thái, hủy đơn, thống kê doanh thu KPI admin).
  - `/api/payments`: 6 endpoints (thanh toán VNPay, MoMo, kiểm tra trạng thái giao dịch, Webhook IPN, Return callback).
  - `/api/vouchers`: 10 endpoints (ví voucher cá nhân, săn voucher, áp dụng mã giảm giá, kiểm tra điều kiện).
  - `/api/admin` & `/api/chat`: 26 endpoints (hội thoại khách hàng, gán nhân viên, chuyển line, đóng/mở lại phiên chat, AI chatbot khách vãng lai).
  - `/api/shipping`: 4 endpoints (tính phí giao hàng GHN, danh mục tỉnh/thành, quận/huyện, phường/xã).
- **Socket.io Events:**
  - Client -> Server: `join` (user room), `joinAdmin` (admin room), `conversation:join`, `conversation:leave`, `message:send`.
  - Server -> Client: `newOrder` (tới admin), `orderUpdated` (tới khách đặt đơn), `message:new` (tới phòng chat và admin realtime).

### 1.2. Front-end API & Services
- **Số tệp dịch vụ/API:** 58 tệp (`front-end/src/api/` và `front-end/src/services/`).
- **Tổng số lệnh gọi API qua axios:** 197 cuộc gọi.
- **Tầng quản lý trạng thái:** React Query (@tanstack/react-query) kết hợp Zustand (`auth.store`, `cartContext.store`, `favorite.store`, `chatContext.store`).

### 1.3. Danh Sách Màn Hình (AppRouter.jsx)
1. **Storefront (Khách hàng công khai):**
   - `/` (Home): Cinematic Hero, Brand Chapter, Manifesto Video, Collage Lookbook, Curated Atelier Edit, Footer.
   - `/products` (ProductSearch): Bộ lọc danh mục, giá, sắp xếp, tìm kiếm từ khóa + Vector AI semantic search, gợi ý autocomplete.
   - `/product/:slug` (ProductDetail): Thư viện ảnh, chọn màu/size, kiểm tra tồn kho realtime, thêm giỏ, mua ngay, yêu thích, đánh giá sao, sản phẩm liên quan.
   - `/cart` (Cart): Xem danh sách món, chỉnh số lượng, xóa, nhập mã voucher, tính tổng tiền tạm tính.
   - `/checkout` (Checkout): Chọn địa chỉ nhận hàng (tỉnh/huyện/xã), chọn voucher đơn hàng, chọn hình thức thanh toán (COD, VNPay, MoMo), hiển thị phí vận chuyển.
   - `/payment-result` (PaymentResult): Hiển thị kết quả thanh toán từ VNPay/MoMo/COD, link tra cứu đơn.
   - `/favorites` (Favorites): Danh sách thiết kế đã lưu, thêm nhanh vào giỏ, bỏ yêu thích.
   - `/vouchers` (VoucherHunting): Kho voucher hệ thống, lưu voucher vào ví cá nhân, xem điều kiện áp dụng.
2. **Xác thực (Auth Layout):**
   - `/login` (Login): Đăng nhập email/mật khẩu, đăng nhập Google OAuth.
   - `/register` (Register): Đăng ký tài khoản, gửi OTP xác thực.
   - `/verify-otp` (VerifyOTP): Nhập mã OTP 6 số, xác nhận tài khoản.
   - `/reset-password` (ResetPassword): Quên mật khẩu, nhận OTP qua email và tạo mật khẩu mới.
3. **Khu vực Thành Viên (User Protected):**
   - `/profile` & `/user/dashboard`: Quản lý thông tin cá nhân, cập nhật địa chỉ giao hàng mặc định, đổi mật khẩu, avatar.
   - `/orders`: Danh sách đơn hàng theo trạng thái (tất cả, chờ xác nhận, đang giao, đã giao, đã hủy), chi tiết đơn hàng, hủy đơn, đặt lại đơn.
   - `/my-coupons`: Ví voucher của tôi, phân loại khả dụng/đã dùng/hết hạn.
   - `/reviews/create`: Đánh giá sản phẩm đã mua, chấm điểm 1-5 sao, nhận xét.
4. **Hệ thống Hỗ Trợ Trực Tuyến:**
   - `CustomerChatWidget` (mọi trang): Tab 1: Trợ lý mua sắm AI (hỏi đáp sản phẩm, gợi ý phong cách, tìm hàng), Tab 2: Hỗ trợ nhân viên (CSKH trực tiếp qua websocket).
5. **Khu Quản Trị (Admin Protected - Role `admin`):**
   - `/admin` (Dashboard): 3 tab KPI số liệu doanh thu, đơn hàng, khách hàng, biểu đồ tăng trưởng ECharts.
   - `/admin/categories`: Quản lý danh mục sản phẩm đa cấp, tải ảnh danh mục.
   - `/admin/products`: Danh sách sản phẩm, thêm/sửa/xóa, quản lý biến thể (màu, size, giá, tồn kho), upload nhiều ảnh.
   - `/admin/orders`: Danh sách đơn hàng, tìm kiếm, lọc trạng thái, duyệt đơn, chuyển trạng thái đơn hàng.
   - `/admin/chats`: Quản trị hỗ trợ chat CSKH 2 cột, danh sách hội thoại khách hàng, nhận chat, phản hồi realtime qua websocket.
   - `/admin/customers`: Quản lý người dùng, khóa/mở tài khoản, phân quyền, thêm mới nhân viên.
   - `/admin/coupons`: Tạo và cấu hình mã giảm giá (giá trị, %, tối thiểu, ngày hết hạn, giới hạn số lượt).
   - `/admin/campaigns`: Quản lý chương trình Flash Sale, chiến dịch khuyến mãi theo giờ, gán sản phẩm giảm giá.
   - `/admin/banners`: Quản lý banner quảng cáo, vị trí hiển thị, link chuyển tiếp, trạng thái.
   - `/admin/lookbooks`: Quản lý bộ sưu tập Lookbook thời trang, bìa, nội dung ảnh nghệ thuật.
   - `/admin/ab-testing`: Quản lý thí nghiệm A/B Testing & A/A Testing, phân bổ tỷ lệ người dùng, theo dõi chỉ số chuyển đổi.
   - `/admin/pages`: Quản lý trang nội dung CMS (`about`, `policy`, `faq`, `guide`, `blog`) với công cụ SectionBuilder.
   - `/admin/settings`: Cấu hình website toàn diện (thông tin chung, hotline, email, địa chỉ, SEO, tính năng hệ thống, mạng xã hội, chân trang).

---

## 2. Ma Trận Đối Chiếu

### Mục A: BE có API, FE gọi đúng (189 Endpoints)
Các API cốt lõi đã được kết nối chuẩn xác giữa BE và FE:
- Xác thực: Đăng nhập (`POST /api/auth/signIn`), Đăng ký (`POST /api/auth/signUp`), Gửi OTP (`POST /api/auth/sendOTP`), Xác thực OTP (`POST /api/auth/verify-otp`), Quên/Đặt lại mật khẩu (`POST /api/auth/resetPassword`, `POST /api/auth/sendResetOTP`), Google login (`POST /api/auth/google`).
- Sản phẩm & Danh mục: Toàn bộ CRUD danh mục (`/api/categories`), Lấy danh sách sản phẩm, Chi tiết sản phẩm theo slug/ID, Tìm kiếm sản phẩm nâng cao (`/api/products/search`), Gợi ý sản phẩm (`/api/products/suggestions`), Biến thể (`/api/product_variants`), CRUD sản phẩm Admin.
- Giỏ hàng & Yêu thích: Thêm, sửa, xóa giỏ hàng (`/api/cart`), Yêu thích toggle/list (`/api/favorites`).
- Đơn hàng & Thanh toán: Tạo đơn hàng, Hủy đơn, Lấy danh sách đơn cá nhân, Admin duyệt đơn (`/api/order`), Khởi tạo thanh toán VNPay/MoMo (`/api/payments/create_payment_url`, `/api/payments/momo/create`).
- Banners & Lookbooks: Lấy banner hoạt động, CRUD banner admin, Lấy danh sách lookbook, Chi tiết lookbook.
- Vouchers & Campaigns: Áp dụng voucher, Danh sách voucher, CRUD voucher admin, Lấy chiến dịch hoạt động, CRUD chiến dịch admin.
- Cài đặt & Trang CMS: Lấy cài đặt website (`GET /api/settings`), Cập nhật cài đặt (`PUT /api/settings`), CRUD trang CMS (`/api/pages`, `/api/admin/pages`), Quản lý section (`/api/admin/page-sections`).
- Chat & AI: Trợ lý AI chat (`POST /api/ai/chat`), Semantic search (`POST /api/ai/search`), Support chat websocket & REST API (`/api/chat`, `/api/admin`).

### Mục B: BE có API, FE chưa gọi hoặc gọi qua Alias (77 Endpoints)
Phân loại xử lý:
1. **Webhooks cổng thanh toán bên thứ ba (Bỏ qua - Webhook máy chủ):**
   - `GET /api/payments/vnpay/ipn` (VNPay server callback).
   - `POST /api/payments/momo/ipn` (MoMo server callback).
   - `GET /api/payments/vnpay/return`, `GET /api/payments/momo/return` (trình duyệt redirect từ cổng thanh toán về FE `/payment-result`).
2. **Mount kép / Đường dẫn trùng lặp ngược (Alias tương thích cũ):**
   - `/api/order_items/*` (Toàn bộ 17 endpoint này trỏ cùng controller với `/api/order/*`. FE đang dùng chuẩn `/api/order/*`).
   - `/api/tracking/*` (Alias tương thích ngược cho `/api/events/*`. FE đang dùng chuẩn `/api/events/*` và `/api/tracking/*`).
3. **API cần kết nối bổ sung vào Front-end (Ưu tiên P1):**
   - `POST /api/auth/signOut`: Cần gọi khi người dùng bấm Đăng xuất ở Front-end để xóa phiên server và cookie refresh token.
   - `POST /api/events/consent`: Kết nối lưu tùy chọn cookie/tracking của khách hàng.
   - `DELETE /api/tracking/me`: Quyền riêng tư của khách hàng xóa lịch sử theo dõi.

### Mục C: FE có chức năng/nội dung nhưng BE thiếu API hoặc thiếu Dữ Liệu (Ưu tiên P1)
1. **Nội dung tiếp thị trang chủ (Homepage Marketing Copy & Sections):**
   - *Hiện trạng:* `src/pages/Home/content.js` và các component trang chủ đang hard-code các tiêu đề chapter, câu khẩu hiệu manifesto, giới thiệu atelier, footer text.
   - *Giải pháp:* Bổ sung schema `homeContent` vào model `WebsiteSettings` trên BE, hỗ trợ lưu trữ toàn bộ các trường nội dung động (Hero title, Brand chapter, Manifesto copy, Lookbook collage copy, Boutique info, Newsletter copy). Đồng thời cung cấp tab biên tập nội dung trang chủ tại Admin (`/admin/settings`).
   - *Seed:* Thêm dữ liệu mặc định chuẩn thương hiệu thời trang đơn sắc vào script seed DB dev.
2. **Bộ dữ liệu mẫu đa dạng, toàn diện (Seed Dev Database):**
   - Tạo script seed idempotent `back-end/src/scripts/seed-complete-dev-data.js` chạy trên DB local docker (`webfashion_staging`).
   - Cung cấp đầy đủ:
     - 10+ sản phẩm thuộc nhiều danh mục cha-con, đủ biến thể màu (Đen, Trắng, Xám, Be, Xanh Navy), size (S, M, L, XL, 29-34), tồn kho, giá, ảnh WebP local từ `back-end/uploads/`.
     - 6+ danh mục đa cấp: Nam (Áo sơ mi, Áo thun, Quần tây, Áo khoác), Nữ (Váy may đo, Áo kiểu), Phụ kiện (Túi da, Thắt lưng).
     - 3+ Banners hoạt động với ảnh lưu tại backend.
     - Lookbooks xuất bản kèm ảnh và trích dẫn nghệ thuật.
     - 4+ Vouchers: mã còn hạn, mã giảm %, mã giảm tiền mặt, mã hết hạn, mã hết lượt dùng để test validation.
     - Chiến dịch Flash Sale đang diễn ra và sản phẩm giảm giá.
     - Cài đặt website chuẩn mực: tên thương hiệu, hotline, email, địa chỉ showroom, chính sách, nội dung trang chủ.
     - 3 tài khoản thử nghiệm: Admin (`admin@404studio.vn`), Nhân viên (`staff@404studio.vn`), Khách hàng (`customer@404studio.vn`).
     - Đơn hàng mẫu ở đủ 5 trạng thái: `pending`, `confirmed`, `shipping`, `delivered`, `cancelled`.
     - Đánh giá sản phẩm mẫu (5 sao, 4 sao kèm bình luận thực tế).
     - Đoạn hội thoại chat mẫu giữa khách hàng và bộ phận hỗ trợ.

### Mục D: Lệch hợp đồng, Hard-code & URL ảnh chết (Ưu tiên P0 / P1 / P2)
1. **P0 (Hỏng luồng / Bảo mật):**
   - Đăng xuất ở FE chưa gọi `POST /api/auth/signOut` để hủy refresh token và cookie phiên trên BE.
2. **P1 (Dữ liệu cứng & URL ảnh ngoài có thể chết):**
   - `front-end/src/pages/Home/content.js`: Hard-code toàn bộ văn bản marketing trang chủ -> Chuyển sang đọc động từ `settings.homeContent` được trả về từ `GET /api/settings`.
   - `front-end/src/pages/Home/components/BrandChapterSection.jsx`: Mảng fallback hard-code `chapter-item-1`, `chapter-item-2` -> Loại bỏ dữ liệu giả, hiển thị trạng thái rỗng hoặc loading khi chưa có dữ liệu từ BE.
   - `front-end/src/pages/Home/components/CinematicHero.jsx`: Mảng `DEFAULT_SLIDES` chứa 3 slide giả cứng -> Sử dụng trực tiếp danh sách banner từ `getActiveBannersService()`, hiển thị poster tĩnh từ settings khi trống.
   - `front-end/src/pages/Home/components/CollageLookbookSection.jsx`: Mảng fallback hard-code `collage-1` -> `collage-4` -> Hiển thị từ lookbooks thực tế từ BE API.
   - `front-end/src/pages/profile/index.jsx`: `DEFAULT_AVATAR` trỏ đến `https://cdn.sforum.vn/...` -> Thay bằng ảnh đại diện mặc định nội bộ (SVG/WebP local).
   - `front-end/src/pages/admin/CatalogManagement.jsx`: URL ảnh Unsplash cứng -> Thay bằng ảnh placeholder nội bộ hoặc rỗng.
   - `front-end/src/pages/admin/ProductManagement.jsx`: URL ảnh Unsplash cứng -> Thay bằng ảnh placeholder nội bộ hoặc rỗng.
   - `front-end/src/pages/admin/LookbookManagement.jsx`: URL ảnh Unsplash cứng -> Thay bằng ảnh placeholder nội bộ hoặc rỗng.
   - `front-end/src/pages/LookbookList/components/EditorialCard.jsx`: URL ảnh Unsplash cứng -> Sử dụng ảnh local hoặc thẻ rỗng.
   - Các file rác chứa dữ liệu mẫu không còn sử dụng: `front-end/src/pages/Home/Categories.jsx`, `front-end/src/pages/Home/CategoryShowcase.jsx`, `front-end/src/pages/Home/Promotion.jsx`, `front-end/src/pages/Home/PromotionBannerSection.jsx`, `front-end/src/pages/Home/components/EditorialSliderSection.jsx` -> Dọn dẹp an toàn.
   - `front-end/src/components/Footer.jsx`: Giá trị mặc định địa chỉ, số điện thoại cứng khi chưa tải settings -> Đồng bộ từ API `settings`.
3. **P2 (Tiện ích & Tối ưu giao diện):**
   - Đồng bộ hiển thị badge giỏ hàng và danh sách yêu thích realtime khi có thao tác.
   - Xử lý các mã lỗi HTTP đồng nhất trên axios interceptor (401 tự động refresh hoặc redirect, 403 thông báo quyền, 404 không tìm thấy, 409 xung đột tồn kho giỏ hàng).

---

## 3. Kế Hoạch Triển Khai Theo Lô (Batches)

- **Lô 1 (P0 & P1 - Back-end Model, Settings, API & Seed Data):**
  - Mở rộng model `WebsiteSettings` trên BE để chứa `homeContent`.
  - Cập nhật controller và validator cho `WebsiteSettings`.
  - Viết script seed toàn diện idempotent `seed-complete-dev-data.js` kết nối DB docker dev local.
  - Chạy seed dữ liệu hoàn chỉnh (sản phẩm, biến thể, ảnh local, danh mục, banner, lookbook, voucher, đơn hàng, chat, tài khoản dev).
  - Ghi nhận thông tin tài khoản dev vào `docs/dev-accounts.md`.
  - Kiểm thử endpoint BE qua Jest/Supertest.

- **Lô 2 (P0 & P1 - Front-end Auth, Settings, Home Content & Gỡ Bỏ Hard-code):**
  - Tích hợp `signOutApi` vào luồng đăng xuất của `auth.store.js`.
  - Cập nhật `useWebsiteSettings` và Admin `WebsiteSettingsManagement.jsx` để quản trị tab "Nội dung Trang Chủ".
  - Chuyển `CinematicHero.jsx`, `BrandChapterSection.jsx`, `CollageLookbookSection.jsx`, `ManifestoVideoSection.jsx` sang lấy nội dung từ `settings.homeContent` và API banners/lookbooks từ BE.
  - Xóa bỏ toàn bộ fallback mock data mảng, gỡ bỏ các file home legacy thừa.
  - Thay thế toàn bộ URL ảnh Unsplash/Sforum bằng asset nội bộ WebP/SVG.

- **Lô 3 (P1 - Gỡ bỏ hardcode trên toàn bộ các trang Storefront & Admin):**
  - Rà soát `ProductSearch`, `ProductDetail`, `Cart`, `Checkout`, `Orders`, `Profile`, `Vouchers`, `Footer`.
  - Đảm bảo các trạng thái Empty State rõ ràng khi không có dữ liệu thật.

- **Lô 4 (P0 & P1 - Kiểm Thử Toàn Diện & Tự Động):**
  - Chạy suite kiểm thử BE hiện tại + bổ sung test mới.
  - Viết và chạy suite E2E Playwright trên mọi màn hình (Desktop 1920x1080 và Mobile 390x844, Dark/Light).
  - Báo cáo kết quả kiểm thử vào `docs/test-report.md`.

- **Lô 5 - Kiểm tra cuối (Audit, Grep Data, Secret Scan) & Push:**
  - Chạy grep rà soát toàn bộ `front-end/src` đảm bảo không còn dữ liệu mock/hardcode.
  - Quét an toàn thông tin (không token, key, secret, chuỗi kết nối nhạy cảm).
  - Commit theo từng file cụ thể và push nhánh `feat/api-coverage-20261031`.
