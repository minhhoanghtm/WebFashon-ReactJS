# BÁO CÁO KIỂM TOÁN VÀ ĐÁNH GIÁ TOÀN BỘ ROUTE (ROUTE LAYOUT AUDIT)
## DỰ ÁN: REACT-WEBFASHION | PHASE 22 — HALLMARK REDESIGN

**Ngày kiểm toán:** 16/11/2026  
**Chuyên gia kiểm toán:** Principal UI/UX Designer & E-commerce Product Architect  
**Phạm vi:** 48/48 routes đã xác định trong `ROUTES.md`  
**Mục tiêu:** Nhận diện khuyết điểm của kiến trúc layout cũ (StoreLayout đơn điệu) và gán Template chuyên biệt chuẩn Hallmark cho từng tuyến đường.

---

## 1. TỔNG QUAN VẤN ĐỀ TRÊN BỐ CỤC CŨ (THE LEGACY UX PROBLEM)

Trước Phase 22, hệ thống frontend sử dụng một cấu trúc điều hướng gần như nguyên khối:
- Hơn **85% các màn hình** (từ Trang Chủ, Danh sách sản phẩm, Giỏ hàng, Thanh toán, Hồ sơ cá nhân, Yêu thích, Mã giảm giá, Lookbook đến 12 trang tĩnh) đều được bọc chung trong một component `<StoreLayout />`.
- **Hệ quả UX tiêu cực:**
  1. *Checkout & Cart bị xao nhãng:* Người dùng đang cần tập trung nhập thông tin thanh toán và đặt hàng lại phải nhìn thấy toàn bộ thanh Menu điều hướng đồ sộ và Footer khổng lồ với hàng chục liên kết.
  2. *Không gian tài khoản cá nhân nghèo nàn:* Khách hàng đăng nhập vào `/user/dashboard` hoặc `/orders` không có cảm giác đang ở trong một "Private Luxury Lounge" hay Workspace quản lý đơn hàng chuyên nghiệp.
  3. *Lookbook bị đóng khung:* Bộ ảnh thời trang nghệ thuật bị nhốt trong khung chứa có viền cứng của trang mua sắm thông thường thay vì bố cục tạp chí thời trang khổ lớn (Full-bleed Editorial).
  4. *Trang hỗ trợ và chính sách khó đọc:* Văn bản điều khoản pháp lý dài bị dàn trải thiếu cột mục lục điều hướng nhanh (Table of Contents).

---

## 2. BẢNG KIỂM TOÁN CHI TIẾT 48 ROUTES

