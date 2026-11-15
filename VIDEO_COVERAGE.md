# VIDEO_COVERAGE.md — Báo Cáo Độ Phủ Video E2E Toàn Diện (Phase 18 Verified)

Báo cáo kiểm thử tự động toàn diện và độ phủ ghi hình E2E (End-to-End) cho tất cả **48 / 48 tuyến đường** được quy định trong `ROUTES.md`, ghi hình thành **MỘT VIDEO TỔNG HỢP DUY NHẤT** tại độ phân giải tiêu chuẩn **1920 × 1080**:

- **Đường dẫn file video:** `D:\Project\REACT-WebFashion\videos\FULL_WEBSITE_E2E_TEST.webm`
- **Kích thước file:** 51.97 MB (54,496,032 bytes)
- **Độ phân giải:** 1920 × 1080 (Full HD)
- **Chuẩn nén video:** VP9 / WebM
- **Số lượng tuyến đường ghi hình:** 48 / 48 (Độ phủ: **100%**)
- **Tỷ lệ kiểm thử thành công:** **48 / 48 PASS (100%)**
- **Trạng thái tối ưu hóa:** 100% hình ảnh bảo vệ bởi `<SafeImage>`, vòng lặp Three.js WebGL tích hợp Auto-pause `IntersectionObserver`, cỡ vùng chạm chuẩn WCAG $\ge 44 \times 44\text{px}$, không còn lỗi `useState` tại `/payment-result`.
- **Tính năng đổi mới tích hợp:** Notification Center, AI Fashion Style Quiz, Product Comparison Matrix, Smart Size AI Assistant, Complete The Look Outfit Bundler, Shoppable Lookbook Hotspots, Cart Free Shipping Progress Bar.

---

## Bảng Chi Tiết Độ Phủ Tuyến Đường (100% Routes Verified)

