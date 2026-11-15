# PHÂN TÍCH CHUYÊN SÂU NGUYÊN TẮC THIẾT KẾ HALLMARK (HALLMARK SKILL ANALYSIS)
## DỰ ÁN: REACT-WEBFASHION | PHASE 22 — HALLMARK-DRIVEN FULL REDESIGN

**Tài liệu tham chiếu:** `.agent/skills/hallmark/SKILL.md`  
**Phiên bản:** Hallmark 2.0.0 (High-Craft Frontend Architecture)  
**Tác giả phân tích:** Principal UI/UX Designer & Creative Director  
**Trạng thái:** HOÀN THÀNH TOÀN DIỆN  

---

## 1. BẢN CHẤT CỦA HALLMARK VÀ TRIẾT LÝ THIẾT KẾ (PHILOSOPHY)

Khác với các công cụ tạo giao diện thông thường thường bị rơi vào "lối mòn" giao diện sinh bởi AI (AI-slop / generic model defaults), **Hallmark** thiết lập một sàn tiêu chuẩn không thể nhân nhượng (**The Floor**) nhằm đảm bảo sản phẩm kỹ thuật số luôn mang dấu ấn thiết kế thủ công thực thụ (*looks designed, not generated*).

### 3 Trụ Cột Nền Tảng Của Hallmark:
1. **The Floor (Sàn chất lượng bất biến):** 16 quy tắc cốt lõi bắt buộc tuân thủ 100%, không miễn trừ (non-waivable), loại bỏ sạch sẽ các "tells" nhận diện AI như: card lồng trong card, gradient tím-sang-xanh, emoji làm icon, nút bấm thiếu `:focus-visible`, hoặc vi phạm độ dài câu chữ.
2. **Reflex & Gates (Cơ chế kiểm soát phản xạ):** Ngăn chặn các thói quen mặc định mà mô hình AI hay vấp phải (như căn giữa tất cả mọi thứ, lặp lại cùng một kiểu lưới, hoặc dùng số liệu/testimonial bịa đặt).
3. **One Idea Per Screen & Distinctive Macrostructures (Một ý tưởng trên một màn hình):** Mỗi màn hình chỉ tập trung vào một thông điệp hoặc hành động cụ thể, với tỷ lệ typography táo bạo, bố cục bất đối xứng có chủ đích và nhịp điệu thị giác rõ nét.

---

## 2. 16 NGUYÊN TẮC BẤT DI BẤT DỊCH (THE 16 FLOOR RULES)

