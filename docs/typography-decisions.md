# Typography Decisions & Standards — WebFashion (404Studio)

Tài liệu ghi lại các quyết định thiết kế và quy chuẩn Typography cho toàn bộ hệ thống front-end của WebFashion (404Studio).

---

## 1. Kiến trúc 2 họ Font duy nhất (Strict 2-Font System)

| Vai trò | Font Family | Trọng số nạp (Weights) | Fallback Font Stack |
| :--- | :--- | :--- | :--- |
| **Tiêu đề & Condensed** | `Oswald Variable` (`Oswald`) | 200 - 700 (Biến thể liên tục) | `"Arial Narrow", "Helvetica Neue Condensed", Impact, sans-serif` |
| **Giao diện & Văn bản** | `Plus Jakarta Sans Variable` (`Plus Jakarta Sans`) | 200 - 800 (Biến thể liên tục) | `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` |

### Quyết định & Rationale:
1. **Tự host font nội bộ (Self-hosted Fonts)**:
   - Sử dụng `@fontsource-variable/oswald` và `@fontsource-variable/plus-jakarta-sans`.
   - Gỡ bỏ hoàn toàn thẻ Google Fonts link và preconnect khỏi `index.html` để triệt tiêu tải kép (double loading), loại bỏ phụ thuộc mạng bên thứ ba, và đảm bảo dải ký tự `vietnamese` (U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9) luôn sẵn sàng ngay từ lần render đầu tiên.
2. **Quy định trọng số cho Oswald (200 - 700)**:
   - Font Oswald chuẩn chỉ hỗ trợ dải trọng số `200` đến `700`. Việc khai báo `800` (extrabold) hoặc `900` (black) trước đây đã khiến trình duyệt bật cơ chế "faux bold" (tô đậm nhân tạo), làm bết dính và biến dạng dấu tiếng Việt in hoa.
   - Toàn bộ các tiêu đề lớn trước đây dùng `font-extrabold` hoặc `font-black` kết hợp với `font-condensed` / `font-display` đã được chuẩn hóa về `font-bold` (700). Nét chữ đạt độ sắc nét quang học tối ưu.
3. **Loại bỏ triệt để font thứ 3 & gỡ bỏ `Geist`**:
   - Gỡ bỏ package `@fontsource-variable/geist` và xóa mọi tham chiếu rác.
   - Map `--font-serif: var(--font-sans)` trong `@theme inline` và chuyển đổi toàn bộ class `font-serif` trong JSX (Footer, Cart, Checkout, ProductCard, Admin...) sang `font-sans` hoặc `font-condensed` phù hợp ngữ cảnh, triệt tiêu hoàn toàn font Times New Roman / Georgia.

---

## 2. Quy chuẩn Line-Height & Diacritic Clearance cho Tiếng Việt

Các nguyên âm tiếng Việt in hoa có dấu hai tầng (như `Ắ, Ặ, Ẵ, Ẩ, Ổ, Ệ, Ứ, Ự`) đòi hỏi khoảng không gian phần trên (ascender) và phần dưới (descender) đủ rộng để không bị chạm mép hoặc bị cắt khi hiển thị.

| Loại văn bản | Kích cỡ | Line-height tối thiểu | Quy tắc đệm (Padding clearance) |
| :--- | :--- | :--- | :--- |
| **Tiêu đề Condensed in hoa (Oswald)** | Cỡ lớn (Desktop >= 48px) | `1.18` đến `1.2` | Thêm `py-[0.12em]` hoặc `py-[0.14em]` cho wrapper có `overflow: hidden` hoặc text reveal animation. |
| **Tiêu đề Condensed in hoa (Oswald)** | Cỡ vừa & Mobile (< 48px) | `1.2` đến `1.25` | `leading-[1.2]` sm:`leading-[1.25]` |
| **Tiêu đề Sans (Plus Jakarta Sans)** | 20px - 40px | `1.25` đến `1.375` | `leading-snug` (1.375) hoặc `leading-tight` (1.25) |
| **Văn bản thân (Body text)** | 14px - 18px | `>= 1.5` | `leading-normal` (1.5) hoặc `leading-relaxed` (1.625) |
| **Chữ số & Mã sản phẩm** | Mọi cỡ | `1.05` đến `1.2` | Kết hợp `tabular-nums` |

### Quy chuẩn Letter-Spacing (Tracking):
- Với chữ in hoa tiếng Việt có dấu, khoảng cách ký tự không được âm quá `-0.02em` (thay thế mức `-0.045em` cũ). Điều này ngăn ngừa dấu của các ký tự liền kề chạm vào nhau.

---

## 3. Quy chuẩn Thành phần Hệ thống & Form Controls

1. **Form Controls (`input`, `select`, `textarea`, `button`)**:
   - Tự động kế thừa `font-family: inherit` (`var(--font-sans)`).
   - Trên mobile (viewport <= 640px), font size của input được đặt tối thiểu `16px` để ngăn iOS Safari tự động phóng to (zoom in) màn hình khi focus.
2. **Hộp thoại SweetAlert2 (`swal2-*`)**:
   - `.swal2-popup`, `.swal2-html-container`, `.swal2-actions button` áp dụng `--font-sans`.
   - `.swal2-title` áp dụng `--font-display`, viết hoa và tracking rộng `0.04em`.
3. **Thông báo Toast & Toaster**:
   - Áp dụng font sans đồng bộ, không dùng font fallback hệ thống.
4. **Khung Chat 2 chế độ**:
   - Tiêu đề thương hiệu sử dụng `--font-condensed` in hoa, nội dung tin nhắn và ô nhập sử dụng `--font-sans`.
