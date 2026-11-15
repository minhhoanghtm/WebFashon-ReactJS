# HỆ THỐNG CÁC TEMPLATE CHUYÊN BIỆT (SPECIALIZED TEMPLATE SYSTEM)
## DỰ ÁN: REACT-WEBFASHION | THE HALLMARK TEMPLATE FRAMEWORK

**Tài liệu tham chiếu:** Hallmark v2.0.0 & Hallmark Macrostructures  
**Kiến trúc mã nguồn:** `frontend/src/layouts/` & `frontend/src/templates/`  
**Ngày phát hành:** 16/11/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG TEMPLATE

Hệ thống Template của **REACT-WebFashion** được xây dựng nhằm giải quyết bài toán: **Đa dạng hóa bố cục theo từng nghiệp vụ nhưng đồng nhất về bản sắc thương hiệu**. 

```text
                               ┌────────────────────────────────┐
                               │   ATELIER DESIGN TOKENS CORE   │
                               │  (tokens.css & themeStore.js)  │
                               └───────────────┬────────────────┘
                                               │
             ┌─────────────────┬───────────────┴───────────────┬─────────────────┐
             │                 │                               │                 │
     ┌───────▼──────┐  ┌───────▼──────┐                 ┌──────▼──────┐  ┌───────▼──────┐
     │  Editorial   │  │   Commerce   │                 │  Checkout   │  │   Account    │
     │  Homepage    │  │  Discovery   │                 │ Minimal Flow│  │  Workspace   │
     │ (Template A) │  │ (Template B) │                 │(Template D) │  │ (Template E) │
     └──────────────┘  └──────────────┘                 └─────────────┘  └──────────────┘
             │                 │                               │                 │
     ┌───────▼──────┐  ┌───────▼──────┐                 ┌──────▼──────┐  ┌───────▼──────┐
     │Product Detail│  │   Lookbook   │                 │   Content   │  │    Admin     │
     │  Experience  │  │  Editorial   │                 │   Support   │  │  Operations  │
     │ (Template C) │  │ (Template G) │                 │(Template J) │  │ (Template H) │
     └──────────────┘  └──────────────┘                 └─────────────┘  └──────────────┘
```

---

## 2. ĐẶC TẢ CHI TIẾT 10 TEMPLATES CHUYÊN BIỆT

### Template A — Editorial Homepage (Trang Chủ Chiến Dịch)
- **Routes:** `/`
- **Mục đích:** Kể câu chuyện may đo đương đại, định vị thương hiệu xa xỉ, kích thích cảm xúc và dẫn dắt người xem vào thế giới sản phẩm.
- **Cấu trúc màn hình:**
  1. *Hero Viewport (1280x800):* Tấm lụa 3D Three.js cuộn sóng theo chuột, tiêu đề Oswald 72px cô đọng dưới 7 từ, 1 câu dẫn 12 từ, 2 nút CTA (Khám Phá / Trắc Nghiệm Phong Cách).
  2. *Bento Gallery & Category Mosaic:* Khối mảng bất đối xứng tỷ lệ 7:5 tôn vinh sản phẩm chế tác giới hạn.
  3. *Trending & Flash Deals:* Bộ đếm thời gian sắc nét, giá bán cam Terracotta nổi bật.
  4. *Lookbook Shoppable Hotspots:* Trải nghiệm chạm điểm trên người mẫu.
  5. *Fashion Journal & Atelier Story:* Bài viết tạp chí chia 2 cột phóng sự.
  6. *VIP Concierge & Footer Mast:* Đăng ký câu lạc bộ may đo riêng biệt.

### Template B — Product Discovery (Khám Phá & So Sánh Sản Phẩm)
- **Routes:** `/products`, `/favorites`, `/vouchers`
- **Mục đích:** Giúp người mua nhanh chóng tìm kiếm, lọc theo thuộc tính (size, màu, giá), so sánh và lựa chọn sản phẩm phù hợp.
- **Cấu trúc màn hình:**
  1. *Compact Commerce Header:* Thanh tìm kiếm nhanh với gợi ý tức thời, bộ chọn hiển thị 2 cột / 3 cột / 4 cột.
  2. *Active Filter Bar:* Các chip lọc đang chọn có thể xóa nhanh chỉ bằng 1 click.
  3. *Split-view Sidebar & Product Grid:* Thanh lọc bên trái gập mở mượt mà; lưới sản phẩm bên phải co giãn linh hoạt với `minmax(0, 1fr)`.
  4. *Quick View & Wishlist Dock:* Modal xem nhanh không cần rời trang, nút thả tim phản hồi tức thì.
  5. *Parallel Compare Drawer:* Ngăn kéo so sánh thông số 2-3 sản phẩm song song.

