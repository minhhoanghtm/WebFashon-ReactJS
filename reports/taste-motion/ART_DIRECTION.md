# ĐỊNH HƯỚNG NGHỆ THUẬT & BẢN SẮC THƯƠNG HIỆU (ART DIRECTION SPECIFICATION)
## DỰ ÁN: REACT-WEBFASHION | PHASE 23 — EDITORIAL LUXURY FASHION

**Giám đốc nghệ thuật (Art Director):** Principal Creative Developer & UI/UX Architect  
**Triết lý chủ đạo:** **Editorial Fashion × Modern Luxury × Contemporary Digital Experience**  
**Quy chuẩn tham chiếu:** `taste-skill` v2.5.1, `hallmark` v2.0.0, `impeccable` v4.9.1  
**Ngày phát hành:** 16/11/2026  

---

## 1. TUYÊN NGÔN NGHỆ THUẬT (THE CREATIVE MANIFESTO)

> *"Thời trang may đo đương đại không bao giờ là sự ồn ào phô trương. Nó là sự chuẩn xác đến từng milimét của đường chỉ, là độ rơi tự nhiên của tơ lụa trên cơ thể, và là sự tĩnh lặng đầy kiêu hãnh của những chất liệu thuần khiết."*

Trong kỷ nguyên số, một website thời trang cao cấp không được phép giống như một siêu thị điện tử hay một bảng dashboard khô khan. **REACT-WebFashion** được định hình như một **Sàn Diễn May Đo Kỹ Thuật Số (Digital Runway & Atelier Archive)**:
- **Tĩnh nhưng không chết (Stillness with Pulse):** Mỗi khung hình mang tính nhiếp ảnh tạp chí tĩnh lặng, nhưng luôn ẩn chứa chuyển động vi mô (nhịp thở của vải lụa 3D, độ nhấc nhẹ của thẻ sản phẩm, ánh sáng lướt qua sợi len).
- **Vật liệu chân thực (Honest Materiality):** Màu sắc và bề mặt mô phỏng các vật liệu tự nhiên cao cấp: Vải lanh mộc (Raw Linen), Đá nham thạch (Basalt Stone), Lụa ngà Champagne (Ivory Silk), và Hổ phách tín hiệu (Signal Amber).
- **Nhịp điệu không gian bất đối xứng (Asymmetric Visual Rhythm):** Phá bỏ hoàn toàn các khung lưới chia đều cứng nhắc, tạo nhịp thở thị giác bằng các khoảng trắng hào phóng và bố cục tỷ lệ vàng.

---

## 2. BẢNG MÀU & VẬT LIỆU XÚC GIÁC (TACTILE PALETTE)

### 2.1. Light Mode — Ánh Sáng Showroom Ban Ngày (Alabaster Warm Linen)
- **Nền chính `--bg-primary`:** `#FAF9F6` (Alabaster Linen) — Tông màu vải lanh tự nhiên ấm áp, không gây chói mắt.
- **Bề mặt thẻ `--bg-surface`:** `#FFFFFF` (Pure Alabaster) — Sắc nét, thanh khiết, làm nền hoàn hảo cho ảnh sản phẩm.
- **Bề mặt nổi `--bg-elevated`:** `#F3F0EB` (Sand Stone) — Dành cho header kính mờ, dropdown menu và các khối ghi chú.
- **Màu chữ chính `--text-primary`:** `#242424` (Charcoal Ink) — Màu mực than in ấn tạp chí cao cấp, độ tương phản **14.74:1** (WCAG AAA).
- **Màu điểm nhấn `--color-accent`:** `#C43E00` (Terracotta Amber) — Tông màu đất nung ấm áp của các xưởng may thủ công châu Âu.

### 2.2. Dark Mode — Không Gian Atelier Ban Đêm (Obsidian Warm Slate)
- **Nền chính `--bg-primary`:** `#171717` (Charcoal Slate) — Dải than đá ấm áp, **loại bỏ 100% màu đen thuần `#000000`** để tránh lóa mắt và nhòe màn hình OLED.
- **Bề mặt thẻ `--bg-surface`:** `#202020` (Obsidian Surface) — Bề mặt đá nham thạch mịn màng, phân tầng chiều sâu tinh tế.
- **Bề mặt nổi `--bg-elevated`:** `#292827` (Elevated Slate) — Dành cho header, modal nổi và các widget chỉ số.
- **Màu chữ chính `--text-primary`:** `#F5F3EF` (Warm Ivory) — Trắng ngà dịu mắt, độ tương phản **16.18:1** (WCAG AAA).
- **Màu điểm nhấn `--color-accent`:** `#FF6D00` (Luminous Amber) — Ánh đèn hổ phách chiếu rọi trên sàn diễn thời trang đêm.