| # | Route | Current Layout | UX Problem | New Hallmark Template | Priority |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `/` | StoreLayout | Layout chung chung chưa làm nổi bật tính chiến dịch Haute Couture | **Template A (Editorial Homepage)** | P0 |
| 2 | `/products` | StoreLayout | Bố cục thiếu thanh công cụ compact và chế độ hiển thị linh hoạt | **Template B (Product Discovery)** | P0 |
| 3 | `/product/:slug` | StoreLayout | Chưa có thanh thông tin mua hàng dính (sticky dock) khi cuộn sâu | **Template C (Product Detail Experience)** | P0 |
| 4 | `/cart` | StoreLayout | Bị phân tâm bởi mega footer và header đầy đủ khi kiểm tra giỏ | **Template D (Minimal Checkout Flow)** | P0 |
| 5 | `/checkout` | StoreLayout | Quá nhiều thành phần thừa, thiếu luồng tập trung hoàn tất đơn | **Template D (Minimal Checkout Flow)** | P0 |
| 6 | `/payment-result` | StoreLayout | Tóm tắt kết quả thiếu trạng thái cảm xúc thành công/thất bại rõ nét | **Template D (Minimal Checkout Flow)** | P1 |
| 7 | `/order-lookup` | StoreLayout | Khách vãng lai cần tra cứu nhanh bị bao quanh bởi các menu mua sắm | **Template K (System & Error)** | P1 |
| 8 | `/favorites` | StoreLayout | Danh sách yêu thích trình bày như catalog thông thường | **Template B (Product Discovery - Wishlist View)** | P1 |
| 9 | `/vouchers` | StoreLayout | Thiếu trải nghiệm săn voucher trực quan, vé may đo rời rạc | **Template B (Commerce Promo Hub)** | P1 |
| 10 | `/lookbooks` | StoreLayout | Bộ ảnh nghệ thuật bị bó hẹp trong container sản phẩm tiêu chuẩn | **Template G (Editorial Lookbook)** | P0 |
| 11 | `/policy` | StoreLayout | Bài viết dài thiếu thanh mục lục nhảy nhanh, phông chữ dàn trải | **Template J (Support & Content)** | P2 |
| 12 | `/privacy` | StoreLayout | Điều khoản bảo mật dài, thiếu phân mục và khả năng tìm kiếm | **Template J (Support & Content)** | P2 |
| 13 | `/terms` | StoreLayout | Văn bản pháp lý thiếu phân đoạn điều khoản đánh số rõ ràng | **Template J (Support & Content)** | P2 |
| 14 | `/shipping` | StoreLayout | Bảng cước phí GHN chưa được đóng gói thành bảng so sánh tối ưu | **Template J (Support & Content)** | P2 |
| 15 | `/returns-refunds` | StoreLayout | Quy trình đổi trả 7 ngày cần sơ đồ các bước trực quan | **Template J (Support & Content)** | P2 |
| 16 | `/payment-policy` | StoreLayout | Thiếu icon nhận diện cổng thanh toán chuẩn mực | **Template J (Support & Content)** | P2 |
| 17 | `/cookies` | StoreLayout | Văn bản cookie thiếu cơ chế chọn từ chối/đồng ý trực quan | **Template J (Support & Content)** | P2 |
| 18 | `/contact-legal` | StoreLayout | Thông tin pháp lý khô khan, thiếu form phản hồi nhanh | **Template J (Support & Content)** | P2 |
| 19 | `/faq` | StoreLayout | Câu hỏi thường gặp hiển thị phẳng, chưa có thanh tìm kiếm FAQ | **Template J (Support & Content)** | P1 |
| 20 | `/guide` | StoreLayout | Hướng dẫn chọn size thiếu hình minh họa thước dây trực quan | **Template J (Support & Content)** | P1 |
| 21 | `/about` | StoreLayout | Câu chuyện thương hiệu cần bố cục tạp chí phóng sự nghệ nhân | **Template J (Support & Content - Brand Story)**| P1 |
| 22 | `/blog` | StoreLayout | Tạp chí thời trang hiển thị như trang danh mục thông thường | **Template J (Support & Content - Editorial Mag)**| P1 |
| 23 | `/login` | AuthLayout | Khá ổn nhưng cần tăng tính sang trọng với ảnh campaign bên cạnh | **Template I (Authentication)** | P1 |
| 24 | `/register` | AuthLayout | Form đăng ký cần các lợi ích khi gia nhập Atelier Club | **Template I (Authentication)** | P1 |
| 25 | `/verify-otp` | AuthLayout | Bộ đếm ngược và ô nhập 6 số cần tập trung hơn | **Template I (Authentication)** | P1 |
| 26 | `/reset-password` | AuthLayout | Luồng khôi phục cần sự an tâm và bảo mật tuyệt đối | **Template I (Authentication)** | P1 |
| 27 | `/my-coupons` | StoreLayout | Ví voucher cá nhân bị lạc lõng trong layout chung | **Template E (Personal Account Workspace)** | P1 |
| 28 | `/profile` | StoreLayout | Cập nhật hồ sơ thiếu sidebar quản lý tài khoản chuyên biệt | **Template E (Personal Account Workspace)** | P0 |
| 29 | `/profile/data-requests` | StoreLayout | Yêu cầu GDPR thiếu trạng thái lịch sử xử lý | **Template E (Personal Account Workspace)** | P2 |
| 30 | `/user/dashboard` | StoreLayout | Trang tổng quan tài khoản cần thẻ VIP Diamond và thống kê chi tiêu | **Template E (Personal Account Workspace)** | P0 |
| 31 | `/orders` | StoreLayout | Danh sách đơn thiếu bộ lọc trạng thái dạng pill và timeline chi tiết | **Template E (Personal Account Workspace)** | P0 |
| 32 | `/reviews/create` | StoreLayout | Form đánh giá sản phẩm cần trải nghiệm chấm sao mượt mà | **Template E (Personal Account Workspace)** | P1 |
| 33 | `/admin` | AdminLayout | Cần bảng chỉ số KPI rõ ràng, theme switcher, thống kê tức thời | **Template H (Admin Operations)** | P0 |
| 34 | `/admin/categories` | AdminLayout | Bảng danh mục cần tính năng tìm kiếm nhanh và modal phân cấp | **Template H (Admin Operations)** | P1 |
| 35 | `/admin/products` | AdminLayout | Quản lý tồn kho/biến thể cần bảng dữ liệu mật độ cao dễ quét | **Template H (Admin Operations)** | P0 |
| 36 | `/admin/orders` | AdminLayout | Cập nhật trạng thái đơn cần quy trình dropdown thao tác 1 chạm | **Template H (Admin Operations)** | P0 |
| 37 | `/admin/chats` | AdminLayout | Cửa sổ chat CSKH thời gian thực cần 2 cột: danh sách + hội thoại | **Template H (Admin Operations)** | P1 |
| 38 | `/admin/customers` | AdminLayout | Bảng khách hàng cần thẻ tóm tắt chi tiêu và trạng thái tài khoản | **Template H (Admin Operations)** | P1 |
| 39 | `/admin/coupons` | AdminLayout | Tạo voucher cần form cấu hình ngày hiệu lực và hạn mức | **Template H (Admin Operations)** | P1 |
| 40 | `/admin/campaigns` | AdminLayout | Quản lý sự kiện flash sale cần trạng thái đếm ngược | **Template H (Admin Operations)** | P1 |
| 41 | `/admin/banners` | AdminLayout | Xem trước thứ tự ưu tiên banner hiển thị | **Template H (Admin Operations)** | P1 |
| 42 | `/admin/lookbooks` | AdminLayout | Tải lên và gắn tọa độ hotspot cho bộ ảnh | **Template H (Admin Operations)** | P1 |
| 43 | `/admin/ab-testing` | AdminLayout | Biểu đồ trực quan so sánh tỷ lệ chuyển đổi biến thể A vs B | **Template H (Admin Operations)** | P1 |
| 44 | `/admin/user-activity` | AdminLayout | Giám sát luồng sự kiện realtime và mở ngăn kéo User Journey | **Template H (Admin Operations)** | P1 |
| 45 | `/admin/pages` | AdminLayout | Trình soạn thảo văn bản chính sách tĩnh | **Template H (Admin Operations)** | P2 |
| 46 | `/admin/settings` | AdminLayout | Cấu hình tham số cửa hàng, showroom, hotline, bảo trì | **Template H (Admin Operations)** | P1 |
| 47 | `/non-existent-route-404-test` | StoreLayout | Trang 404 tùy biến cần định hướng người dùng quay lại mua sắm | **Template K (System & Error)** | P2 |
| 48 | `*` | StoreLayout | Bắt mọi đường dẫn không xác định, thiết kế thân thiện | **Template K (System & Error)** | P2 |

