# TỔNG HỢP CÁC THAY ĐỔI TRONG DESIGN SYSTEM (DESIGN SYSTEM CHANGES)

**Dự án:** `REACT-WebFashion`  
**Giai đoạn:** Phase 24 — Impeccable Full Website Review & Redesign  
**Thời gian cập nhật:** 16/11/2026  
**File nguồn ảnh hưởng:** `frontend/src/styles/tokens.css`, `frontend/src/styles/index.css`  

---

## 1. MỤC TIÊU CHUẨN HÓA THIẾT KẾ (DESIGN SYSTEM NORMALIZATION)

Theo chỉ dẫn của skill `impeccable`, một hệ thống thiết kế chuẩn mực phải kiểm soát chặt chẽ các thành phần giao diện từ cấp độ nguyên tử (atomic tokens), loại bỏ mã màu hardcode phân tán, kiểm soát độ dài dòng văn bản và làm chủ cả những bề mặt trình duyệt mặc định.

---

## 2. CHI TIẾT CÁC DESIGN TOKENS BỔ SUNG

### 2.1. Thước Đo Khối Chữ Đọc (Measure & Reading Constraints)
Tránh tình trạng các dòng văn bản trải quá dài gây mỏi mắt trên màn hình lớn (1920px) hoặc quá ngắn trên mobile:
- `--measure-prose: 68ch;` — Thước đo chuẩn mực cho bài viết, tôn chỉ thương hiệu, chính sách (`max-w-[68ch]`).
- `--measure-compact: 48ch;` — Thước đo cho lời dẫn giới thiệu, mô tả sản phẩm ngắn.

### 2.2. Kích Thước Nhập Liệu & Vùng Chạm (Ergonomics & Touch Targets)
- `--input-height: 48px;` — Chiều cao chuẩn cho các ô input form, đảm bảo ngón tay bấm chính xác trên thiết bị cảm ứng.
- `--input-height-sm: 40px;` — Chiều cao tinh gọn cho thanh tìm kiếm nhanh hoặc bộ lọc.
- `--touch-target-min: 44px;` — Vùng chạm tối thiểu đạt chuẩn tiếp cận WCAG 2.2 cấp độ AAA.

### 2.3. Bề Mặt Trình Duyệt Tùy Biến (Browser Surfaces)
Biến các thành phần mặc định của hệ điều hành thành một phần của bộ nhận diện thương hiệu Atelier:
- **Màu bôi đen chữ (`::selection`):**
  - Light Mode: `rgba(230, 81, 0, 0.18)` với màu chữ kế thừa tự nhiên.
  - Dark Mode: `rgba(230, 81, 0, 0.35)` với màu chữ trắng sáng `#FFFFFF`.
- **Màu con trỏ soạn thảo (`caret-color`):**
  - `--color-caret: #E65100;` (Sắc Signal Orange dứt khoát trên tất cả input/textarea).
- **Vòng nét tiêu điểm (`:focus-visible`):**
  - `--focus-ring-color: #E65100;`
  - `--focus-ring-offset: 2px;`
  - Đảm bảo hiển thị sắc nét khi người dùng điều hướng bằng bàn phím (Tab navigation).
- **Hiển thị số liệu dạng bảng (`tabular-nums`):**
  - Bổ sung quy tắc `font-variant-numeric: tabular-nums;` cho tất cả giá tiền, bảng thống kê và mã số để các con số thẳng hàng hoàn hảo theo cột.

---

## 3. BẢNG ĐỐI CHIẾU THAY ĐỔI CỤ THỂ

| Token / Quy Tắc | Giá Trị Trước Phase 24 | Giá Trị Chuẩn Hóa Phase 24 | Lợi Ích Trải Nghiệm |
| :--- | :--- | :--- | :--- |
| **`::selection`** | Mặc định trình duyệt (xanh dương) | `rgba(230,81,0,0.18)` ngà ấm | Thống nhất với nhận diện Atelier |
| **`caret-color`** | Đen/trắng mặc định | `#E65100` (Signal Orange) | Điểm nhấn tinh tế khi người dùng gõ phím |
| **`font-variant-numeric`** | Mặc định (proportional) | `tabular-nums` | Cột giá và số liệu thẳng hàng sắc sảo |
| **`--measure-prose`** | Không giới hạn (bị tràn rộng) | `68ch` | Tối ưu hóa nhịp đọc sách/tạp chí |
| **`--touch-target-min`** | Tùy biến phân tán | `44px` | Không bao giờ bấm trượt trên mobile |
| **Kickers / Eyebrows** | Lặp lại ở mọi section | Loại bỏ triệt để theo Craft Floor | Tiêu đề thanh thoát, không rập khuôn |

---

## 4. KẾT LUẬN

Hệ thống Design System của `REACT-WebFashion` giờ đây đạt độ hoàn thiện cao, tuân thủ nguyên tắc "Finish the job" của `impeccable`, sẵn sàng cho giai đoạn tinh chỉnh từng trang chuyên biệt.
