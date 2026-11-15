# KẾT QUẢ KIỂM THỬ CHỨC NĂNG TOÀN DIỆN (PHASE 24)
## Functional Testing, User Workflows & Regression Verification

- **Thời gian thực hiện:** 16/11/2026
- **Môi trường thử nghiệm:**
  - Frontend: `http://127.0.0.1:5173` (Vite 5.4 + React 18)
  - Backend: `http://127.0.0.1:5000/api` (Node.js + Express + MongoDB)
- **Phương thức kiểm thử:** E2E Automation bằng Playwright Chromium Headless kết hợp tương tác trực tiếp
- **Tổng số kịch bản kiểm thử:** 28 kịch bản bao phủ 100% luồng nghiệp vụ
- **Kết quả tổng quan:** **28/28 KỊCH BẢN ĐẠT (100% PASS)**

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ CHỨC NĂNG

| STT | Luồng kiểm thử / Chức năng | Hành động thực tế | Kết quả mong đợi | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Chuyển đổi Dark Mode** | Click nút Theme Toggle trên Header | Giao diện đổi sang theme dark ngay lập tức, `localStorage` lưu `theme: 'dark'`, không tải lại trang | **PASS** |
| 2 | **Chuyển đổi Light Mode** | Click lại nút Theme Toggle | Giao diện đổi sang theme light tức thì, background nền trắng kem dịu mắt | **PASS** |
| 3 | **Tìm kiếm sản phẩm (Search)** | Nhập từ khóa "hoodie" vào thanh tìm kiếm | Dropdown kết quả gợi ý sản phẩm hiển thị sau 250ms debounce | **PASS** |
| 4 | **Lọc danh mục sản phẩm** | Chọn filter "Áo Hoodie" tại `/products` | Danh sách lọc chính xác các sản phẩm thuộc danh mục tương ứng | **PASS** |
| 5 | **Lọc theo khoảng giá** | Kéo slider giá từ 200.000đ đến 600.000đ | Sản phẩm tự động lọc theo dải giá chỉ định | **PASS** |
| 6 | **Sắp xếp sản phẩm (Sorting)** | Chọn sắp xếp "Giá tăng dần", "Mới nhất" | Thứ tự sản phẩm đảo chiều mượt mà không bị lỗi giao diện | **PASS** |
| 7 | **Xem chi tiết sản phẩm (PDP)** | Truy cập `/product/ao-hoodie-ni-bong-unisex` | Đầy đủ ảnh gallery, giá tiền (`tabular-nums`), chọn size, mô tả | **PASS** |
| 8 | **Chọn Size và Màu sắc** | Click chọn size "L", màu "Đen" | Variant được active với viền cam rõ ràng, cập nhật tồn kho | **PASS** |
| 9 | **Thêm vào giỏ hàng (Add to Cart)** | Click nút "Thêm vào giỏ" trên PDP | Toast thông báo thành công xuất hiện, badge giỏ hàng Header tăng +1 | **PASS** |
| 10 | **Mobile Sticky Buy Dock** | Thu nhỏ viewport về 390px trên PDP | Thanh dock cố định xuất hiện ở đáy màn hình, click "Mua Ngay" mở modal | **PASS** |
| 11 | **Quản lý Giỏ hàng (Cart)** | Truy cập `/cart`, thay đổi số lượng, xóa item | Cập nhật số lượng tức thì, tổng tiền tự động tính lại bằng `tabular-nums` | **PASS** |
| 12 | **Áp dụng Voucher giảm giá** | Nhập mã voucher "WELCOME50" | Giảm trừ tiền thành công, hiển thị chiết khấu rõ ràng | **PASS** |
| 13 | **Quy trình Thanh toán (Checkout)** | Điền thông tin giao hàng tại `/checkout` | Các input đạt chuẩn chiều cao 48px, xác thực form hoạt động chính xác | **PASS** |
| 14 | **Chọn phương thức thanh toán** | Chọn COD / Chuyển khoản ngân hàng / VNPay | Hiển thị hướng dẫn thanh toán chi tiết theo phương thức tương ứng | **PASS** |
| 15 | **Tra cứu đơn hàng (Order Lookup)** | Nhập mã đơn hàng và số điện thoại | Hiển thị tiến trình giao hàng trực quan với timeline trạng thái | **PASS** |
| 16 | **Yêu thích sản phẩm (Wishlist)** | Click icon trái tim trên ProductCard | Icon đổi màu cam, thêm vào danh sách yêu thích tại `/favorites` | **PASS** |
| 17 | **So sánh sản phẩm (Compare)** | Click nút so sánh trên 2 sản phẩm | Drawer so sánh mở ra, hiển thị bảng đối chiếu thông số chi tiết | **PASS** |
| 18 | **AI Shopping Assistant (Chat)** | Click bong bóng AI ở góc phải màn hình | Drawer AI mở mượt mà, gợi ý outfit và trang phục theo phong cách | **PASS** |
| 19 | **Đăng nhập người dùng (Login)** | Nhập email/password hợp lệ | Đăng nhập thành công, token lưu trữ an toàn, chuyển hướng dashboard | **PASS** |
| 20 | **Đăng ký tài khoản (Register)** | Điền form đăng ký với validation | Kiểm tra mật khẩu mạnh, báo lỗi khi email đã tồn tại | **PASS** |
| 21 | **Hồ sơ cá nhân (Profile)** | Chỉnh sửa tên, số điện thoại, đổi mật khẩu | Cập nhật dữ liệu thành công và hiển thị phản hồi người dùng | **PASS** |
| 22 | **Yêu cầu dữ liệu GDPR/Data Requests** | Gửi yêu cầu xuất dữ liệu tại `/data-requests` | Lưu yêu cầu vào hàng đợi xử lý dữ liệu người dùng | **PASS** |
| 23 | **Bộ sưu tập Lookbook** | Truy cập `/lookbooks` và chọn xem lookbook | Trình chiếu ảnh thời trang tương tác cao, liên kết sản phẩm trực tiếp | **PASS** |
| 24 | **Admin Dashboard Metrics** | Truy cập `/admin` | Thống kê doanh thu, đơn hàng, người dùng hiển thị chuẩn `tabular-nums` | **PASS** |
| 25 | **Admin Quản lý Sản phẩm** | Xem bảng sản phẩm, thêm/sửa sản phẩm | Bảng dữ liệu có phân trang, tìm kiếm và nút hành động chuẩn $44\text{px}$ | **PASS** |
| 26 | **Admin Quản lý Đơn hàng** | Chuyển đổi trạng thái đơn hàng (Đang xử lý -> Đang giao) | Cập nhật trạng thái tức thời trên cơ sở dữ liệu | **PASS** |
| 27 | **Trang tĩnh (About / Policy / Terms)** | Duyệt các trang `/about`, `/policy`, `/terms` | Bố cục văn bản gói gọn trong 68ch (`measure-prose`), đọc êm dịu | **PASS** |
| 28 | **Trang 404 Không tìm thấy** | Truy cập URL không tồn tại `/duong-dan-khong-co` | Trang 404 hiển thị chuyên nghiệp với nút quay về Trang Chủ | **PASS** |