---

## 3. KẾ HOẠCH TRIỂN KHAI HỆ THỐNG LAYOUT & TEMPLATE MỚI

Để chuyển đổi thành công 48 routes sang hệ thống layout chuyên biệt mà không gây xáo trộn code và không làm đứt gãy luồng xử lý dữ liệu hiện có:

1. **Xây dựng các Layout wrappers chuẩn:**
   - `frontend/src/layouts/EditorialLayout.jsx`: Header campaign sang trọng, footer tạp chí, hỗ trợ Three.js canvas.
   - `frontend/src/layouts/CommerceLayout.jsx`: Header thương mại với bộ lọc nhanh, thanh giỏ hàng nổi bật, breadcrumb tinh tế.
   - `frontend/src/layouts/CheckoutLayout.jsx`: Header tối giản (chỉ logo + hotline hỗ trợ + huy hiệu bảo mật SSL 256-bit), footer chỉ có chính sách hoàn tiền và bản quyền, triệt tiêu mọi link điều hướng gây bỏ giỏ hàng.
   - `frontend/src/layouts/AccountLayout.jsx`: Khung làm việc cá nhân có Sidebar tài khoản, thông tin thẻ thành viên, các tab Đơn hàng, Voucher, Yêu thích, Hồ sơ.
   - `frontend/src/layouts/ContentLayout.jsx`: Khung đọc bài viết chuyên sâu với cột mục lục điều hướng (Sticky Table of Contents), phông chữ tối ưu đọc dài.
   - `frontend/src/layouts/LookbookLayout.jsx`: Khung hiển thị bộ sưu tập ảnh tràn viền (Full-bleed), thanh chuyển đổi lookbook theo mùa.
   - `frontend/src/components/layout/AdminLayout.jsx`: Nâng cấp bố cục quản trị dữ liệu mật độ cao, tích hợp theme switcher và breadcrumbs console.
2. **Tái cấu trúc file `frontend/src/router.jsx`:**
   - Phân nhóm 48 routes vào đúng Layout tương ứng.
3. **Bảo toàn 100% logic và wiring:**
   - Giữ nguyên các stores Zustand (`authStore`, `cartStore`, `themeStore`, `uiStore`, `personaStore`), các hooks React Query và các `data-testid` phục vụ kiểm thử tự động.