### Template C — Product Detail Experience (Chi Tiết Sản Phẩm & Chuyển Đổi)
- **Routes:** `/product/:slug`
- **Mục đích:** Cung cấp thông tin chất liệu, phom dáng chân thực nhất để người mua tự tin đưa ra quyết định mua hàng.
- **Cấu trúc màn hình:**
  1. *Immersive 2-Column Layout:* Cột trái là thư viện ảnh phóng to độ phân giải cao; cột phải là khối thông tin mua hàng dính cố định (Sticky purchase column).
  2. *Variant Matrix:* Nút chọn kích cỡ và màu sắc với vòng chỉ thị trực quan.
  3. *Smart Size Guide Modal:* Bảng số đo cơ thể chi tiết kèm hình hướng dẫn đo.
  4. *Inventory Countdown Pill:* Nhãn trạng thái tồn kho ("Chỉ còn 3 chiếc trong kho").
  5. *Complete The Look Bundle:* Khối gợi ý mua trọn bộ phối đồ với mức giảm giá 10% hấp dẫn.
  6. *Customer Reviews & Fabric Specs:* Đánh giá thực tế từ người mua kèm thông số vải lanh/lụa.

### Template D — Minimal Checkout Flow (Quy Trình Giỏ Hàng & Thanh Toán)
- **Routes:** `/cart`, `/checkout`, `/payment-result`
- **Mục đích:** Đảm bảo luồng thanh toán liền mạch, an tâm, tỷ lệ bỏ rơi giỏ hàng (Cart Abandonment) thấp nhất có thể.
- **Cấu trúc màn hình:**
  1. *Distraction-free Header:* Chỉ hiển thị Logo Atelier, Hotline hỗ trợ và Huy hiệu bảo mật SSL 256-bit. Ẩn toàn bộ menu điều hướng phức tạp.
  2. *Free Shipping Milestone Progress Bar:* Thanh tiến trình đạt ngưỡng miễn phí giao hàng toàn quốc trực quan.
  3. *Step-based Checkout Form:*
     - Bước 1: Thông tin liên hệ & Địa chỉ nhận hàng (tính phí GHN tự động).
     - Bước 2: Chọn phương thức COD / VNPay / MoMo.
     - Bước 3: Xem lại tóm tắt đơn và xác nhận thanh toán.
  4. *Trust Signals:* Cam kết đổi trả 7 ngày, miễn phí hoàn tiền nếu lỗi may đo, hỗ trợ 24/7.

### Template E — Personal Account Workspace (Không Gian Cá Nhân & Đơn Hàng)
- **Routes:** `/user/dashboard`, `/profile`, `/orders`, `/my-coupons`, `/profile/data-requests`, `/reviews/create`
- **Mục đích:** Tạo cảm giác một "Private Lounge" sang trọng, nơi khách hàng quản lý đơn hàng, theo dõi giao vận và tích lũy quyền lợi VIP.
- **Cấu trúc màn hình:**
  1. *Account Navigation Sidebar:* Thẻ thông tin thành viên (Avatar, Họ tên, Hạng thẻ Diamond VIP, Điểm tích lũy). Menu chuyển nhanh giữa Tổng quan, Đơn hàng, Ví Voucher, Địa chỉ, Quyền riêng tư.
  2. *Order Timeline & Status Pills:* Dòng thời gian đơn hàng chi tiết từng chặng (Đang chuẩn bị -> Đã gửi GHN -> Đang giao -> Đã nhận).
  3. *Coupon Wallet Cards:* Vé may đo giảm giá hiển thị hạn dùng và nút sao chép mã tiện lợi.

### Template F — AI Fashion Studio (Phòng Thử Đồ & Trợ Lý AI)
- **Routes:** Modal `/ai-assistant` & Header AI Style Quiz
- **Mục đích:** Tư vấn phối đồ cá nhân hóa dựa trên dữ liệu hình thể và hoàn cảnh sử dụng (đi tiệc, công sở, dạo phố).
- **Cấu trúc màn hình:**
  1. *Persona Quiz Workflow:* 4 câu hỏi trắc nghiệm trực quan với ảnh mẫu phong cách.
  2. *Conversational Interface:* Hộp thoại tương tác thông minh, phản hồi theo giọng điệu cố vấn thời trang Haute Couture.
  3. *Outfit Card Recommendations:* Thẻ gợi ý trọn bộ trang phục có nút "Thêm toàn bộ vào giỏ".

