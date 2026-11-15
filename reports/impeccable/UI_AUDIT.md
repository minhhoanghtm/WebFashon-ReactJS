# BÁO CÁO KIỂM TOÁN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX AUDIT)

**Dự án:** `REACT-WebFashion`  
**Giai đoạn:** Phase 24 — Impeccable Full Website Review & Redesign  
**Thời gian kiểm toán:** 16/11/2026  
**Phương pháp:** Kiểm toán thị giác thực tế trên 5 Viewports (320×568, 390×844, 768×1024, 1366×768, 1920×1080) và 2 Themes (Light, Dark).  
**Dữ liệu ảnh chụp trước cải tạo:** `reports/impeccable/screenshots/before/` (120 ảnh).  

---

## 1. BẢNG TỔNG HỢP KIỂM TOÁN THEO TUYẾN ROUTE

| Route | Visual Problem | UX Problem | Severity | Proposed Redesign |
| :--- | :--- | :--- | :--- | :--- |
| **`/` (Home)** | Có kicker/eyebrow thừa thãi phía trên tiêu đề chính (`BỘ SƯU TẬP MAY ĐO MÙA MỚI`); một số thẻ bento có cấu trúc icon + text lặp lại | Quá nhiều nút bấm cạnh tranh sự chú ý trên viewport đầu tiên (Cognitive Load vượt ngưỡng 4 lựa chọn) | **P1 (Cao)** | Xóa bỏ kicker/eyebrow rập khuôn; để tiêu đề Display Oswald tự dẫn dắt; tái cấu trúc bento grid với tỷ lệ bất đối xứng phá cách; tinh giản CTA chính |
| **`/products` (Catalog)** | Thanh Sub-header chứa nhiều chip danh mục trải ngang làm chật chội trên mobile 320px; khoảng cách giữa lưới sản phẩm và thanh lọc hơi dày | Bộ lọc chưa có trạng thái active rõ ràng ở chế độ Light; thao tác cuộn tìm kiếm trên mobile cần mở drawer tiện lợi | **P2 (Trung bình)** | Tối ưu hóa thanh breadcrumb và category chips với padding co giãn; làm nổi bật số lượng sản phẩm đang hiển thị; cố định nút mở bộ lọc tiện dụng |
| **`/product/:slug` (PDP)** | Bảng thông số kỹ thuật thiếu độ thở; khoảng cách trên/dưới tiêu đề sản phẩm chưa tuân thủ quy tắc Spacing của Craft Floor | Nút chọn size trên mobile 320px có diện tích chạm hơi sát nhau; thanh mua dính đáy cần tối ưu vùng an toàn ngón tay | **P1 (Cao)** | Tăng padding giữa các khối thông tin; áp dụng thước chữ 65ch cho mô tả vải; cải thiện nút chọn kích cỡ $\ge 44\times 44\text{px}$; sticky buy bar mượt mà |
| **`/cart` (Cart)** | Bảng tóm tắt đơn hàng dùng đường viền xám mặc định chưa đồng bộ với bảng màu kem ngà của Light mode | Thiếu phản hồi xúc giác khi xóa item; thanh tiến trình freeshipping cần hiển thị số tiền còn thiếu trực quan hơn | **P2 (Trung bình)** | Chuẩn hóa màu viền `--color-border`; tinh chỉnh typography bảng tổng tiền; thêm micro-feedback khi thay đổi số lượng |
| **`/checkout` (Checkout)** | Eyebrow `BẢO MẬT THANH TOÁN` lặp lại không cần thiết; các trường nhập liệu trên mobile 320px chưa có padding nội vi hoàn hảo | Label biểu mẫu và thông báo lỗi validation chưa rõ ràng về cách khắc phục (chưa đạt chuẩn Impeccable Clarify) | **P1 (Cao)** | Loại bỏ eyebrow thừa; bổ sung nhãn gợi ý khắc phục lỗi cụ thể; tối ưu input height 48px cho thao tác gõ phím cảm ứng |
| **`/lookbooks` (Lookbook)** | Kicker `ATELIER EDITORIAL ARCHIVE` làm loãng tiêu đề Runway; thẻ hotspot trên ảnh có thể che khuất chi tiết trang phục | Chuyển đổi mùa mốt cần hiệu ứng trượt êm ái hơn thay vì ngắt đột ngột; trên màn hình 320px các chip bị tràn | **P2 (Trung bình)** | Bỏ nhãn thừa; điều chỉnh tọa độ hotspot thông minh với tooltip bán trong suốt; tối ưu thanh trượt chọn mùa snap-scroll |
| **`/user/dashboard`** | Thẻ KPI thống kê số lượng đơn hàng có cấu trúc rập khuôn kiểu template dashboard cơ bản (hero metric) | Người dùng phải cuộn nhiều để tìm lịch sử đơn hàng gần nhất; khoảng cách giữa sidebar và content hơi chật trên iPad | **P2 (Trung bình)** | Thiết kế lại khối tổng quan cá nhân hóa mang phong cách thẻ may đo thành viên (Bespoke Membership Card); tối ưu lưới 8 cột tablet |
| **`/orders` (Orders)** | Thẻ trạng thái đơn hàng dùng viền trái dày (vi phạm nguyên tắc Refuse của Impeccable) | Khó phân biệt nhanh giữa đơn đang giao và đơn hoàn tất khi lướt nhanh | **P2 (Trung bình)** | Thay viền trái dày bằng badge may đo tinh xảo với sắc độ Signal Orange / Emerald phân cấp rõ |
| **`/admin` (Admin)** | Mật độ thông tin trên màn hình lớn 1920px bị dồn sang trái, để thừa khoảng trắng không có chủ đích bên phải | Nút hành động nhanh chưa có phím tắt hoặc hover tooltip; biểu đồ thiếu trạng thái rỗng khi chưa có dữ liệu | **P2 (Trung bình)** | Cân bằng lại lưới 12 cột; thêm tooltip tinh tế; tối ưu hóa khoảng thở cho bảng dữ liệu |
| **`/about` (Manifesto)** | Khối văn bản dài trải quá 90ch trên màn hình desktop lớn gây mỏi mắt người đọc; có kicker lặp lại | Thiếu mục lục điều hướng nhanh (Table of Contents) khi đọc bài dài | **P1 (Cao)** | Khống chế chiều rộng đọc chuẩn 68ch (`max-w-prose`); bổ sung mục lục dính bên trái; nhịp điệu typography tương phản cao |
| **`/faq` (FAQ)** | Tiêu đề câu hỏi trong accordion có cỡ chữ hơi nhỏ so với tổng thể trang | Biểu tượng mở rộng chevron chưa có hoạt họa xoay mượt mà khi kích hoạt | **P3 (Thấp)** | Tăng kích cỡ câu hỏi lên 16px font semi-bold; bổ sung chuyển động xoay 180 độ êm ái |
| **`/login` / `/register`** | Khối đăng nhập trên mobile 320px có lề hai bên quá hẹp; viền focus input chưa nổi bật | Thiếu nút ẩn/hiện mật khẩu trực quan; thông báo lỗi đăng nhập hiển thị dạng banner cứng | **P1 (Cao)** | Cân đối lề an toàn 20px trên mobile; thêm icon ẩn/hiện mật khẩu; focus ring chuẩn màu Signal với outline-offset 2px |