| STT | Mã quy tắc | Tên quy tắc & Nội dung kỹ thuật | Áp dụng trên REACT-WebFashion |
| :---: | :---: | :--- | :--- |
| **1** | F01 | **Tokenized Color & Fonts:** Mọi màu sắc và font chữ phải khai báo qua biến CSS tại `:root` (hoặc theme block). Tuyệt đối không viết mã màu hex hoặc `font-family` trực tiếp rải rác trong component. | Toàn bộ components chỉ gọi class semantic hoặc biến `--bg-*`, `--text-*`, `--border-*` từ `tokens.css`. |
| **2** | F02 | **No `transition: all`:** Tuyệt đối không dùng `transition: all`. Không bao giờ animate thuộc tính layout `width`, `height`, `top`, `left` (chỉ animate `transform`, `opacity`, `color`, `background-color`). | Tối ưu hóa render thread, loại bỏ hiện tượng giật khung hình (layout thrashing) 60fps. |
| **3** | F03 | **No Single Italic Word in Roman Heading:** Tuyệt đối không chèn 1 từ in nghiêng lẻ loi bên trong tiêu đề roman thông thường. | Tiêu đề may đo Atelier đồng nhất kiểu chữ, tôn trọng tính sang trọng cổ điển. |
| **4** | F04 | **`overflow-x: clip`:** Sử dụng `overflow-x: clip` trên cả `html` và `body`. Không bao giờ dùng `hidden` hoặc gán `100vw`. | Đảm bảo không bị thanh cuộn ngang rác trên các trình duyệt di động và Safari. |
| **5** | F05 | **Safe Grid Tracks:** Các track lưới chứa ảnh phải dùng `minmax(0, 1fr)`. Tiêu đề hiển thị phải có `overflow-wrap: break-word; min-width: 0`. | Ngăn vỡ layout khi tên sản phẩm hoặc hình ảnh có tỷ lệ khung hình bất thường. |
| **6** | F06 | **Instant Focus Ring:** Mọi phần tử tương tác phải có `:focus-visible` xuất hiện tức thì, không làm trễ. | Chuẩn mực khả năng tiếp cận bàn phím (Keyboard A11y). |
| **7** | F07 | **Motion Fallback & Script-off Safety:** Mọi animation đều phải có dự phòng `prefers-reduced-motion: reduce`. | Tôn trọng cài đặt sinh học của người dùng nhạy cảm với chuyển động. |
| **8** | F08 | **No Fake Metrics/Logos:** Không được bịa đặt chỉ số ("50,000+ khách hàng", "99.9% uptime"), đánh giá giả hoặc logo đối tác ảo. | Chỉ hiển thị dữ liệu sản phẩm thật từ Backend MongoDB và thông tin thương hiệu có thật. |
| **9** | F09 | **No Tracked Small Caps / Eyebrows:** Không sử dụng nhãn dạng tracked capitals gượng ép hoặc eyebrow rườm rà. Nhãn, bảng, tag dùng body face, sentence/lower case. | Tránh cảm giác template thương mại rẻ tiền, giữ phong cách Haute Couture tinh gọn. |
| **10** | F10 | **No Glued Status / Middle Dots:** Không nối các chuỗi metadata bằng dấu chấm giữa `·` hoặc mũi tên dính sát link text `→`. | Sử dụng khoảng cách âm và bố cục phân lớp chuyên nghiệp. |
| **11** | F11 | **No Purple Gradient / Card-in-Card:** Cấm gradient tím-xanh công nghệ, cấm lồng thẻ card bên trong card, cấm emoji làm icon. | Sử dụng palette Warm Linen / Obsidian và icon Lucide vector tinh xảo. |
| **12** | F12 | **Hero Viewport Visibility:** Tiêu đề Hero, 1 câu mô tả và CTA chính phải hiển thị trọn vẹn ở độ phân giải 1280 × 800 mà không cần cuộn trang. | Tối ưu điểm vàng thu hút chuyển đổi ngay màn hình đầu tiên. |
| **13** | F13 | **Screen Word Budget:** Tối đa khoảng 80 từ trên một màn hình; phần Hero chỉ gồm headline, 1 câu mô tả và hành động. | Giữ sự thoáng đãng, truyền tải thông điệp bằng hình ảnh thị giác (Show, do not describe). |
| **14** | F14 | **Capped & Centered Container:** Ở độ phân giải 1920px+, gutters mở rộng ra hai bên, lưới và measure của văn bản không bị kéo giãn vô tận. | Đặt `max-w-[1440px]` căn giữa chuẩn chỉnh. |
| **15** | F15 | **Hallmark Stamp:** Khai báo cấu trúc định danh Hallmark, critique line và waivers rõ ràng. | Minh bạch kiến trúc và truy xuất nguồn gốc thiết kế. |
| **16** | F16 | **Quality Verification (Sloplint/Playwright):** Chạy kiểm thử tự động, bắt buộc sửa mọi lỗi FAIL. | Không chấp nhận đánh giá qua loa trên giấy tờ. |

---

## 3. QUY TẮC BỐ CỤC & TỔ CHỨC KHÔNG GIAN (COMPOSITION & MACROSTRUCTURES)

1. **Khái niệm "One Section Per Screen" (Mỗi phần một màn hình):**
   - Hero chiếm trọn màn hình đầu tiên. Không để phần nội dung bên dưới "thò đầu" lấp lửng vào màn hình đầu ở viewport chuẩn 1440 × 900.
   - Nhịp điệu trang (Visual Rhythm) thay đổi liên tục: Không bao giờ xếp hai section có cùng một kiểu bố cục cạnh nhau (ví dụ: không xếp 2 lưới 4 cột liền nhau; thay vào đó là Hero Lụa 3D → Lưới Bất Đối Xứng Bento → Băng Chuyền Lookbook Hotspots → Tạp Chí Thời Trang 2 Cột).
