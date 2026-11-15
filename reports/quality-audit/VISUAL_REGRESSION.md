# VISUAL REGRESSION & MULTI-VIEWPORT AUDIT REPORT

**Dự án:** REACT-WebFashion  
**Giai đoạn:** Phase 18 — Full-Stack Quality Audit & Optimization  
**Trạng thái:** HOÀN THÀNH (100% ĐẠT TIÊU CHUẨN, 0 REGRESSIONS)  
**Tác giả:** UI/UX Quality Assurance Specialist & Playwright Automation Engineer  

---

## 1. Mục tiêu kiểm thử Visual Regression

- Đảm bảo 100% giao diện hiển thị đồng nhất, chính xác và không bị vỡ layout trên mọi kích thước màn hình từ điện thoại siêu nhỏ đến màn hình máy tính để bàn Full HD.
- Tự động phát hiện lỗi tràn màn hình theo chiều ngang (`scrollWidth > clientWidth`).
- Đảm bảo các thành phần quan trọng (Hero 3D, Header cố định, Drawer so sánh, Giỏ hàng, Bảng quản trị) không bị che khuất hoặc đè lên nhau.
- Kiểm tra tính toàn vẹn của hình ảnh với cơ chế `<SafeImage>` fallback.

---

## 2. Ma trận Viewports kiểm thử tự động

Kiểm thử được thực thi tự động qua Playwright (`scripts/audit-quality-and-viewports.mjs`) sử dụng nhân Microsoft Edge Chromium:

| Định dạng thiết bị | Độ phân giải | Tỷ lệ khung hình | Đại diện thiết bị |
| :--- | :--- | :--- | :--- |
| **Small Mobile** | $320 \times 568$ | 9:16 | iPhone SE Gen 1, máy Android giá rẻ |
| **Standard Mobile** | $390 \times 844$ | 19.5:9 | iPhone 12 / 13 / 14 / 15, Galaxy S23 |
| **Large Mobile** | $430 \times 932$ | 19.5:9 | iPhone 14 / 15 Pro Max, Galaxy S24 Ultra |
| **Tablet Portrait** | $768 \times 1024$ | 3:4 | iPad Mini, iPad Air dọc |
| **Standard Laptop** | $1366 \times 768$ | 16:9 | Laptop văn phòng tiêu chuẩn |
| **Full HD Desktop** | $1920 \times 1080$ | 16:9 | Màn hình máy tính để bàn chuyên nghiệp |

---

## 3. Các tuyến đường (Routes) được kiểm tra trên mỗi Viewport

12 màn hình trọng yếu được chụp ảnh và phân tích độ tràn khung hình trên toàn bộ 6 viewports:
1. `GET /` — Trang chủ thương hiệu (Hero 3D, Editorial, Featured Collections).
2. `GET /products` — Danh mục sản phẩm (Bộ lọc nhiều tiêu chí, lưới sản phẩm responsive).
3. `GET /product/ao-len-nu-co-lo` — Chi tiết sản phẩm (Bộ sưu tập ảnh, bộ chọn kích cỡ/màu sắc, gợi ý phối đồ).
4. `GET /cart` — Giỏ hàng (Bảng tính giá, mã giảm giá, danh sách sản phẩm).
5. `GET /checkout` — Thanh toán (Form địa chỉ đa tầng, phương thức COD & MoMo QR).
6. `GET /lookbook` — Bộ sưu tập thời trang (Tạp chí thời trang, interactive hotspots).
7. `GET /stylist` — Trợ lý AI Stylist (Chat trực tiếp, phân tích phong cách cá nhân).
8. `GET /favorites` — Sản phẩm yêu thích (Danh sách lưu trữ, bộ sưu tập cá nhân).
9. `GET /payment-result` — Tra cứu đơn hàng & Kết quả thanh toán (Trạng thái đơn, tra cứu mã đơn).
10. `GET /admin/products` — Quản trị sản phẩm (Bảng dữ liệu, phân trang, lọc kho hàng).
11. `GET /admin/orders` — Quản trị đơn hàng (Cập nhật trạng thái vận chuyển, doanh thu).
12. `GET /profile` — Hồ sơ khách hàng (Thông tin tài khoản, lịch sử mua sắm).

---

## 4. Kết quả kiểm thử tự động (Automation Results)

- **Tổng số lượt kiểm tra Viewport × Tuyến đường:** $6 \times 12 = \mathbf{72\text{ checks}}$.
- **Số lượt ĐẠT (Passed):** **72 / 72 (100%)**.
- **Số lỗi tràn viền ngang (Horizontal Overflow Bugs):** **0**.
- **Số lỗi vỡ hình ảnh (Broken Images):** **0** (Cơ chế `<SafeImage>` kích hoạt fallback thành công khi ảnh mạng bị lỗi).
- **Thư mục lưu trữ ảnh chụp màn hình bằng chứng:**
  `reports/quality/screenshots/`
  - Đã chụp và lưu trữ đầy đủ 72 ảnh PNG độ phân giải cao cho từng tổ hợp viewport và route.

---

## 5. Đánh giá tính hồi quy trực quan (Visual Regression Analysis)

| Hạng mục kiểm tra | Trạng thái trước đây | Trạng thái sau kiểm thử | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Tràn viền màn hình nhỏ ($320\text{px}$)** | Đôi lúc bị tràn do bảng thuộc tính rộng | Thẻ bao bọc `overflow-x-auto` và grid responsive tự co giãn | **Không còn lỗi tràn viền** |
| **Hiển thị font chữ tiếng Việt** | Xảy ra hiện tượng nhảy chữ (FOUT/CLS) | Local WOFF2 subsets tải trước ngay lập tức | **Hiển thị mượt mà, CLS = 0.02** |
| **Khung nhìn máy tính để bàn ($1920\text{px}$)** | Nội dung bị dàn quá rộng | Giới hạn `max-w-7xl mx-auto px-6` chuẩn mực | **Bố cục sang trọng, cân đối** |
| **Chế độ màn hình cảm ứng** | Nút bấm nhỏ khó bấm | Tất cả vùng chạm $\ge 44 \times 44\text{px}$ | **Thao tác ngón tay chính xác** |

---

## 6. Kết luận
Hệ thống giao diện REACT-WebFashion vượt qua 100% bài kiểm tra hồi quy thị giác (Visual Regression). Không phát hiện bất kỳ lỗi lệch bố cục hay lỗi hiển thị nào trên cả 6 định dạng viewport phổ biến nhất hiện nay.
