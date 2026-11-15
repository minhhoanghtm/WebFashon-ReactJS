# ĐẶC TẢ HỆ THỐNG THIẾT KẾ & CONCEPT THƯƠNG HIỆU THỜI TRANG
## ATELIER ÉTOILE — HAUTE ARCHITECTURE & QUIET LUXURY

**Phiên bản:** 2.0.0  
**Tác giả:** Senior Frontend Engineer & UI/UX Designer  
**Tiêu chuẩn áp dụng:** `taste-skill`, `hallmark`, `impeccable`, `scroll-craft`, `gsap-*`, `threejs-*`

---

## 1. TRIẾT LÝ THƯƠNG HIỆU & ĐỊNH VỊ (Brand Philosophy)

**ATELIER ÉTOILE** là nhà mốt thời trang đương đại, giao thoa giữa **nghệ thuật may đo chuẩn mực (Haute Couture)** và **tinh thần kiến trúc tối giản (Architectural Minimalism)**.
- **Tuyên ngôn:** *"Trang phục không chỉ là vải vóc, mà là không gian sống di động của cá tính."*
- **Đối tượng khách hàng:** Những cá nhân yêu thích sự thanh lịch tinh tế, trân trọng chất liệu tự nhiên cao cấp (Linen mộc, Lụa Mulberry, Dạ Cashmere, Cotton hữu cơ), tìm kiếm những phom dáng vượt thời gian thay vì trào lưu mì ăn liền.
- **Phong cách thị giác (Visual Language):** Anti-slop. Loại bỏ hoàn toàn các layout template thương mại điện tử đại trà, rực rỡ rẻ tiền. Sử dụng typography ấn tượng, khoảng trắng hào phóng (generous negative space), lưới thiết kế chặt chẽ, hình ảnh chân thực với tỷ lệ vàng và chuyển động mượt mà như dòng chảy của lụa.

---

## 2. BẢNG MÀU THIẾT KẾ (Color Tokens & Palette)

Hệ thống token màu được định nghĩa chuẩn xác tại `:root` và tích hợp với Tailwind CSS:

```css
:root {
  /* Nền chủ đạo */
  --color-canvas-light: #FBFBF9;       /* Alabaster Warm Chalk */
  --color-canvas-card: #FFFFFF;        /* Pure White Paper */
  --color-canvas-muted: #F2F1ED;       /* Muted Pebble */
  --color-canvas-subtle: #E8E7E1;      /* Whisper Gray */
  
  /* Nền Cinematic & Dark Moments */
  --color-canvas-dark: #0A0A0C;        /* Deep Obsidian Noir */
  --color-canvas-dark-card: #141418;   /* Elevated Slate */
  --color-canvas-dark-border: rgba(255, 255, 255, 0.08);

  /* Văn bản (Text Hierarchy) */
  --color-text-primary: #121316;       /* Soft Black Ink */
  --color-text-secondary: #5A5A62;     /* Editorial Charcoal */
  --color-text-muted: #8E8D96;         /* Stone Gray */
  --color-text-inverse: #F8F8F6;       /* Off-White */
  --color-text-inverse-muted: #A1A1AA; /* Light Muted */

  /* Màu thương hiệu & Điểm nhấn (Accents) */
  --color-brand-accent: #C5A880;       /* Brushed Champagne Gold */
  --color-brand-accent-hover: #B39266;
  --color-brand-contrast: #121316;     /* Anchor Pure Noir */

  /* Trạng thái nghiệp vụ (Functional States) */
  --color-sale-accent: #9E2A2B;        /* Editorial Burgundy / Carmine Red */
  --color-sale-subtle: #FDF2F2;
  --color-success: #2D6A4F;            /* Forest Pine */
  --color-success-bg: #EBF5F0;
  --color-warning: #B7791F;            /* Warm Amber */
  --color-error: #C53030;              /* Pure Brick Red */

  /* Đường viền & Đổ bóng (Borders & Elevation) */
  --border-color-light: rgba(18, 19, 22, 0.08);
  --border-color-medium: rgba(18, 19, 22, 0.15);
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-float: 0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03);
  --shadow-elevated: 0 20px 48px -8px rgba(0, 0, 0, 0.14);
}
```

---

## 3. NGHỆ THUẬT CHỮ (Typography Hierarchy)

- **Tiêu đề trưng bày (Display & Headings):**  
  `Oswald Variable` kết hợp phong cách Editorial Typography hoa lệ.  
  Tỷ lệ: H1 (56px – 84px, tracking -0.02em), H2 (36px – 48px), H3 (22px – 28px). Chữ hoa tinh tế, mạnh mẽ mang nét kiến trúc.
