# BÁO CÁO KIỂM THỬ CHỨC NĂNG TƯƠNG TÁC MỞ RỘNG (FUNCTIONAL TEST RESULTS)

**Dự án:** `REACT-WebFashion`  
**Giai đoạn:** Phase 20 — Full Website Content Expansion & Premium E-Commerce Experience  
**Công cụ kiểm thử:** Playwright Chromium Automation Test Engine  

---

## 1. Kết quả kiểm thử các tính năng mới trên Trang chủ (Homepage Interactive Features)

| STT | Tên chức năng tương tác | Thao tác kiểm thử tự động | Kỳ vọng giao diện & phản hồi | Kết quả thực tế | Trạng thái |
|:---:|:---|:---|:---|:---|:---:|
| 1 | **Announcement Bar** | Bấm nút "Sao chép" mã ưu đãi `ATELIER10` | Clipboard nhận chuỗi ký tự, nút chuyển sang icon Check màu xanh `Đã chép` | Clipboard ghi nhận thành công, trạng thái phản hồi tức thì | **PASS** |
| 2 | **Three.js Silk Wave Canvas** | Rê chuột qua khu vực canvas 3D tại Hero | Sóng lụa chuyển động gợn sóng mượt mà theo tọa độ chuột | Vòng lặp shader 60 FPS phản hồi mượt mà | **PASS** |
| 3 | **Category Mosaic** | Rê chuột qua từng thẻ Bento (Áo khoác, Quần tây...) | Ảnh phóng to nhẹ (scale 1.05), icon mũi tên đổi sang màu cam tín hiệu | Transition 500ms êm dịu, URL định tuyến chính xác | **PASS** |
| 4 | **New Arrivals Category Rails** | Bấm chọn tab danh mục (Tất cả, Áo, Quần...) | Lưới sản phẩm cập nhật lọc theo danh mục không tải lại trang | Danh sách sản phẩm chuyển đổi tức thời | **PASS** |
| 5 | **Trending Now vs Best Sellers** | Bấm chuyển đổi giữa tab "Bán Chạy Nhất" và "Thịnh Hành" | Cập nhật 4 thẻ sản phẩm tương ứng kèm ribbon huy hiệu Top 1-4 | State chuyển đổi 0ms, không phát sinh re-render thừa | **PASS** |
| 6 | **Shoppable Lookbook Hotspots** | Click vào các điểm ghim (Hotspot Pins) trên ảnh mẫu | Popover hiển thị thẻ sản phẩm tương ứng, bấm "Thêm Vào Giỏ" | Nút chuyển "Đã Thêm", số lượng badge giỏ hàng tăng lên | **PASS** |
| 7 | **Complete The Look Bundler** | Bấm checkbox chọn 2-3 món trong set trang phục | Tính toán mức giảm giá combo 10%, bấm "Thêm trọn bộ" | Giỏ hàng nhận trọn bộ 3 sản phẩm cùng lúc | **PASS** |
| 8 | **AI Fashion Style Quiz** | Mở Style Quiz từ banner, chọn 4 bước câu hỏi | Khảo sát hoàn tất, mở thẻ Persona định danh phong cách người dùng | Lưu kết quả vào Persona Store, đóng modal êm ái | **PASS** |
| 9 | **Shop by Occasion** | Click vào thẻ dịp "Công Sở Đương Đại" | Điều hướng sang danh mục trang phục công sở tương ứng | Chuyển trang mượt mà kèm tham số tìm kiếm | **PASS** |
| 10 | **Customer Reviews** | Cuộn và kiểm tra 3 thẻ đánh giá thực tế | Hiển thị đầy đủ số sao 5/5, trích dẫn, ảnh đại diện và nhãn xác thực mua | Bố cục đều cạnh, responsive không vỡ khung | **PASS** |
| 11 | **Atelier Fashion Journal** | Click vào bài viết cẩm nang "Nghệ thuật bảo quản len" | Chuyển hướng tới bài đọc chi tiết trên tạp chí `/blog` | Điều hướng chuẩn xác | **PASS** |
| 12 | **FAQ Accordion** | Click vào tiêu đề câu hỏi số 2 về thời gian giao hàng | Accordion mở rộng nội dung mượt mà, icon mũi tên xoay 180 độ | Đóng mở mượt mà, hỗ trợ chuẩn accessibility | **PASS** |
| 13 | **Atelier VIP Club Newsletter** | Điền email `vip.tester@webfashion.vn` và bấm "Đăng Ký VIP" | Hiển thị thông báo chào mừng và cung cấp mã ưu đãi `VIPATELIER10` | Form validation chuẩn xác, hộp mã copy hoạt động tốt | **PASS** |

---

## 2. Kết quả kiểm thử các tính năng mới trên Trang con (Sub-Pages)

| Tuyến đường | Tính năng kiểm thử | Thao tác thực hiện | Kết quả thực tế | Trạng thái |
|:---|:---|:---|:---|:---:|
| `/products` | **View Switcher** | Chuyển đổi giữa chế độ Lưới 3 cột, Lưới 2 cột Editorial và Danh sách hàng ngang | Giao diện tái cấu trúc tức thì mà không giật cục | **PASS** |
| `/products` | **Quick View Modal** | Bấm nút "Xem Nhanh" trên thẻ sản phẩm | Modal bật lên hiển thị ảnh phóng lớn, chọn số lượng, thêm vào giỏ | **PASS** |
| `/products` | **Lọc khoảng giá & Tồn kho** | Chọn mức giá "Dưới 1.000.000 ₫" và bật "Chỉ còn hàng" | Danh sách sản phẩm tự động lọc đúng theo tiêu chí | **PASS** |
| `/product/:slug` | **Size Guide Table Modal** | Bấm nút "Bảng Size" cạnh bộ chọn size | Bảng số đo chi tiết 4 vòng (S, M, L, XL) hiển thị chuẩn xác | **PASS** |
| `/product/:slug` | **Tabs Accordion** | Bấm mở tab "Chính Sách Vận Chuyển & Đổi Trả" | Nội dung chính sách mở rộng, hiển thị cam kết 7 ngày đổi trả | **PASS** |
| `/product/:slug` | **Sản phẩm liên quan** | Cuộn xuống chân trang chi tiết | Lưới 4 sản phẩm cùng bộ sưu tập hiển thị đầy đủ | **PASS** |
| `/cart` | **Thanh tiến trình Freeship** | Thêm sản phẩm vào giỏ để vượt mốc 1.000.000 ₫ và 2.000.000 ₫ | Thanh tiến trình đạt 100% hiển thị thông điệp Freeship Hỏa Tốc | **PASS** |
| `/cart` | **Chip mã giảm giá nhanh** | Bấm vào chip `✦ ATELIER10 (-10%)` | Mã được điền tự động và trừ tiền trực tiếp trên tổng đơn hàng | **PASS** |
| `/user/dashboard`| **Thẻ thăng hạng Diamond** | Xem thanh tiến trình chi tiêu 8.450.000 ₫ / 15.000.000 ₫ | Hiển thị trực quan lộ trình nâng cấp lên hạng Black Obsidian | **PASS** |