---

## 2. PHÂN TÍCH THEO 22 TIÊU CHÍ IMPECCABLE

### 2.1. Độc Bản & Bản Sắc (Brand & Individuality)
Giao diện hiện tại đã có chất liệu thời trang từ Phase 23, nhưng vẫn còn vướng một số thói quen template: các nhãn phụ in hoa (eyebrow/kicker) xuất hiện ở quá nhiều nơi, làm giảm đi sức nặng của các tiêu đề lớn. Cần loại bỏ triệt để để trang web toát lên vẻ tự tin của một nhà mốt cao cấp.

### 2.2. Khoảng Thở & Tỷ Lệ (Spacing & Rhythm)
Một số khoảng trống phía trên tiêu đề chưa đủ sâu so với khoảng trống phía dưới tiêu đề (vi phạm quy tắc *more space above a heading than below it*). Cần chuẩn hóa nhịp điệu khoảng cách theo hệ thống 8px/16px/32px/64px/96px.

### 2.3. Trải Nghiệm Trên Màn Hình Cực Nhỏ (320px Small Mobile)
Màn hình 320px (iPhone SE cũ / thiết bị nhỏ) làm lộ một số điểm nghẽn:
- Thẻ sản phẩm 2 cột có nguy cơ bị đè chữ nếu tên sản phẩm quá dài.
- Nút bấm so sánh và wishlist trên góc ảnh thẻ sản phẩm cần được căn chỉnh kích thước hợp lý để không che ảnh.
- Header cần giữ thanh điều hướng gọn gàng không gây tràn chiều ngang (`overflow-x: clip`).

### 2.4. Bề Mặt Trình Duyệt (Browser Surfaces)
Hệ thống chưa có định nghĩa riêng cho `::selection` (màu bôi đen chữ), `caret-color` (màu nháy con trỏ văn bản) và kiểu hiển thị số liệu dạng bảng (`font-variant-numeric: tabular-nums;`). Đây là cơ hội hoàn hảo để đưa độ hoàn thiện lên tầm thủ công đỉnh cao.