2. **Cân bằng biên lề (Equal Edges):**
   - Lề trái và lề phải của nội dung luôn bằng nhau trên toàn trang.
   - Khi ở màn hình lớn (1920px), lề tự động mở rộng đối xứng mà không làm biến dạng tỷ lệ khung hình của sản phẩm.
3. **Phân tách vùng chức năng theo Template:**
   - Mỗi trang phục vụ một nghiệp vụ khác nhau phải có bố cục (Macrostructure) riêng biệt, giải quyết đúng mục tiêu của người dùng trên trang đó.

---

## 4. QUY TẮC TYPOGRAPHY & VISUAL HIERARCHY

1. **Cặp phông chữ chủ đạo (Typography Pair):**
   - **Display Face:** `Oswald` (Sans-serif phong cách condensed editorial, chữ hoa góc cạnh đậm chất tạp chí thời trang Paris).
   - **Body Face:** `Plus Jakarta Sans` (Hình học hiện đại, nét thanh thoát, hỗ trợ tiếng Việt tuyệt đối, độ dễ đọc hoàn hảo ở mọi kích thước từ 11px đến 18px).
2. **Phân cấp thị giác 4 tầng:**
   - **Level 1 (Dominant Eye-catcher):** Tiêu đề lớn (Display Heading) $48px - 72px$, trọng số nét dày, truyền tải cảm xúc.
   - **Level 2 (Editorial Subtitle):** Câu mô tả $16px - 18px$, trọng số regular/medium, dãn dòng $1.6$, giới hạn tối đa 12-15 từ.
   - **Level 3 (Functional Controls):** Nút CTA, bộ lọc, tab chọn size $12px - 13px$, phông display hoặc mono chuyên biệt.
   - **Level 4 (Metadata & Details):** Mã đơn, chất liệu vải, thành phần $10px - 11px$, phông mono rõ ràng.

---

## 5. QUY TẮC TƯƠNG TÁC & VI CHUYỂN ĐỘNG (MICRO-INTERACTIONS)

1. **Tương tác thẻ sản phẩm:**
   - Khi hover chuột: Ảnh zoom nhẹ $1.02 - 1.03$ trong khung cố định (không tràn viền), thẻ nhấc nhẹ $2px$, nút "Xem nhanh" và "Thêm giỏ" xuất hiện mượt mà bằng `opacity` và `transform: translateY()`.
2. **Nút bấm & Bộ chọn:**
   - Nút bấm có 4 trạng thái: Default, Hover, Active/Press, Disabled.
   - Khi click nút: Tạo hiệu ứng lún nhẹ $0.98$ scale đem lại cảm giác cơ học xúc giác (tactile feedback).
3. **Thanh trượt & Drawer:**
   - Drawer giỏ hàng và bộ lọc mở ra từ mép màn hình với đường cong gia tốc `cubic-bezier(0.16, 1, 0.3, 1)`, thời gian $250ms - 300ms$.

---

## 6. MA TRẬN ÁP DỤNG HALLMARK CHO TỪNG NHÓM TEMPLATE TRÊN REACT-WEBFASHION

