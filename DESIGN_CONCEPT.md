# DESIGN_CONCEPT.md — Atelier Étoile: Archive / Signal Design System

Tài liệu thiết kế kiến trúc giao diện, ngôn ngữ thị giác, hệ thống Design Tokens và trải nghiệm người dùng toàn diện cho REACT-WebFashion.

---

## 1. Design Philosophy
Thiết kế theo trường phái **Monochrome Luxury Atelier & Contemporary Editorial**, kết hợp với tinh thần **Archive / Signal**. Tôn vinh vẻ đẹp của nghề may đo thủ công đương đại (Haute Tailoring), loại bỏ hoàn toàn các mô thức rườm rà, bóng bẩy rẻ tiền hay template thương mại điện tử công nghiệp đại trà. Giao diện ưu tiên tính trung thực của chất liệu vải, bố cục bất đối xứng có chủ đích, khoảng thở thị giác sâu và tương tác vi mô tinh tế.

## 2. Visual Direction
- **Chủ đề:** Editorial Fashion Archive meets High-Contrast Signal.
- **Tính cách:** Điềm tĩnh, dứt khoát, sắc sảo, tinh tế và đáng tin cậy.
- **Cấu trúc thị giác:** Khối mảng lớn đối xứng linh hoạt kết hợp đường chỉ kẻ tinh xảo (1px border), bề mặt nền xước mờ (subtle grain/tactile texture), phân cấp nội dung mạch lạc theo nguyên tắc "One section per screen" cho trải nghiệm khám phá trọn vẹn.

## 3. Brand Identity
- **Tên thương hiệu:** 404Studio Atelier / WebFashion.
- **Định vị:** Thời trang may đo đương đại cao cấp, tối giản đơn sắc, chế tác có giới hạn.
- **Thông điệp:** "Form follows structure — Pure tailoring for modern minds."

## 4. Color Palette
Toàn bộ màu sắc được định nghĩa bằng Design Tokens CSS tại `:root`, chia làm 2 bảng màu Dark (chính) và Light (hỗ trợ):
- **Ink Black (`--color-bg-primary`):** `#0c0c0e` — Nền tối sâu thẳm, không gây mỏi mắt.
- **Obsidian Dark (`--color-bg-surface`):** `#161619` — Bề mặt thẻ, thanh điều hướng và bảng điều khiển.
- **Bone / Alabaster (`--color-text-primary`):** `#f4f0e8` — Màu chữ chủ đạo, mềm mại và trang nhã.
- **Muted Steel (`--color-text-secondary`):** `#8e8d91` — Chữ phụ, nhãn thông số và đường dẫn thứ cấp.
- **Oxidized Orange Signal (`--color-accent-signal`):** `#e65100` — Điểm nhấn tín hiệu năng động, tạo sự chú ý có chủ đích.
- **Cobalt Deep (`--color-accent-cobalt`):** `#2563eb` — Điểm nhấn kỹ thuật số tinh tế cho các liên kết và trạng thái.
- **Acid Lime (`--color-accent-lime`):** `#84cc16` — Điểm báo trạng thái còn hàng (in-stock) hoặc voucher mới.
- **Border Hairline (`--color-border`):** `rgba(244, 240, 232, 0.12)` — Đường kẻ viền 1px mỏng mảnh đặc trưng của bản vẽ may đo.

## 5. Typography Scale
Sử dụng 2 họ font chữ tương phản bổ trợ:
- **Display Face:** `Oswald`, sans-serif (Condensed Display, in hoa dứt khoát, ấn tượng cho tiêu đề lớn).
- **Interface & Body Face:** `Plus Jakarta Sans`, sans-serif (Geometric, rõ ràng, dễ đọc trên mọi kích thước màn hình).