### Template G — Editorial Lookbook (Tạp Chí Bộ Sưu Tập Thời Trang)
- **Routes:** `/lookbooks`
- **Mục đích:** Tôn vinh nghệ thuật may đo qua các bức ảnh khổ lớn theo mùa, khơi gợi cảm hứng thời trang đỉnh cao.
- **Cấu trúc màn hình:**
  1. *Full-bleed Image Hero:* Bức ảnh đại diện chiến dịch tràn mép với tiêu đề mùa mốt (Spring/Summer - Autumn/Winter).
  2. *Interactive Shoppable Hotspots:* Khi rê chuột vào người mẫu, các điểm ghim phát sáng hiển thị tên áo, quần, phụ kiện và giá bán kèm nút mua ngay.
  3. *Lookbook Grid Switcher:* Cho phép chuyển đổi giữa chế độ xem từng trang tạp chí hoặc dạng lưới tổng hợp.

### Template H — Admin Operations (Bảng Điều Khiển Quản Trị Atelier Console)
- **Routes:** `/admin/*` (Dashboard, Products, Categories, Orders, Customers, Coupons, Campaigns, Banners, Lookbooks, Chats, User Activity, A/B Testing, Pages, Settings)
- **Mục đích:** Tối ưu hóa hiệu suất làm việc của quản trị viên và nhân viên vận hành kho/đơn hàng.
- **Cấu trúc màn hình:**
  1. *Fixed Admin Sidebar:* Menu 14 chức năng quản trị với icon trực quan, huy hiệu thông báo số lượng đơn mới.
  2. *Topbar Utility Bar:* Hiển thị môi trường Live Staging, Theme Switcher (Light/Dark/System), xem nhanh cửa hàng và hồ sơ admin.
  3. *High-density Data Tables:* Bảng dữ liệu có header màu cát nhạt, hỗ trợ lọc, tìm kiếm, phân trang và các nút thao tác CRUD nhanh chóng.
  4. *Visual KPI Panels:* Các thẻ thống kê doanh thu, tỷ lệ chuyển đổi, giỏ hàng trung bình kết hợp biểu đồ phân tích.

### Template I — Authentication (Đăng Nhập & Xác Thực An Toàn)
- **Routes:** `/login`, `/register`, `/verify-otp`, `/reset-password`
- **Mục đích:** Giúp người dùng đăng nhập hoặc tạo tài khoản an toàn, nhanh chóng và tinh tế.
- **Cấu trúc màn hình:**
  1. *Split-Screen Composition:* Cột bên trái là bức ảnh chiến dịch may đo nghệ thuật; cột bên phải là form đăng nhập tối giản trên nền trắng/than ấm.
  2. *Inline Error & Feedback:* Cảnh báo lỗi định dạng email/SĐT xuất hiện tinh tế ngay dưới ô nhập liệu.
  3. *6-Digit OTP Pad:* Ô nhập mã OTP 6 số tự động nhảy con trỏ, có bộ đếm ngược 60s và nút gửi lại mã.

### Template J — Support & Content (Trung Tâm Thông Tin & Chính Sách Đọc Sâu)
- **Routes:** `/about`, `/policy`, `/shipping`, `/returns-refunds`, `/payment-policy`, `/cookies`, `/contact-legal`, `/faq`, `/guide`, `/blog`, `/stores`, `/terms`, `/privacy`
- **Mục đích:** Đảm bảo trải nghiệm đọc điều khoản, hướng dẫn và câu chuyện thương hiệu thoải mái, rõ ràng, minh bạch pháp lý.
- **Cấu trúc màn hình:**
  1. *2-Column Reading Layout:* Cột trái (hoặc thanh trên di động) là mục lục đánh số giúp nhảy nhanh đến từng điều khoản; cột phải là nội dung bài viết với phông chữ `Plus Jakarta Sans` cỡ 15px - 16px, khoảng cách dòng thoáng $1.7$.
  2. *Searchable FAQ Accordions:* Ô tìm kiếm câu hỏi thường gặp với các mục mở rộng accordion đóng mở mượt mà.
  3. *Size Measuring Guide:* Sơ đồ minh họa các vị trí đo thước dây chuẩn xác.

### Template K — System & Error (Hệ Thống & Điều Hướng Thân Thiện)
- **Routes:** `/order-lookup`, `/non-existent-route-404-test`, `*`
- **Mục đích:** Xử lý các tình huống tra cứu không cần đăng nhập và hướng dẫn khách hàng khi gặp liên kết gãy mà không làm gián đoạn trải nghiệm.
- **Cấu trúc màn hình:**
  1. *Focused Card Layout:* Thẻ nhập liệu căn giữa trang nhã.
  2. *Friendly 404 Guide:* Thông báo rõ ràng, gợi ý các bộ sưu tập đang thịnh hành và nút quay về Trang Chủ.

---

## 3. KẾT LUẬN

Hệ thống 10 Template chuyên biệt chuẩn Hallmark đã tạo nên một cấu trúc phân cấp bài bản, xóa bỏ hoàn toàn cảm giác "một khuôn đúc cho mọi trang", đồng thời vẫn đảm bảo tính nhất quán chặt chẽ về nhận diện thương hiệu thời trang cao cấp **REACT-WebFashion**.