---

## 3. NGUYÊN TẮC TYPOGRAPHY: TƯƠNG PHẢN ĐƯƠNG ĐẠI (TYPOGRAPHIC CADENCE)

1. **Tiêu đề lớn (Display Headings):**
   - Phông chữ: `Oswald`, sans-serif (Condensed).
   - Đặc tính: Viết in hoa (Uppercase), trọng số bold/semi-bold dứt khoát, tracking hẹp nhẹ $-0.01em$ đến $-0.02em$.
   - Kích thước: $48px - 72px$ trên Desktop, $32px - 40px$ trên Mobile.
   - Vai trò: Gây ấn tượng thị giác mạnh mẽ ngay từ frame đầu tiên.
2. **Nội dung văn bản (Body & Interface):**
   - Phông chữ: `Plus Jakarta Sans`, sans-serif (Geometric).
   - Đặc tính: Dáng chữ hình học thanh lịch, độ mở lớn (large x-height), hỗ trợ dấu tiếng Việt chuẩn xác $100\%$.
   - Kích thước: $15px - 16px$, dãn dòng $1.65 - 1.7$ thoáng đãng.
   - Vai trò: Đem lại trải nghiệm đọc thư thái, tự nhiên như đọc sách nghệ thuật.

---

## 4. 10 ĐIỀU CẤM KỴ TUYỆT ĐỐI (ANTI-SLOP DIRECTIVES)

Để giữ vững vị thế thương hiệu xa xỉ và loại bỏ sạch sẽ các "dấu vết khuôn mẫu AI", toàn bộ mã nguồn phải tuân thủ nghiêm ngặt 10 điều cấm:

1. ❌ **CẤM bo tròn góc đồng loạt:** Không dùng `rounded-2xl` hay `rounded-3xl` biến mọi thứ thành viên kẹo đồ chơi. Giữ các góc vuông sắc sảo (`rounded-none` hoặc `rounded-sm: 2px - 4px`) đặc trưng của bản vẽ rập may đo.
2. ❌ **CẤM gradient tím-sang-xanh:** Tuyệt đối không dùng gradient màu tím - xanh công nghệ phổ thông của các landing page AI/crypto.
3. ❌ **CẤM Glassmorphism tràn lan:** Không lạm dụng hiệu ứng kính mờ và viền phát sáng trắng ở mọi ngóc ngách. Chỉ dùng kính mờ nhẹ tại thanh Header sticky để đảm bảo nội dung bên dưới hiển thị chân thực.
4. ❌ **CẤM đổ bóng quá đậm (Heavy Drop Shadows):** Loại bỏ bóng đen ngòm; thay bằng bóng vi hạt siêu mảnh (`--shadow-card`).
5. ❌ **CẤM animation đồng loạt một kiểu:** Không để tất cả section đều giật giật fade-in từ dưới lên theo cùng một độ trễ.
6. ❌ **CẤM hover nút bấm giống nhau:** Nút chính có hiệu ứng xúc giác cơ học; link thứ cấp có hiệu ứng gạch chân mở rộng từ tâm; nút icon có hiệu ứng xoay góc nhẹ.
7. ❌ **CẤM trùng lặp cấu trúc Hero:** Hero Trang Chủ là tấm lụa 3D tương tác; Hero Trang Sản Phẩm là thanh điều hướng thương mại tinh gọn; Hero Lookbook là ảnh khổ lớn tràn viền.
8. ❌ **CẤM animation rùa bò làm chậm thao tác:** Không bắt người dùng chờ $1 - 2$ giây chỉ để xem hoạt ảnh trước khi được bấm nút "Mua Ngay" hay "Thanh Toán".
9. ❌ **CẤM Parallax vô nghĩa:** Parallax chỉ được dùng khi làm nổi bật chiều sâu giữa tiền cảnh người mẫu và hậu cảnh kiến trúc.
10. ❌ **CẤM 3D nặng gây giật lag:** Three.js chỉ tập trung vào một WebGL context duy nhất cho tấm lụa `SignalFabricCanvas`, tự động dừng render loop khi cuộn khỏi màn hình (IntersectionObserver).

---

## 5. KẾT LUẬN

Bản quy chuẩn **Art Direction** này là kim chỉ nam xuyên suốt toàn bộ Giai đoạn 23. Nó đảm bảo rằng mọi dòng mã CSS, mọi timeline GSAP và mọi tương tác React đều chung một mục tiêu: biến **REACT-WebFashion** thành một biểu tượng số của thẩm mỹ may đo đương đại, tinh tế và không thể bị hòa lẫn.