| Token | Kích thước | Line Height | Letter Spacing | Font & Weight | Ứng dụng |
|---|---|---|---|---|---|
| `--text-display-xl` | 72px / 4.5rem | 1.05 | -0.02em | Oswald 700 | Hero Banner, Tiêu đề chính trang |
| `--text-display-lg` | 48px / 3.0rem | 1.1 | -0.01em | Oswald 600 | Tiêu đề các Section lớn |
| `--text-heading-md` | 32px / 2.0rem | 1.2 | 0 | Oswald 500 | Tiêu đề khối, Tên sản phẩm chính |
| `--text-heading-sm` | 24px / 1.5rem | 1.3 | 0 | Plus Jakarta Sans 600 | Thẻ sản phẩm, Tiêu đề Modal |
| `--text-body-lg` | 18px / 1.125rem | 1.5 | 0 | Plus Jakarta Sans 400 | Đoạn văn mở đầu, Lời dẫn |
| `--text-body` | 15px / 0.9375rem | 1.6 | 0 | Plus Jakarta Sans 400 | Nội dung văn bản chính, Mô tả |
| `--text-caption` | 13px / 0.8125rem | 1.4 | +0.01em | Plus Jakarta Sans 500 | Nhãn bảng, Thông số kỹ thuật, Giá phụ |
| `--text-micro` | 11px / 0.6875rem | 1.3 | +0.02em | Plus Jakarta Sans 600 | Tag trạng thái, Badge số lượng |

## 6. Spacing System
Hệ thống khoảng cách căn bản dựa trên bội số của 4px / 8px:
- `space-1`: 4px | `space-2`: 8px | `space-3`: 12px | `space-4`: 16px
- `space-6`: 24px | `space-8`: 32px | `space-12`: 48px | `space-16`: 64px | `space-24`: 96px | `space-32`: 128px

## 7. Grid System
- **Desktop (>= 1440px):** Hệ thống lưới 12 cột, `max-width: 1440px` căn giữa, lề hai bên (gutters) tối thiểu 48px.
- **Tablet (768px - 1024px):** Lưới 8 cột, gutters 32px.
- **Mobile (390px - 430px):** Lưới 4 cột, gutters 16px, thẻ sản phẩm hiển thị dạng 2 cột hoặc thẻ ngang cuộn mượt.

## 8. Border Radius
Tôn trọng đường nét thẳng và góc vuông của kiến trúc may đo:
- `radius-none`: 0px — Các nút hành động chính, thẻ sản phẩm, khung hình ảnh nghệ thuật.
- `radius-sm`: 4px — Hộp thoại input, thẻ tag danh mục.
- `radius-md`: 8px — Modal overlay, dropdown menu, ngăn kéo drawer.
- `radius-full`: 9999px — Nút tròn icon, chip trạng thái nhỏ.

## 9. Shadows
Hạn chế bóng đổ lòe loẹt; sử dụng ánh sáng viền tinh tế (rim light) và bóng đổ khuếch tán mềm:
- `shadow-subtle`: `0 2px 8px rgba(0, 0, 0, 0.4)`
- `shadow-elevated`: `0 12px 32px rgba(0, 0, 0, 0.6)`
- `shadow-signal`: `0 0 24px rgba(230, 81, 0, 0.25)` — Cho các phần tử được kích hoạt hoặc nhấn mạnh.

## 10. Design Tokens
Được định nghĩa tập trung trong `frontend/src/styles/tokens.css` và kế thừa trực tiếp vào cấu hình Tailwind CSS, đảm bảo không có mã màu hay kích thước font viết cứng rải rác ngoài token.

## 11. Desktop Layout (1440 x 900)
- Thanh điều hướng (Header) dải ngang cố định tinh tế với logo tối giản, menu bộ sưu tập, thanh tìm kiếm kích hoạt nhanh và chỉ báo giỏ hàng.
- Hero chiếm trọn màn hình đầu tiên (`h-[90svh]`), hiển thị tiêu đề khổ lớn bên cạnh khung canvas 3D sóng vải Atelier tương tác chuột.
- Khối sản phẩm dạng lưới Editorial lệch nhịp (Asymmetric masonry grid) kích thích thị giác.

## 12. Tablet Layout (768 x 1024)
- Thanh tìm kiếm chuyển thành icon kích hoạt drawer.
- Danh mục sản phẩm chuyển thành thanh trượt ngang có snap nhẹ nhàng.
- Bố cục chi tiết sản phẩm sắp xếp theo trục dọc: ảnh chính trên, bảng thông số và nút mua dính đáy màn hình khi cuộn.

## 13. Mobile Layout (390 x 844)
- Thanh điều hướng thu gọn với nút Hamburger trượt mở menu toàn màn hình.
- Nút giỏ hàng và đặt mua luôn dễ dàng chạm bằng ngón tay cái (`min-h-[44px]`).
- Bắt buộc kiểm tra `overflow-x: clip`, không bao giờ để xảy ra cuộn ngang trang.

