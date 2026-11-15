# ROUTE INVENTORY — 100% ROUTE SPECIFICATION (48 ROUTES)

**Dự án:** REACT-WebFashion  
**Giai đoạn:** Phase 10 — Autonomous 100% Route & Function Testing  
**Chế độ:** FULLY AUTONOMOUS — KHÔNG HỎI LẠI  
**Mục tiêu:** Kiểm tra và thực thi 100% routes và chức năng thực tế trên giao diện  
**Ngày kiểm tra:** 16/11/2026  

---

## 1. BẢNG PHÂN LOẠI & ĐẶC TẢ ĐẦY ĐỦ 48 ROUTES

| STT | Tuyến đường (Route) | Vai trò (Role) | Dữ liệu yêu cầu (Required Data) | Các chức năng chính (Functions) | Mã kiểm thử | Trạng thái (Status) |
|---|---|---|---|---|---|---|
| 1 | `/` | Public | Products, Categories, Banners, Campaigns | Hero 3D sóng vải lụa, lướt BST, banner sự kiện, mở modal AI Chat, Notification Center, AI Style Quiz | TC-ROUTE-01 | PASS |
| 2 | `/products` | Public | Category list, Product filter | Lọc danh mục, lọc giá, chọn màu/size, sắp xếp giá/bán chạy, tìm kiếm, Drawer so sánh sản phẩm song song | TC-ROUTE-02 | PASS |
| 3 | `/product/:slug` | Public | Product details, Variants, Stock | Gallery ảnh phóng to, chọn biến thể, trợ lý tư vấn size AI (Smart Size Assistant), Complete The Look outfit bundle | TC-ROUTE-03 | PASS |
| 4 | `/cart` | User | Cart items, Vouchers | Tăng/giảm số lượng, xóa sản phẩm, Free Shipping Progress Bar, áp dụng mã voucher, tiến hành thanh toán | TC-ROUTE-04 | PASS |
| 5 | `/checkout` | User | User addresses, GHN shipping fee | Chọn/thêm địa chỉ, tính cước giao hàng, chọn cổng COD / MoMo QR / VNPay, xác nhận tạo đơn hàng | TC-ROUTE-05 | PASS |
| 6 | `/payment-result` | Public | Order transaction summary | Hiển thị biên lai giao dịch thanh toán điện tử, tra cứu mã giao dịch, nút quay lại mua sắm | TC-ROUTE-06 | PASS |
| 7 | `/order-lookup` | Public | Order code, Phone number | Nhập mã đơn "ORD-89241" và số điện thoại để tra cứu tiến độ giao hàng và dòng sự kiện vận chuyển | TC-ROUTE-07 | PASS |
| 8 | `/favorites` | User | Wishlist products | Xem danh sách yêu thích cá nhân, xóa sản phẩm khỏi wishlist, chuyển nhanh vào giỏ hàng | TC-ROUTE-08 | PASS |
| 9 | `/vouchers` | Public | Available voucher list | Duyệt voucher ưu đãi, bấm "Sao chép mã", lưu voucher vào ví ưu đãi cá nhân | TC-ROUTE-09 | PASS |
| 10 | `/lookbooks` | Public | Lookbook sets & products | Duyệt bộ sưu tập thời trang may đo, tương tác Shoppable Hotspots trên ảnh, xem chi tiết set đồ | TC-ROUTE-10 | PASS |
| 11 | `/policy` | Public | Static page content | Xem tôn chỉ thiết kế may đo cao cấp, cam kết chất lượng vải và dịch vụ khách hàng | TC-ROUTE-11 | PASS |
| 12 | `/privacy` | Public | Static page content | Xem chính sách bảo mật dữ liệu cá nhân, quyền riêng tư và quy trình thu thập cookie | TC-ROUTE-12 | PASS |
| 13 | `/terms` | Public | Static page content | Xem điều khoản dịch vụ, quyền sở hữu trí tuệ và thỏa thuận giao kết mua sắm | TC-ROUTE-13 | PASS |
| 14 | `/shipping` | Public | Static page content | Xem biểu phí giao hàng, thời gian vận chuyển đối tác GHN và khu vực phục vụ | TC-ROUTE-14 | PASS |
| 15 | `/returns-refunds` | Public | Static page content | Xem quy định đổi trả trong 7 ngày, điều kiện sản phẩm còn nguyên tem mác | TC-ROUTE-15 | PASS |
| 16 | `/payment-policy` | Public | Static page content | Xem hướng dẫn thanh toán COD, chuyển khoản ngân hàng và ví điện tử MoMo/VNPay an toàn | TC-ROUTE-16 | PASS |
| 17 | `/cookies` | Public | Static page content | Xem cơ chế cookie theo dõi phiên làm việc, thiết lập sở thích và tùy chọn vô hiệu hóa | TC-ROUTE-17 | PASS |
| 18 | `/contact-legal` | Public | Static page content | Xem thông tin pháp lý doanh nghiệp, địa chỉ trụ sở, số giấy phép và kênh liên hệ | TC-ROUTE-18 | PASS |
| 19 | `/faq` | Public | FAQ accordion list | Tra cứu câu hỏi thường gặp, bấm mở/đóng accordion câu trả lời theo chủ đề | TC-ROUTE-19 | PASS |
| 20 | `/guide` | Public | Sizing measurement charts | Hướng dẫn đo kích thước cơ thể chi tiết (ngực, eo, mông, vai), chuyển tab Nam / Nữ | TC-ROUTE-20 | PASS |
| 21 | `/about` | Public | Heritage story content | Khám phá câu chuyện thương hiệu Atelier may đo đương đại, hành trình nghệ nhân và triết lý thiết kế | TC-ROUTE-21 | PASS |
| 22 | `/blog` | Public | Fashion editorial articles | Xem danh sách bài viết thời trang, xu hướng phối đồ và cảm hứng nghệ thuật đương đại | TC-ROUTE-22 | PASS |
| 23 | `/login` | Public (Guest) | Login form inputs | Đăng nhập bằng email/SĐT và mật khẩu, đăng nhập Google OAuth, nhớ mật khẩu | TC-ROUTE-23 | PASS |
| 24 | `/register` | Public (Guest) | Registration inputs | Điền thông tin tạo tài khoản, đo độ mạnh mật khẩu, gửi OTP kích hoạt qua Email/SMS | TC-ROUTE-24 | PASS |
| 25 | `/verify-otp` | Public (Guest) | 6-digit OTP code | Nhập 6 số mã OTP, đếm ngược 60 giây gửi lại mã, xác nhận kích hoạt tài khoản | TC-ROUTE-25 | PASS |
| 26 | `/reset-password` | Public (Guest) | Email / New password | Điền email khôi phục, nhập mã xác thực OTP và thiết lập mật khẩu mới | TC-ROUTE-26 | PASS |
| 27 | `/my-coupons` | User | User coupon wallet | Quản lý ví mã giảm giá đã lưu, xem hạn dùng và điều kiện đơn hàng tối thiểu | TC-ROUTE-27 | PASS |
| 28 | `/profile` | User | User profile & addresses | Cập nhật họ tên, số điện thoại, avatar; thêm, sửa, xóa và đặt địa chỉ nhận hàng mặc định | TC-ROUTE-28 | PASS |
| 29 | `/profile/data-requests` | User | GDPR data requests | Tạo yêu cầu xuất dữ liệu cá nhân hoặc xóa tài khoản tuân thủ quy chuẩn quyền riêng tư GDPR | TC-ROUTE-29 | PASS |
| 30 | `/user/dashboard` | User | User metrics, orders | Tổng quan tài khoản cá nhân, cấp bậc thẻ thành viên, đơn hàng gần nhất, thống kê chi tiêu | TC-ROUTE-30 | PASS |
| 31 | `/orders` | User | Order history list | Xem danh sách toàn bộ đơn hàng, lọc theo trạng thái (chờ xác nhận, đang giao, hoàn tất, đã hủy) | TC-ROUTE-31 | PASS |
| 32 | `/reviews/create` | User | Order item for review | Chọn đơn hàng đã mua, xếp hạng số sao (1-5) và viết bình luận cảm nhận sản phẩm | TC-ROUTE-32 | PASS |
| 33 | `/admin` | Admin | Dashboard metrics, charts | Thẻ chỉ số doanh thu, đơn hàng, khách hàng, biểu đồ ECharts doanh thu thời gian thực | TC-ROUTE-33 | PASS |
| 34 | `/admin/categories` | Admin | Categories data table | Bảng danh mục sản phẩm, tìm kiếm, mở modal tạo mới/chỉnh sửa, xóa danh mục | TC-ROUTE-34 | PASS |
| 35 | `/admin/products` | Admin | Products data table | Bảng sản phẩm, lọc theo danh mục, quản lý biến thể màu/size, chỉnh sửa giá và tồn kho | TC-ROUTE-35 | PASS |
| 36 | `/admin/orders` | Admin | Orders data table | Danh sách đơn hàng toàn hệ thống, lọc trạng thái, cập nhật trạng thái đơn hàng | TC-ROUTE-36 | PASS |
| 37 | `/admin/chats` | Admin | Real-time conversations | Giao diện hội thoại CSKH trực tiếp: danh sách khách đang chat, cửa sổ gửi nhận tin nhắn | TC-ROUTE-37 | PASS |
| 38 | `/admin/customers` | Admin | Customers list | Quản lý danh sách người dùng, xem chi tiết thông tin, khóa hoặc kích hoạt tài khoản | TC-ROUTE-38 | PASS |
| 39 | `/admin/coupons` | Admin | Vouchers list | Quản lý mã giảm giá: tạo voucher theo % hoặc tiền cố định, thiết lập ngày hết hạn | TC-ROUTE-39 | PASS |
| 40 | `/admin/campaigns` | Admin | Marketing campaigns | Quản lý chiến dịch tiếp thị và sự kiện flash sale theo mùa | TC-ROUTE-40 | PASS |
| 41 | `/admin/banners` | Admin | Homepage banners | Quản lý hình ảnh banner hiển thị trên website, thứ tự ưu tiên và liên kết đích | TC-ROUTE-41 | PASS |
| 42 | `/admin/lookbooks` | Admin | Lookbooks list | Quản lý các bộ sưu tập Lookbook hình ảnh nghệ thuật và điểm gắn sản phẩm | TC-ROUTE-42 | PASS |
| 43 | `/admin/ab-testing` | Admin | Experiments data | Xem báo cáo phân tích hiệu quả các biến thể A/B testing tính năng | TC-ROUTE-43 | PASS |
| 44 | `/admin/user-activity` | Admin | Real-time event streams | Giám sát luồng sự kiện hành vi người dùng thời gian thực, mở ngăn kéo User Journey Drawer | TC-ROUTE-44 | PASS |
| 45 | `/admin/pages` | Admin | CMS pages data | Soạn thảo và cập nhật nội dung tĩnh các trang chính sách, pháp lý, giới thiệu | TC-ROUTE-45 | PASS |
| 46 | `/admin/settings` | Admin | Website settings | Cấu hình website: thông tin thương hiệu, logo, showroom, hotline, bật/tắt chế độ bảo trì | TC-ROUTE-46 | PASS |
| 47 | `/non-existent-route-404-test` | Public | None | Kiểm tra trang 404 tùy biến, thông báo trang không tồn tại và điều hướng về trang chủ | TC-ROUTE-47 | PASS |
| 48 | `*` (Wildcard) | Public | None | Bắt mọi đường dẫn không xác định, trả về giao diện 404 thân thiện | TC-ROUTE-48 | PASS |

---

## 2. TỔNG KẾT ĐỘ PHỦ THEO PHÂN LOẠI
- **Public Storefront Routes:** 22 routes (45.8%)
- **Authenticated User Routes:** 10 routes (20.8%)
- **Admin Management Suite:** 14 routes (29.2%)
- **System & Error Handling:** 2 routes (4.2%)
- **Tổng cộng:** **48 / 48 routes (Độ phủ: 100%)**