- **Thân bài & Thông tin mua sắm (Body & UI):**  
  `Plus Jakarta Sans Variable` — hình học cân xứng, khoảng cách chữ tối ưu đọc nhanh giá tiền, mô tả chất liệu vải và các thông số kích cỡ size.
- **Thông tin kỹ thuật & Mã vận đơn (Monospace):**  
  `SF Mono`, `JetBrains Mono` cho mã đơn hàng, SKU sản phẩm, tracking code.

---

## 4. CHIẾN LƯỢC CHUYỂN ĐỘNG & CUỘN TRANG (Motion & Scroll-Craft)

1. **Nhịp điệu cuộn (Scroll Rhythm):**
   - Không giật khựng (zero scroll-jank). Tích hợp Lenis Smooth Scroll kết hợp GSAP ScrollTrigger.
   - Các section chuyển tiếp tự nhiên, không dùng animation quá lố khiến người dùng xao lãng việc mua sắm.
2. **Vi tương tác (Micro-interactions):**
   - **Card sản phẩm:** Khi hover, ảnh zoom nhẹ `1.03x` với hiệu ứng vignette mềm; nút bấm phụ/yêu thích trượt êm từ cạnh dưới lên.
   - **Nút bấm (Buttons):** Hiệu ứng `scale: 0.98` khi bấm (`active:scale-[0.98]`), hover đổ bóng tinh tế và vệt sáng viền vàng champagne.
   - **Chuyển trang (Page Transition):** Fade mượt mà và trượt dọc 10px trong `0.35s` (`ease-out`).
3. **Tuân thủ chuẩn tiếp cận:**
   - Khi hệ điều hành kích hoạt `prefers-reduced-motion: reduce`, toàn bộ hiệu ứng parallax, di chuyển 3D và trượt layout tự động chuyển sang hiển thị tĩnh tức thì.

---

## 5. ĐIỂM NHẤN 3D THỜI TRANG (Three.js Tactile Fabric Canvas)

- **Vị trí áp dụng:** Banner Hero của trang chủ (`/`) và khu vực Lookbook đỉnh cao (`/lookbooks`).
- **Concept:** **"Floating Silk Canvas" (Dải lụa kỹ thuật số trôi dạt)**:
  - Một lưới vải 3D (PlaneGeometry with custom wave vertex displacement) mô phỏng sợi tơ lụa mềm mại lượn sóng trong gió thoảng.
  - Phản hồi mượt mà với tọa độ chuột của người dùng (Raycasting & subtle mouse lerping).
  - Tối ưu hiệu năng:
    - Lazy-loaded động: Chỉ khởi tạo khi component vào màn hình.
    - Dừng render loop (`cancelAnimationFrame`) khi người dùng cuộn khỏi Hero hoặc chuyển tab trình duyệt.
    - Fallback nhẹ tự động bằng gradient ảnh nền haute couture nếu trình duyệt không hỗ trợ WebGL.

---

## 6. HỆ THỐNG COMPONENT DÙNG CHUNG (Core Design System)

1. **`AtelierHeader`:** Header cố định mượt mà (sticky with blur backdrop `backdrop-blur-md bg-white/85`), logo thương hiệu đối xứng, giỏ hàng đếm số lượng trực tiếp, tìm kiếm nhanh và menu dạng slide panel.
2. **`AtelierFooter`:** Bố cục 4 cột cân xứng với thông điệp triết lý thương hiệu, liên kết chính sách minh bạch, kênh hỗ trợ và đăng ký nhận bản tin thời trang độc quyền.
3. **`ProductCard`:** Hiển thị ảnh sản phẩm tỷ lệ `3:4` chuẩn lookbook thời trang quốc tế, badge giảm giá thêu dệt tinh tế, tên sản phẩm kiểu serif/condensed và mức giá định dạng VNĐ chuẩn xác.
4. **`Badge` & `StatusIndicator`:** Badge trạng thái đơn hàng (Chờ xác nhận, Đang vận chuyển, Hoàn tất, Hủy) dùng gam màu pastel sang trọng.
5. **`Button`:** Các biến thể `primary` (Noir Onyx viền vàng), `secondary` (viền mảnh tinh xảo), `ghost`, `danger` (Đỏ Burgundy sang trọng).
6. **`EmptyState` & `SkeletonLoader`:** Từng trang đều có khung chờ tải mềm mại (shimmer pulse màu phấn be) và giao diện giỏ hàng/yêu thích trống đầy cảm hứng mua sắm.
