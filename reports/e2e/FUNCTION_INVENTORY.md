# FUNCTION INVENTORY — 100% INTERACTIVE CONTROLS & SPECIFICATION

**Dự án:** REACT-WebFashion  
**Giai đoạn:** Phase 10 — Autonomous 100% Route & Function Testing  
**Chế độ:** FULLY AUTONOMOUS  
**Mục tiêu:** Liệt kê và kiểm thử toàn bộ tương tác người dùng có trên giao diện  
**Ngày thực hiện:** 16/11/2026  

---

## 1. BẢNG DANH MỤC ĐẦY ĐỦ CÁC CHỨC NĂNG (FUNCTION SPECIFICATION)

| Function ID | Route | Thành phần giao diện (Element) | Hành vi kỳ vọng (Expected Behavior) | Mã Test | Trạng thái (Status) |
|---|---|---|---|---|---|
| **FN-01** | `/` | Chuông thông báo (`[data-testid="notif-bell-btn"]`) | Mở dropdown thông báo, hiển thị danh sách tin mới, bấm "Đánh dấu đã đọc" chuyển trạng thái chưa đọc về 0 | TC-FN-01 | PASS |
| **FN-02** | `/` | Nút AI Style Quiz (`[data-testid="header-style-quiz-btn"]`) | Mở modal trắc nghiệm 4 bước (phong cách, bảng màu, dáng may đo, chữ ký phong cách), hiển thị Fashion Persona và gợi ý set đồ | TC-FN-02 | PASS |
| **FN-03** | `/` | Nút Trò chuyện AI (`button[title*='AI']`) | Mở modal AI Assistant, nhấp chọn pill "Gợi ý trang phục", bot phản hồi gợi ý outfit may đo | TC-FN-03 | PASS |
| **FN-04** | `/` | Silk 3D Hero Canvas | Render hiệu ứng sóng vải lụa Three.js 60 FPS, tự động tạm dừng animation khi cuộn khỏi màn hình (IntersectionObserver) | TC-FN-04 | PASS |
| **FN-05** | `/products` | Input tìm kiếm sản phẩm | Nhập từ khóa "Áo khoác", danh sách sản phẩm lọc lại theo tên thời gian thực | TC-FN-05 | PASS |
| **FN-06** | `/products` | Bộ lọc danh mục & khoảng giá | Chọn danh mục "Áo Nam" và khoảng giá, lưới sản phẩm hiển thị đúng tiêu chí đã chọn | TC-FN-06 | PASS |
| **FN-07** | `/products` | Nút Thêm vào So sánh (`ProductCard`) | Chọn 2 sản phẩm vào khay so sánh, khay dưới màn hình hiện số lượng `2/4` | TC-FN-07 | PASS |
| **FN-08** | `/products` | Nút Xem ma trận so sánh | Mở modal so sánh song song (`ProductComparisonDrawer`), hiển thị bảng đối chiếu chất liệu, form dáng, giá bán | TC-FN-08 | PASS |
| **FN-09** | `/product/:slug` | Bộ chọn biến thể (Màu & Size) | Nhấp chọn size `L` và màu `Đen`, giá và trạng thái tồn kho cập nhật tương ứng | TC-FN-09 | PASS |
| **FN-10** | `/product/:slug` | Nút Tư Vấn Size AI | Mở modal tính size thông minh, nhập chiều cao/cân nặng, AI đề xuất size chuẩn và nút "Áp dụng size" tự chọn size | TC-FN-10 | PASS |
| **FN-11** | `/product/:slug` | Nút Mua Trọn Bộ (Complete The Look) | Cuộn tới section phối đồ, bấm "Thêm cả bộ vào giỏ (-10%)", thêm toàn bộ 3 sản phẩm vào giỏ hàng | TC-FN-11 | PASS |
| **FN-12** | `/product/:slug` | Nút Thêm vào giỏ hàng | Bấm thêm sản phẩm, hiển thị toast thông báo thành công và số lượng giỏ hàng trên Header tăng lên | TC-FN-12 | PASS |
| **FN-13** | `/cart` | Nút Tăng/Giảm số lượng (`+`/`-`) | Bấm tăng số lượng sản phẩm từ 1 lên 2, tổng tiền đơn hàng tự động tính toán lại ngay lập tức | TC-FN-13 | PASS |
| **FN-14** | `/cart` | Thanh tiến trình Freeship Tracker | Hiển thị phần trăm đạt ngưỡng miễn phí giao hàng (500.000đ), khi đủ tiền chuyển sang trạng thái "Bạn được Miễn phí giao hàng" | TC-FN-14 | PASS |
| **FN-15** | `/cart` | Form nhập Voucher ưu đãi | Nhập mã "ATELIER10", bấm áp dụng, giảm trực tiếp 10% tổng giá trị đơn hàng | TC-FN-15 | PASS |
| **FN-16** | `/cart` | Nút Tiến hành Thanh toán | Nhấp chuyển hướng mượt mà sang trang `/checkout` | TC-FN-16 | PASS |
| **FN-17** | `/checkout` | Form thông tin giao hàng | Điền họ tên, số điện thoại, tỉnh/thành, quận/huyện, địa chỉ chi tiết | TC-FN-17 | PASS |
| **FN-18** | `/checkout` | Bộ chọn phương thức thanh toán | Chuyển đổi giữa 3 tùy chọn: COD (Thanh toán khi nhận), MoMo QR, VNPay Gateway | TC-FN-18 | PASS |
| **FN-19** | `/checkout` | Nút Đặt hàng ngay | Gửi payload đơn hàng tới API, tạo đơn thành công và chuyển tới trang `/payment-result` | TC-FN-19 | PASS |
| **FN-20** | `/payment-result` | Form tra cứu đơn hàng nhanh | Nhập mã đơn hàng và số điện thoại, hiển thị trạng thái xử lý đơn hàng không bị lỗi | TC-FN-20 | PASS |
| **FN-21** | `/order-lookup` | Tra cứu đơn không cần đăng nhập | Nhập "ORD-89241" và SĐT, hiển thị chi tiết tiến trình giao hàng GHN theo từng mốc thời gian | TC-FN-21 | PASS |
| **FN-22** | `/favorites` | Nút Chuyển vào giỏ (`Cart`) | Nhấp nút giỏ hàng trên thẻ yêu thích, thêm sản phẩm vào giỏ hàng thành công | TC-FN-22 | PASS |
| **FN-23** | `/vouchers` | Nút Sao chép mã ưu đãi | Bấm "Sao chép mã", mã được copy vào clipboard và hiển thị tooltip thông báo thành công | TC-FN-23 | PASS |
| **FN-24** | `/lookbooks` | Điểm chạm Shoppable Hotspots | Di chuột/chạm vào chấm tròn trên người mẫu, popup chi tiết sản phẩm hiển thị kèm giá và nút mua nhanh | TC-FN-24 | PASS |
| **FN-25** | `/faq` | Accordion câu hỏi | Bấm vào câu hỏi mở rộng nội dung giải đáp, bấm lần nữa thu gọn mượt mà | TC-FN-25 | PASS |
| **FN-26** | `/guide` | Tab chuyển đổi bảng kích thước | Chuyển đổi giữa tab "Nam" và "Nữ", bảng thông số vòng ngực/eo/vai cập nhật tương ứng | TC-FN-26 | PASS |
| **FN-27** | `/login` | Form đăng nhập tài khoản | Điền email/password hợp lệ, kích hoạt ghi nhớ đăng nhập, lưu token JWT vào localStorage | TC-FN-27 | PASS |
| **FN-28** | `/register` | Form đăng ký tài khoản mới | Điền thông tin họ tên, email, password; thanh chỉ báo đo độ mạnh mật khẩu cập nhật theo độ dài | TC-FN-28 | PASS |
| **FN-29** | `/verify-otp` | Form nhập mã OTP 6 số | Tự động focus ô số tiếp theo khi nhập, nút đếm ngược gửi lại mã 60s hoạt động chuẩn xác | TC-FN-29 | PASS |
| **FN-30** | `/reset-password` | Form khôi phục mật khẩu | Điền email nhận mã khôi phục, hiển thị thông báo hướng dẫn gửi mã qua email | TC-FN-30 | PASS |
| **FN-31** | `/profile` | Tab Thông tin & Sổ địa chỉ | Chuyển đổi tab xem thông tin cá nhân và quản lý danh sách địa chỉ giao hàng | TC-FN-31 | PASS |
| **FN-32** | `/profile/data-requests` | Form yêu cầu GDPR Privacy | Chọn loại yêu cầu "Trích xuất dữ liệu cá nhân" và gửi thành công | TC-FN-32 | PASS |
| **FN-33** | `/orders` | Bộ lọc trạng thái đơn hàng | Chuyển tab giữa "Đang giao", "Hoàn tất", danh sách đơn hàng lọc đúng trạng thái | TC-FN-33 | PASS |
| **FN-34** | `/reviews/create` | Đánh giá sao và nhận xét | Chọn 5 sao, điền nội dung cảm nhận chất vải, gửi đánh giá thành công | TC-FN-34 | PASS |
| **FN-35** | `/admin` | Biểu đồ doanh thu ECharts | Render biểu đồ đường/cột doanh thu, hỗ trợ tooltip tương tác khi di chuột | TC-FN-35 | PASS |
| **FN-36** | `/admin/categories` | Modal Tạo danh mục mới | Mở modal thêm danh mục may đo, điền tên danh mục và bấm đóng/lưu | TC-FN-36 | PASS |
| **FN-37** | `/admin/products` | Bộ lọc & Tìm kiếm sản phẩm | Nhập tìm kiếm sản phẩm trong kho hàng, cập nhật danh sách bảng quản trị tức thì | TC-FN-37 | PASS |
| **FN-38** | `/admin/orders` | Cập nhật trạng thái đơn hàng | Đổi trạng thái đơn từ "Chờ xác nhận" sang "Đang giao", lưu cập nhật thành công | TC-FN-38 | PASS |
| **FN-39** | `/admin/chats` | Chọn hội thoại CSKH trực tiếp | Nhấp chọn khách hàng trong danh sách hội thoại, load lịch sử tin nhắn và ô gửi phản hồi | TC-FN-39 | PASS |
| **FN-40** | `/admin/customers` | Khóa/Mở khóa tài khoản | Chuyển đổi công tắc trạng thái người dùng với hộp thoại xác nhận | TC-FN-40 | PASS |
| **FN-41** | `/admin/coupons` | Tạo mã giảm giá mới | Thiết lập % giảm giá, giá trị đơn tối thiểu và thời hạn áp dụng | TC-FN-41 | PASS |
| **FN-42** | `/admin/campaigns` | Thiết lập chiến dịch Flash Sale | Cấu hình thời gian đếm ngược và mức ưu đãi cho sự kiện theo mùa | TC-FN-42 | PASS |
| **FN-43** | `/admin/banners` | Quản lý thứ tự ưu tiên Banner | Điều chỉnh thứ tự hiển thị banner trang chủ và liên kết đích | TC-FN-43 | PASS |
| **FN-44** | `/admin/lookbooks` | Quản lý bộ ảnh Lookbook | Cập nhật hình ảnh lookbook và các điểm gắn sản phẩm (Shoppable Hotspots) | TC-FN-44 | PASS |
| **FN-45** | `/admin/ab-testing` | Báo cáo tỷ lệ chuyển đổi A/B | Xem thống kê số lượt truy cập, tỷ lệ thêm giỏ hàng giữa các biến thể thử nghiệm | TC-FN-45 | PASS |
| **FN-46** | `/admin/user-activity` | Ngăn kéo User Journey Drawer | Mở xem chi tiết chuỗi hành động của người dùng (xem sp -> thêm giỏ -> checkout) | TC-FN-46 | PASS |
| **FN-47** | `/admin/pages` | Chỉnh sửa CMS trang tĩnh | Trình soạn thảo văn bản cập nhật nội dung trang điều khoản và chính sách | TC-FN-47 | PASS |
| **FN-48** | `/admin/settings` | Cấu hình Hotline & Bảo trì | Cập nhật số điện thoại hotline Atelier, công tắc bật/tắt chế độ bảo trì hệ thống | TC-FN-48 | PASS |

---

## 2. TỔNG KẾT DANH MỤC CHỨC NĂNG
- **Tổng số chức năng cốt lõi được định danh:** **48 chức năng**.
- **Tất cả các chức năng đều có assertions và tương tác kiểm thử thực tế.**
- **Tỷ lệ kiểm thử thành công:** **48 / 48 PASS (100%)**.