| Route | Đã truy cập | Đã tương tác | Có trong video | Kết quả | Mô tả & Thao tác kiểm thử |
|---|---|---|---|---|---|
| `/` | YES | YES | YES | PASS | Trang chủ Atelier: Cuộn Silk 3D Hero, Collections Bento, mở & đóng Notification Center, hoàn tất AI Style Quiz, mở AI Shopping Assistant Modal |
| `/products` | YES | YES | YES | PASS | Danh mục sản phẩm: Nhập từ khóa tìm kiếm "Áo khoác", chọn 2 sản phẩm vào so sánh, mở xem bảng so sánh chi tiết |
| `/product/ao-hoodie-ni-bong-unisex` | YES | YES | YES | PASS | Chi tiết sản phẩm: Tư vấn size AI (Smart Size Assistant), thêm trọn bộ phối đồ Complete The Look (giảm 10%) |
| `/cart` | YES | YES | YES | PASS | Giỏ hàng: Bấm tăng số lượng `+`, nhập mã ưu đãi "ATELIER10", xem thanh tiến trình miễn phí vận chuyển FREESHIP |
| `/checkout` | YES | YES | YES | PASS | Cổng thanh toán: Điền thông tin giao hàng, chuyển đổi cổng COD / MoMo / VNPay |
| `/payment-result` | YES | YES | YES | PASS | Biên lai giao dịch: Hiển thị kết quả thanh toán điện tử, tra cứu đơn hàng mượt mà không lỗi |
| `/order-lookup` | YES | YES | YES | PASS | Tra cứu đơn hàng: Nhập mã đơn "ORD-89241" và SĐT để tra cứu tiến độ |
| `/favorites` | YES | YES | YES | PASS | Danh sách yêu thích: Duyệt sản phẩm và thao tác chuyển nhanh sang giỏ |
| `/vouchers` | YES | YES | YES | PASS | Kho mã giảm giá: Bấm nút "Sao chép mã" ưu đãi độc quyền |
| `/lookbooks` | YES | YES | YES | PASS | Lookbook nghệ thuật: Duyệt bộ ảnh may đo cao cấp theo mùa |
| `/policy` | YES | YES | YES | PASS | Chính sách thương hiệu: Cuộn duyệt tôn chỉ chất lượng may đo |
| `/privacy` | YES | YES | YES | PASS | Chính sách quyền riêng tư: Quy chuẩn bảo mật dữ liệu khách hàng |
| `/terms` | YES | YES | YES | PASS | Điều khoản dịch vụ: Quy định giao kết hợp đồng và bản quyền thiết kế |
| `/shipping` | YES | YES | YES | PASS | Chính sách vận chuyển: Biểu phí giao hàng và mạng lưới đối tác |
| `/returns-refunds` | YES | YES | YES | PASS | Quy định đổi trả: Hướng dẫn chính sách đổi trả hàng trong 7 ngày |
| `/payment-policy` | YES | YES | YES | PASS | Chính sách thanh toán: Hướng dẫn giao dịch COD, chuyển khoản & ví điện tử |
| `/cookies` | YES | YES | YES | PASS | Quản lý Cookie: Cơ chế thu thập dữ liệu phiên và tùy chọn người dùng |
| `/contact-legal` | YES | YES | YES | PASS | Pháp lý doanh nghiệp: Giấy phép kinh doanh, MST và địa chỉ showroom |
| `/faq` | YES | YES | YES | PASS | Câu hỏi thường gặp: Tương tác mở/đóng accordion câu trả lời |
| `/guide` | YES | YES | YES | PASS | Hướng dẫn chọn size: Tương tác chuyển tab kích thước Nam / Nữ |
| `/about` | YES | YES | YES | PASS | Di sản thương hiệu: Câu chuyện hình thành và triết lý may đo Atelier |
| `/blog` | YES | YES | YES | PASS | Tạp chí phong cách: Bài viết xu hướng thời trang may đo đương đại |
| `/login` | YES | YES | YES | PASS | Đăng nhập: Điền email, password và kích hoạt tùy chọn ghi nhớ phiên |
| `/register` | YES | YES | YES | PASS | Đăng ký tài khoản: Điền họ tên, email, mật khẩu với thanh đo độ bảo mật |
| `/verify-otp` | YES | YES | YES | PASS | Xác thực OTP: Nhập 6 chữ số mã kích hoạt tài khoản |
| `/reset-password` | YES | YES | YES | PASS | Khôi phục mật khẩu: Điền địa chỉ email nhận mã đặt lại |
| `/my-coupons` | YES | YES | YES | PASS | Ví voucher cá nhân: Xem mã giảm giá đã lưu của tài khoản đăng nhập |
| `/profile` | YES | YES | YES | PASS | Hồ sơ cá nhân: Chuyển đổi giữa tab thông tin chung và sổ địa chỉ |
| `/profile/data-requests` | YES | YES | YES | PASS | Quyền riêng tư GDPR: Giao diện gửi yêu cầu trích xuất dữ liệu cá nhân |
| `/user/dashboard` | YES | YES | YES | PASS | Bảng điều khiển khách hàng: Hạng thành viên, điểm thưởng, đơn hàng gần đây |
| `/orders` | YES | YES | YES | PASS | Danh sách đơn hàng: Chuyển đổi bộ lọc trạng thái "Đang giao" / "Hoàn tất" |
| `/reviews/create` | YES | YES | YES | PASS | Đánh giá sản phẩm: Chọn 5 sao và điền nội dung nhận xét trang phục |
| `/admin` | YES | YES | YES | PASS | Bảng điều khiển quản trị: Chỉ số doanh thu, tỷ lệ hoàn, biểu đồ ECharts |
| `/admin/categories` | YES | YES | YES | PASS | Quản lý danh mục: Bấm nút mở modal "Tạo Danh Mục Mới" và đóng modal |
| `/admin/products` | YES | YES | YES | PASS | Quản lý sản phẩm: Tìm kiếm sản phẩm "Bomber", kiểm tra biến thể |
| `/admin/orders` | YES | YES | YES | PASS | Quản trị đơn hàng: Chuyển đổi tab trạng thái xử lý đơn hàng |
| `/admin/chats` | YES | YES | YES | PASS | CSKH trực tuyến: Nhấp chọn hội thoại khách hàng, xem tin nhắn chat |
| `/admin/customers` | YES | YES | YES | PASS | Danh sách khách hàng: Tìm kiếm khách hàng "Nguyễn" và xem phân hạng |
| `/admin/coupons` | YES | YES | YES | PASS | Quản trị mã giảm giá: Danh sách mã khuyến mãi và hạn mức sử dụng |
| `/admin/campaigns` | YES | YES | YES | PASS | Quản lý chiến dịch: Xem lịch trình flash sale và sự kiện theo mùa |
| `/admin/banners` | YES | YES | YES | PASS | Quản trị banner: Kiểm tra danh sách banner trang chủ |
| `/admin/lookbooks` | YES | YES | YES | PASS | Quản lý Lookbook: Thiết lập bộ sưu tập và điểm gắn sản phẩm |
| `/admin/ab-testing` | YES | YES | YES | PASS | Thử nghiệm A/B: Kiểm tra thống kê chuyển đổi của các biến thể |
| `/admin/user-activity` | YES | YES | YES | PASS | Hoạt động người dùng: Giám sát nhật ký sự kiện thời gian thực |
| `/admin/pages` | YES | YES | YES | PASS | Quản trị trang CMS: Soạn thảo và cập nhật chính sách |
| `/admin/settings` | YES | YES | YES | PASS | Cài đặt hệ thống: Thông tin thương hiệu, hotline, địa chỉ Atelier |
| `/non-existent-route-404-test` | YES | YES | YES | PASS | Trang 404 tường minh: Nút điều hướng quay lại trang chủ an toàn |
| `/wildcard-unmatched-slug-404` | YES | YES | YES | PASS | Bắt URL bất định (*): Tự động điều hướng về màn hình 404 sang trọng |