## 14. Component Architecture
Tổ chức thư mục theo tiêu chuẩn Component-Driven & Feature-Based:
```text
src/
  components/
    ui/          # Button, Input, Modal, Drawer, Skeleton, Badge, Card
    layout/      # Header, Footer, AdminSidebar, AdminHeader, StoreLayout, AdminLayout
    shared/      # ProductCard, VariantSelector, EmptyState, ErrorBoundary
  features/
    products/    # ProductGrid, ProductFilters, ProductGallery
    cart/        # CartDrawer, CartItemRow, CartSummary
    checkout/    # ShippingForm, PaymentSelector, OrderReview
    admin/       # MetricCard, RevenueChart, DataTable, StatusBadge
    ai/          # AiAssistantModal, RecommendationRail
```

## 15. Motion Language
- Áp dụng thư viện GSAP cho toàn bộ chuyển động quan trọng.
- Thời lượng chuyển động từ `0.25s` đến `0.6s`, sử dụng đường cong giảm tốc tự nhiên `power2.out` hoặc `expo.out`.
- Không lạm dụng hiệu ứng gây chóng mặt; mọi chuyển động đều có ý nghĩa định hướng luồng chú ý.

## 16. Scroll Behavior
- Cuộn mượt mà với quán tính tự nhiên.
- Kỹ thuật cuộn ghim (pinning) cho các chương kể chuyện Lookbook.
- Tự động nhớ vị trí cuộn khi điều hướng trang.

## 17. Page Transitions
- Hiệu ứng xuất hiện trang nhẹ nhàng thông qua điều chỉnh `opacity` và `transform: translateY(12px) -> 0`.
- Không khóa giao diện hay gây giật layout trong quá trình tải dữ liệu.

## 18. Hover Interactions
- Thẻ sản phẩm: Nâng nhẹ 2px (`translateY(-2px)`), ảnh thời trang zoom nhẹ 1.02x bên trong khung ảnh có `overflow: hidden`, tự động hiện ảnh góc chụp thứ hai.
- Nút bấm: Đổi màu nền tương phản dứt khoát, scale 0.98 khi ấn chuột (`active:scale-98`).

## 19. 3D Usage
- Chỉ sử dụng Three.js / WebGL trên màn hình Hero trang chủ để tạo hiệu ứng vải lụa Atelier Silk / Signal Fabric mềm mại uốn lượn theo con trỏ chuột.
- Giới hạn pixel ratio `<= 2`, bật tắt requestAnimationFrame tự động khi tab không hoạt động (Page Visibility API).
- Fallback mượt mà bằng CSS Mesh Gradient nếu trình duyệt không có WebGL. Tuyệt đối không nhúng 3D vào trang Giỏ hàng và Thanh toán.

## 20. Accessibility (a11y)
- Đạt chuẩn WCAG 2.2 AA về độ tương phản chữ và nền.
- Mọi phần tử tương tác đều hỗ trợ bàn phím (`Tab`, `Enter`, `Space`, `Escape`).
- Focus ring nhìn thấy rõ ràng ngay lập tức (`outline: 2px solid var(--color-accent-signal)`).
- Tôn trọng thuộc tính hệ thống `prefers-reduced-motion: reduce`.

## 21. Performance Budgets
- First Contentful Paint (FCP) < 1.2s.
- Largest Contentful Paint (LCP) < 2.2s.
- Cumulative Layout Shift (CLS) < 0.05.
- Code-splitting tự động qua dynamic import cho các trang Admin, biểu đồ ECharts và thư viện Three.js.

## 22. Requirement Conflict Resolutions
- **Bố cục Hero:** Khi yêu cầu giữa phong cách tối giản đơn sắc và điểm nhấn công nghệ có sự va chạm, giải pháp là giữ nền màu tối mực trang nhã, kết hợp với các đường chỉ cam tín hiệu (Signal Orange) và vải lụa số 3D làm điểm sáng nghệ thuật.
- **Trải nghiệm Admin vs Khách hàng:** Khách hàng sử dụng giao diện Persuade giàu cảm xúc hình ảnh; Admin sử dụng giao diện Operate sắc nét, tối đa mật độ dữ liệu, dễ dàng tra cứu và xử lý hàng trăm đơn hàng mỗi ngày.
