# HỆ THỐNG QUY CHUẨN CHUYỂN ĐỘNG THỜI TRANG (SIGNATURE MOTION SYSTEM)
## DỰ ÁN: REACT-WEBFASHION | PHASE 23 — HAUTE COUTURE MOTION DESIGN

**Chuyên viên thiết kế chuyển động (Senior Motion Designer):** Principal Creative Developer & GSAP Specialist  
**Tiêu chuẩn vật lý:** Cơ học xúc giác (Tactile), Nhịp lụa rơi (Silk Descent), Tối ưu GPU 60fps  
**Công nghệ:** GSAP 3.15 + `@gsap/react` 2.1 + CSS Transitions Hardware-Accelerated  
**Ngày phát hành:** 16/11/2026  

---

## 1. VẬT LÝ HỌC & CẢM XÚC CỦA CHUYỂN ĐỘNG MAY ĐO (THE PHYSICS OF COUTURE)

Chuyển động trong thời trang xa xỉ không giật cục như game bắn súng, cũng không dính bết như các trang thương mại phổ thông. Chuyển động của **REACT-WebFashion** được mô phỏng theo **Độ rơi của vải tơ tằm nguyên bản (Raw Silk Drape)**:
- **Khởi đầu dứt khoát, kết thúc êm ái:** Chuyển động bắt đầu nhanh để người dùng cảm nhận được sự phản hồi tức thời của hệ thống, sau đó giảm tốc êm ái nhờ đường cong gia tốc may đo `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Chỉ can thiệp trên Layer Composite (Transform & Opacity):** Tuyệt đối không animate các thuộc tính gây Layout Thrashing như `width`, `height`, `top`, `left` hay `margin`. Trình duyệt chỉ kích hoạt GPU Compositor, giữ trọn vẹn 60 khung hình/giây.

---

## 2. BẢNG MOTION TOKENS CHUẨN MỰC

### 2.1. Thang đo thời gian (Duration Scale)

| Token Thời Gian | Giá trị (ms) | Mục đích sử dụng | Hành vi thực tế |
| :--- | :---: | :--- | :--- |
| `--motion-instant` | **100ms** | Checkbox, switch, badge toggle | Phản hồi trạng thái ngay lập tức |
| `--motion-micro` | **180ms** | Button hover, icon rotation, link underline | Nhận biết con trỏ chuột lướt qua |
| `--motion-standard`| **280ms** | Card lift, dropdown menu, tooltip reveal | Mở rộng các khối giao diện nhỏ |
| `--motion-deliberate`| **420ms**| Drawer trượt vào, modal xuất hiện, cart dock | Chuyển đổi trạng thái giao diện lớn |
| `--motion-reveal` | **600ms** | Section scroll reveal, staggered grid loading | Xuất hiện các khối nội dung khi cuộn trang |
| `--motion-cinematic`| **850ms** | Three.js silk wave, hero entrance, editorial mask | Hiệu ứng chiến dịch nghệ thuật thương hiệu |

### 2.2. Đường cong gia tốc (Easing Curves)

| Tên Easing | Giá trị Cubic-Bezier / GSAP | Tính chất vật lý & Cảm giác |
| :--- | :--- | :--- |
| **`ease-couture`** | `cubic-bezier(0.16, 1, 0.3, 1)` | Lụa rơi: Tăng tốc cực nhanh rồi trôi nhẹ nhàng vào vị trí |
| **`ease-tactile`** | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Xúc giác nút cơ học: Dứt khoát, có độ đàn hồi cơ khí |
| **`ease-cinematic`**| `cubic-bezier(0.25, 1, 0.5, 1)` | Khung hình điện ảnh: Êm mượt, không giật góc |
| **`ease-mask`** | `cubic-bezier(0.77, 0, 0.175, 1)` | Mở màn chụp ảnh: Tạo cảm giác bóc tách lớp màn bí ẩn |

### 2.3. Bậc trễ phân tầng (Stagger Hierarchy)

| Nhóm phần tử | Khoảng cách trễ (Stagger Delay) | Thứ tự xuất hiện |
| :--- | :---: | :--- |
| **Chữ tiêu đề Hero (Oswald words)** | **60ms - 80ms** | Từ trái qua phải, trượt nhẹ $15px$ lên |
| **Lưới sản phẩm (Product Grid)** | **35ms - 50ms** | Xuất hiện so le theo cột và hàng |
| **Bộ lọc danh mục (Filter Chips)** | **20ms** | Trượt ngang nhẹ nhàng |
| **Danh sách đơn hàng (Order Cards)**| **40ms** | Xuất hiện từ trên xuống |

---

## 3. CƠ CHẾ CHUYỂN TRANG NGHỆ THUẬT (ADVANCED PAGE TRANSITION)

Để loại bỏ hoàn toàn hiện tượng chuyển route đột ngột (Hard Cut) trong React Router mà không làm chậm trải nghiệm mua sắm:
1. **Lớp màn che lụa mờ (Editorial Silk Veil):**
   - Khi điều hướng sang route mới, một lớp phủ mờ siêu mỏng với màu sắc tương thích theme (`rgba(250, 249, 246, 0.98)` trên Light và `rgba(23, 23, 23, 0.98)` trên Dark) kích hoạt trong **220ms**.
   - Cửa sổ cuộn tự động được thiết lập về đỉnh trang (`window.scrollTo({ top: 0, behavior: 'instant' })`).
   - Lớp màn lụa tự động mở ra trong **250ms**, để lộ nội dung của template mới được render sắc sảo.
2. **Không block luồng người dùng:**
   - Người dùng bấm nút Back/Forward của trình duyệt vẫn hoạt động bình thường, không bị kẹt trang.

---

## 4. QUY TẮC BẢO VỆ TIẾP CẬN (PREFERS-REDUCED-MOTION COMPLIANCE)

Tuân thủ nghiêm ngặt quy tắc F07 của Hallmark và tiêu chuẩn W3C WCAG 2.1:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
- Khi hệ điều hành của người dùng bật chế độ giảm chuyển động, toàn bộ hiệu ứng parallax, xoay 3D và trượt dài được tự động thay thế bằng hiệu ứng hiển thị tĩnh hoặc fade tức thời $50ms$, bảo đảm không gây chóng mặt hay khó chịu thị giác.

---

## 5. KẾT LUẬN

Hệ thống **Signature Motion System** của **REACT-WebFashion** không chỉ mang lại vẻ đẹp bóng bẩy hào nhoáng, mà là một ngôn ngữ chuyển động được tính toán công phu, đậm chất công nghệ và gắn liền với tinh thần may đo thủ công Haute Couture.
