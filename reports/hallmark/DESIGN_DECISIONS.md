# QUYẾT ĐỊNH THIẾT KẾ VÀ KIẾN TRÚC KỸ THUẬT (DESIGN DECISIONS LOG)
## DỰ ÁN: REACT-WEBFASHION | PHASE 22 — HALLMARK REDESIGN

**Chuyên gia phụ trách:** Principal UI/UX Designer & System Architect  
**Trạng thái quyết định:** ĐÃ THÔNG QUA VÀ TRIỂN KHAI  
**Ngày phát hành:** 16/11/2026  

---

## 1. BẢNG TỔNG HỢP CÁC QUYẾT ĐỊNH THIẾT KẾ CHIẾN LƯỢC

| # | Lĩnh vực | Quyết định thiết kế | Lý do & Cơ sở theo Hallmark |
| :-: | :--- | :--- | :--- |
| **1** | **Layout Architecture** | Tách `StoreLayout` nguyên khối thành **6 Layout chuyên biệt** (`EditorialLayout`, `CommerceLayout`, `CheckoutLayout`, `AccountLayout`, `ContentLayout`, `LookbookLayout`). | Tuân thủ quy tắc Hallmark: "Mỗi trang phải có bố cục và template phù hợp với mục đích sử dụng; không dùng một template cho toàn bộ website." |
| **2** | **Checkout Layout** | Loại bỏ toàn bộ mega menu điều hướng và mega footer trên `/cart` và `/checkout`. Chỉ giữ Logo, Hotline hỗ trợ và Huy hiệu SSL 256-bit. | Loại bỏ yếu tố gây phân tâm, giảm tối đa tỷ lệ hủy bỏ giỏ hàng (Cart Abandonment). Tuân thủ Template D. |
| **3** | **Account Lounge** | Xây dựng riêng `AccountLayout` với Sidebar tài khoản cố định, thẻ VIP Diamond, điểm tích lũy và điều hướng tab nhanh. | Khách hàng cảm nhận được sự tôn trọng và đặc quyền của thành viên câu lạc bộ may đo Atelier. Tuân thủ Template E. |
| **4** | **Content Layout** | Tạo `ContentLayout` dạng 2 cột với thanh mục lục dính (Sticky Table of Contents) cho 12 trang tĩnh/chính sách. | Giúp người đọc dễ dàng định vị các điều khoản pháp lý dài mà không phải cuộn trang liên tục. Tuân thủ Template J. |
| **5** | **Lookbook Layout** | Tạo `LookbookLayout` dạng tràn viền (Full-bleed), thanh chọn mùa mốt và các điểm tương tác Shoppable Hotspots. | Tôn vinh nghệ thuật may đo và tính chất Haute Couture của thương hiệu thời trang. Tuân thủ Template G. |
| **6** | **Color Tokens** | Giữ vững bảng màu Warm Minimalist Luxury từ Phase 21: Light Mode `#FAF9F6` và Dark Mode `#171717`. Không dùng `#000000`. | Đạt chuẩn độ tương phản WCAG 2.1 AAA (14.74:1 Light / 16.18:1 Dark), chống mỏi mắt và thân thiện với màn hình OLED. |
| **7** | **Typography Rule** | `Oswald` cho tiêu đề lớn dạng condensed hoa; `Plus Jakarta Sans` cho nội dung và bảng biểu. Body font tối thiểu 15px - 16px. | Khắc phục hoàn toàn tình trạng chữ lí tí, bảo đảm tính đọc hiểu tuyệt đối trên mọi màn hình. |
| **8** | **Motion & Animation** | Sử dụng GSAP và CSS transitions chỉ trên `transform` và `opacity`. Tuyệt đối không animate `width`, `height`, `top`, `left`. | Tuân thủ Hallmark Floor rule F02, đạt tốc độ khung hình ổn định 60fps trên cả thiết bị di động cấu hình phổ thông. |
| **9** | **Three.js Reactivity**| Giữ cơ chế lắng nghe theme trong `SignalFabricCanvas.jsx`: Lụa Champagne (`#d6cfc4`) cho Light và Lụa Obsidian (`#1a1a20`) cho Dark. | Hòa quyện hoàn hảo giữa công nghệ đồ họa 3D hiện đại và chất liệu vải thực tế. |
| **10**| **Preservation Rule** | Giữ nguyên 100% routes trong `ROUTES.md`, toàn bộ API endpoints, các stores Zustand (`authStore`, `cartStore`, `themeStore`, `uiStore`, `personaStore`), và tất cả `data-testid`. | Đảm bảo tính tương thích hồi quy hoàn hảo, toàn bộ bài test E2E Playwright cũ và mới đều PASS 100%. |