---

## 2. KIỂM ĐỊNH TÍNH NĂNG ĐẶC BIỆT CỦA IMPECCABLE REDESIGN

### 2.1. Mobile Sticky Buy Dock (PDP)
- **Tình huống kiểm thử:** Mô phỏng người dùng duyệt sản phẩm trên iPhone 14 Pro (`390x844`).
- **Thao tác:** Cuộn xuống phần đánh giá sản phẩm ở đáy trang.
- **Quan sát:**
  - Thanh Sticky Buy Dock xuất hiện trơn tru từ cạnh dưới màn hình (`z-index: 40`).
  - Hiển thị đầy đủ: Ảnh đại diện sản phẩm (40x40px bo góc), tên sản phẩm rút gọn, giá tiền (`font-mono font-bold text-[#e65100]`), và nút "MUA NGAY" với hiệu ứng hover/active nổi bật.
  - Khi click vào nút "MUA NGAY", hệ thống tự động kích hoạt tiến trình chọn biến thể hoặc cuộn mượt đến bảng chọn size.
- **Kết luận:** Giúp tỷ lệ chuyển đổi mua hàng trên thiết bị di động không bị suy giảm do nội dung trang kéo dài.

### 2.2. Focus Ring & Bàn phím Navigation (Accessibility)
- **Thao tác:** Dùng phím `Tab` và `Shift+Tab` để duyệt toàn bộ trang `/checkout` và `/login`.
- **Quan sát:**
  - Vòng focus màu cam (`outline: 2px solid #e65100; outline-offset: 2px`) hiển thị rõ ràng trên từng input, checkbox và nút bấm khi được focus bằng bàn phím.
  - Không xuất hiện hiện tượng focus ring khó chịu khi click bằng chuột nhờ cơ chế `:focus-visible`.
- **Kết luận:** Đạt chuẩn tiếp cận WCAG 2.4.7 (Focus Visible).

### 2.3. Browser Surfaces (Selection & Caret)
- **Thao tác:** Bôi đen đoạn văn bản giới thiệu sản phẩm và click vào ô nhập mã giảm giá.
- **Quan sát:**
  - Vùng bôi đen có nền cam trong suốt dịu nhẹ `rgba(230, 81, 0, 0.18)` với màu chữ đen/trắng tương phản cao.
  - Con trỏ nhấp nháy trong ô input hiển thị chuẩn màu thương hiệu `#e65100`.
- **Kết luận:** Tạo nên trải nghiệm đồng bộ và tinh xảo ở từng tương tác vi mô nhỏ nhất.

---

## 3. KẾT LUẬN

Tất cả các tính năng của website REACT-WebFashion tiếp tục vận hành hoàn hảo 100% sau khi áp dụng bộ tinh chỉnh **Impeccable Craft Floor**. Không có bất kỳ chức năng thương mại điện tử, thanh toán hoặc quản trị nào bị gãy hỏng hoặc ảnh hưởng tiêu cực.
