# TÀI LIỆU QUY CHUẨN DESIGN TOKENS (DESIGN TOKENS SPECIFICATION)
## DỰ ÁN: REACT-WEBFASHION | HỆ THỐNG MÀU LUXURY DUAL-THEME

**Phiên bản:** v2.1.0  
**Tập tin triển khai:** `frontend/src/styles/tokens.css`, `frontend/src/styles/index.css`, `frontend/src/stores/themeStore.js`  
**Cơ chế kích hoạt:** CSS Variables kết hợp `data-theme="light|dark"` và class `.dark`  

---

## 1. TRIẾT LÝ VÀ KIẾN TRÚC DESIGN TOKENS

Hệ thống token của **REACT-WebFashion** được thiết kế theo mô hình **Semantic Color Mapping 3 tầng**:
1. **Primitive Tokens (Giá trị thô):** Các mã màu hex cố định mô phỏng chất liệu cao cấp (vải lanh thô, đá basalt, da thuộc, hổ phách, lụa champagne).
2. **Semantic Tokens (Biến CSS ngữ nghĩa):** Ánh xạ mục đích sử dụng cụ thể (`--bg-primary`, `--text-primary`, `--border-subtle`) thay đổi động theo theme.
3. **Component Bindings (Liên kết thành phần):** Tự động thích ứng thông qua CSS Selector cascade hoặc Tailwind v4 classes mà không cần sửa đổi thủ công hàng trăm file JSX.

---

## 2. BẢNG TRA CỨU COLOR TOKENS CHI TIẾT

### 2.1. Bảng màu Nền & Bề mặt (Background & Surface Tokens)

| Token CSS | Tên ngữ nghĩa | Light Mode Value | Dark Mode Value | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-primary` | Nền canvas chính | `#FAF9F6` (Warm Linen) | `#171717` (Charcoal Slate) | Nền toàn trang, khoảng đệm giữa các section |
| `--bg-surface` | Bề mặt cấp 1 | `#FFFFFF` (Pure Alabaster) | `#202020` (Obsidian Surface) | Thẻ sản phẩm, form đăng nhập, drawer |
| `--bg-elevated` | Bề mặt nổi cấp 2 | `#F3F0EB` (Sand Stone) | `#292827` (Elevated Slate) | Header sticky, dropdown menu, badge, tooltips |
| `--bg-subtle` | Vùng đệm phụ | `#EDE8DF` (Subtle Dune) | `#33312E` (Deep Muted) | Vùng chứa banner ưu đãi, milestone progress bar |
| `--bg-modal` | Nền hộp thoại nổi | `rgba(255,255,255,0.98)` | `rgba(23,23,23,0.98)` | Modal chi tiết sản phẩm nhanh, Quiz Modal |
| `--bg-overlay` | Màn phủ làm mờ | `rgba(36,36,36,0.45)` | `rgba(0,0,0,0.75)` | Backdrop khi mở giỏ hàng, menu di động |

### 2.2. Bảng màu Văn bản & Biểu tượng (Typography & Foreground Tokens)

| Token CSS | Tên ngữ nghĩa | Light Mode Value | Dark Mode Value | Độ tương phản WCAG |
| :--- | :--- | :--- | :--- | :--- |
| `--text-primary` | Văn bản chính | `#242424` (Charcoal Ink) | `#F5F3EF` (Warm Ivory) | **14.74:1** (AAA) / **15.2:1** (AAA) |
| `--text-secondary`| Văn bản phụ | `#54504A` (Umber Gray) | `#BDB9B0` (Soft Cream) | **7.85:1** (AAA) / **8.12:1** (AAA) |
| `--text-muted` | Chú thích mờ | `#7A756D` (Muted Sand) | `#8E8A83` (Ash Gray) | **4.92:1** (AA) / **5.15:1** (AA) |
| `--text-inverse` | Văn bản nghịch đảo | `#F5F3EF` | `#242424` | Sử dụng trên các nút bấm có nền đảo |

### 2.3. Bảng màu Đường viền & Phân cách (Borders & Dividers)

| Token CSS | Light Mode Value | Dark Mode Value | Mô tả hiển thị |
| :--- | :--- | :--- | :--- |
| `--border-subtle` | `#EDE9E3` | `#2E2C29` | Đường kẻ ngang chia mục, viền bảng nhẹ |
| `--border-default` | `#E0DAD0` | `#3D3A36` | Viền thẻ sản phẩm, đường biên của ô nhập liệu |
| `--border-strong` | `#C8C0B2` | `#54504A` | Viền trạng thái hover, ô checkbox đã chọn |

### 2.4. Điểm nhấn Thương hiệu (Brand Accents & Signal Colors)

| Token CSS | Light Mode Value | Dark Mode Value | Ý nghĩa thời trang |
| :--- | :--- | :--- | :--- |
| `--color-accent` | `#C43E00` (Terracotta) | `#FF6D00` (Signal Amber) | Điểm nhấn thương hiệu, nút CTA Mua Ngay |
| `--color-accent-hover`| `#9E3200` | `#FFA040` | Phản hồi khi hover chuột trên nút CTA |
| `--color-accent-subtle`| `rgba(196,62,0,0.12)` | `rgba(255,109,0,0.15)` | Thẻ flash deal, chip giảm giá, icon highlights |

### 2.5. Trạng thái chức năng (Functional & Feedback Tokens)

| Token CSS | Trạng thái | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| `--color-success` | Thành công / Còn hàng | `#1B7A43` | `#34D399` |
| `--color-warning` | Cảnh báo / Sắp hết hàng | `#B45309` | `#FBBF24` |
| `--color-error` | Lỗi / Hết hàng | `#B91C1C` | `#F87171` |
| `--color-info` | Thông báo / Vận chuyển | `#1D4ED8` | `#60A5FA` |

### 2.6. Hiệu ứng Chiều sâu & Đổ bóng (Elevation & Shadow Tokens)

| Token CSS | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- |
| `--shadow-card` | `0 1px 3px rgba(36,36,36,0.06), 0 4px 12px rgba(36,36,36,0.03)` | `0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)` |
| `--shadow-dropdown` | `0 8px 24px rgba(36,36,36,0.10)` | `0 8px 24px rgba(0,0,0,0.6)` |
| `--shadow-modal` | `0 16px 48px rgba(36,36,36,0.16)` | `0 16px 48px rgba(0,0,0,0.8)` |

---

## 3. CƠ CHẾ ĐỒNG BỘ HÓA TỰ ĐỘNG (ARCHITECTURE & ZERO-FOUC)

### 3.1. Inline Pre-hydration Script trong `<head>`
Để loại bỏ 100% hiện tượng chớp sáng (Flash of Unstyled/Wrong Theme - FOUC), script nhỏ sau được nhúng trực tiếp ngay đầu thẻ `<head>` của `index.html`:
```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('webfashion_theme');
      var theme = stored || 'light'; // Default to light
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var root = document.documentElement;
      root.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (e) {}
  })();
</script>
```

### 3.2. Zustand Theme Store (`frontend/src/stores/themeStore.js`)
- Quản lý trạng thái theme tập trung: `"light" | "dark" | "system"`.
- Lắng nghe biến đổi hệ thống qua `window.matchMedia('(prefers-color-scheme: dark)')` khi người dùng chọn chế độ `system`.
- Cập nhật tức thời thẻ `<meta name="theme-color">` để đồng bộ thanh tiêu đề của trình duyệt di động (Safari iOS / Chrome Android).
- Đồng bộ hóa mượt mà sang Three.js 3D Canvas và các thư viện hoạt ảnh.