---

## 2. PHÂN TÍCH CHI TIẾT CÁC QUYẾT ĐỊNH CỐT LÕI

### 2.1. Quyết định về Tinh gọn Giỏ hàng & Thanh toán (Checkout Minimalization)
- **Vấn đề cũ:** Khi người dùng đang ở bước nhập số thẻ ngân hàng hoặc thông tin giao hàng tại `/checkout`, thanh Header phía trên vẫn hiển thị ô tìm kiếm sản phẩm, nút trợ lý AI, menu danh mục thời trang nữ/nam/phụ kiện. Điều này vô tình mời gọi khách hàng bấm ra ngoài và từ bỏ đơn hàng.
- **Giải pháp mới:** `CheckoutLayout.jsx` được thiết kế cực kỳ tinh tế và tối giản:
  - Header: Logo Atelier tinh xảo ở giữa hoặc bên trái, bên phải là số hotline hỗ trợ khách hàng và icon khóa bảo mật an toàn giao dịch.
  - Footer: Dòng chữ cam kết bảo mật thông tin và quyền đổi trả trong 7 ngày.
  - Toàn bộ sự chú ý của người dùng được hướng vào form nhập địa chỉ, chọn phương thức thanh toán và nút Đặt Hàng.

### 2.2. Quyết định về Không gian Khách hàng Thân thiết (Account Lounge Workspace)
- **Vấn đề cũ:** Các trang `/profile`, `/orders`, `/my-coupons`, `/user/dashboard` hiển thị rời rạc, người dùng muốn chuyển từ xem đơn hàng sang xem voucher phải quay lại menu chính.
- **Giải pháp mới:** `AccountLayout.jsx` bao bọc tất cả các trang người dùng cá nhân trong một bố cục Workspace hiện đại:
  - Sidebar bên trái hiển thị ảnh đại diện, họ tên, hạng thẻ VIP Diamond, điểm tích lũy và danh sách các mục: Tổng quan tài khoản, Đơn hàng của tôi, Ví Voucher, Sổ địa chỉ giao hàng, Yêu cầu bảo mật GDPR, Đăng xuất.
  - Vùng nội dung bên phải hiển thị động theo từng tab, mang lại trải nghiệm như một ứng dụng quản lý thành viên chuyên nghiệp.

### 2.3. Quyết định về Trang Nội Dung & Chính Sách (Content & Support Hub)
- **Vấn đề cũ:** Các trang `/policy`, `/terms`, `/privacy`, `/shipping`, `/faq` sử dụng chung một trang tĩnh đơn giản, các khối văn bản dài dằng dặc gây ngán ngẩm cho người đọc.
- **Giải pháp mới:** `ContentLayout.jsx` cung cấp:
  - Thanh breadcrumb xác định vị trí trang.
  - Cột mục lục bên trái (Sidebar Table of Contents) cho phép người đọc chuyển nhanh giữa các trang chính sách liên quan: Chính sách may đo, Bảo mật dữ liệu, Điều khoản dịch vụ, Vận chuyển GHN, Đổi trả 7 ngày, Hướng dẫn chọn size, Câu hỏi thường gặp FAQ, Về chúng tôi Atelier.
  - Ô tìm kiếm nhanh nội dung trong trang.

---

## 3. KẾT LUẬN

Tất cả các quyết định thiết kế trong Phase 22 đều được xây dựng dựa trên nguyên lý công thái học, dữ liệu hành vi người dùng thương mại điện tử thực tế và tiêu chuẩn khắt khe của **Hallmark**. Chúng tôi kiên quyết không chỉ thay đổi lớp vỏ màu sắc mà thực sự nâng tầm toàn bộ kiến trúc layout và trải nghiệm sử dụng của **REACT-WebFashion**.