| Nhóm Template | Template ID | Nhóm trang áp dụng | Phong cách bố cục Hallmark | Tương tác & Trải nghiệm đặc trưng |
| :--- | :---: | :--- | :--- | :--- |
| **Editorial Homepage** | **Template A** | `/` (Trang Chủ) | Campaign Hero 3D lụa, Lưới tạp chí bất đối xứng, Editorial storytelling, Bento collections. | Silk 3D Hero cuộn sóng theo chuột, chuyển đổi Theme trực tiếp, Lookbook hotspots ghim sản phẩm. |
| **Product Discovery** | **Template B** | `/products` (Bộ Sưu Tập, Tìm kiếm) | Commerce layout tinh gọn, thanh công cụ compact, bộ lọc sidebar/drawer, lưới co giãn 2/3/4 cột. | Chuyển đổi chế độ lưới, thanh trượt khoảng giá tức thời, Quick View modal, Compare matrix. |
| **Product Detail** | **Template C** | `/product/:slug` (Chi Tiết Sản Phẩm) | Gallery ảnh góc nhìn lớn, thanh thông tin dính (Sticky dock), bộ chọn size trực quan. | Phóng to ảnh chi tiết sợi vải, Size Guide modal, Complete The Look giảm 10%, đếm ngược tồn kho. |
| **Minimal Checkout** | **Template D** | `/cart`, `/checkout`, `/payment-result` | Bố cục tối giản, triệt tiêu phân tâm, tóm tắt đơn hàng sắc nét, các bước thanh toán rõ ràng. | Thanh tiến trình Freeship, áp dụng voucher tức thì, form nhập địa chỉ có validation, chọn COD/MoMo. |
| **Account Workspace**| **Template E** | `/user/dashboard`, `/profile`, `/orders`, `/my-coupons` | Dashboard cá nhân hóa, thanh điều hướng tab thẻ hội viên, dòng thời gian đơn hàng (Timeline). | Thanh tiến trình VIP hạng Diamond, tra cứu lịch sử mua hàng, quản lý địa chỉ nhận hàng, yêu cầu GDPR. |
| **AI Fashion Studio**| **Template F** | `/ai-assistant` & AI Styling Quiz | Không gian đối thoại thông minh, thẻ gợi ý phối đồ trực quan, bộ sưu tập cá nhân hóa. | Trắc nghiệm Persona 4 bước, trò chuyện tư vấn phong cách theo hoàn cảnh, thêm set đồ vào giỏ. |
| **Editorial Lookbook**| **Template G** | `/lookbooks` | Tạp chí thời trang kỹ thuật số, ảnh khổ lớn, câu chuyện sáng tạo theo mùa (Season narrative). | Tương tác chạm điểm Hotspot trên người mẫu để mở modal mua sản phẩm ngay trong bộ ảnh. |
| **Admin Operations** | **Template H** | `/admin/*` (Toàn bộ trang quản trị) | Không gian làm việc dữ liệu chuyên nghiệp, sidebar điều hướng cố định, bảng dữ liệu mật độ cao. | Bộ lọc tìm kiếm nhanh, bảng quản lý tồn kho/đơn hàng, biểu đồ A/B testing, theme switcher trên topbar. |
| **Authentication** | **Template I** | `/login`, `/register`, `/verify-otp`, `/reset-password` | Bố cục tập trung (Focused / Split-screen), ảnh người mẫu editorial bên cạnh form đăng nhập. | Form nhỏ gọn, kiểm tra tính hợp lệ tức thời, gửi mã OTP đếm ngược 60s, đăng nhập Google. |
| **Support & Content**| **Template J** | `/about`, `/policy`, `/shipping`, `/blog`, `/faq`, `/guide`, `/stores` | Bố cục tối ưu trải nghiệm đọc (Reading-focused), chia cột mục lục tiện lợi, phông chữ êm ái. | Mục lục nhảy nhanh đến điều khoản, bảng tra cứu câu hỏi thường gặp, câu chuyện nghệ nhân Atelier. |
| **System & Error** | **Template K** | `/order-lookup`, `/404` | Bố cục đơn giản, tập trung giải quyết vấn đề của người dùng. | Tra cứu đơn hàng bằng Mã + SĐT không cần login, trang 404 thân thiện dẫn về trang chủ. |

---

## 7. KẾT LUẬN

Việc nghiên cứu kỹ lưỡng skill **Hallmark** đã cung cấp cho chúng tôi một hệ quy chiếu vững chắc: **Không chỉ đổi màu hay bo góc, mà phải tái cấu trúc toàn diện từng nhóm trang thành các template chuyên biệt**. Hệ thống này vừa giải quyết xuất sắc nghiệp vụ của từng loại trang, vừa giữ trọn vẹn bản sắc thời trang cao cấp, tối giản ấm áp của thương hiệu **REACT-WebFashion**.
