# KẾ HOẠCH BỐ TRÍ VÀ THIẾT KẾ CÁC SECTION TRANG CHỦ (HOMEPAGE SECTION PLAN)

**Dự án:** `REACT-WebFashion`  
**Nhánh:** `redesign-v2`  
**Tiêu chuẩn thiết kế:** Haute Couture Digital Flagship (Anti-slop, One-system, Magazine Editorial)  

---

## 1. Cấu trúc và nhịp điệu thị giác (Visual Rhythm)

Trang chủ được kiến tạo với nhịp điệu tương phản đan xen giữa:
- **Full-width Editorial Blocks:** Tạo cảm xúc thị giác mạnh mẽ (Hero 3D, Campaign Banner, Story Video/Photo).
- **Asymmetric & Bento Grids:** Phá vỡ cấu trúc lưới sản phẩm đơn điệu (Category Mosaic, Journal).
- **Interactive Micro-Experiences:** Thúc đẩy hành vi khám phá (Lookbook Hotspots, Tab Trending/BestSellers, Complete The Look Bundler, Style Quiz, FAQ Accordion).
- **Textural & Typography Pauses:** Điểm nghỉ thị giác giúp khách hàng tiếp nhận giá trị thương hiệu (Manifesto, Artisan Crafting Pillars).

---

## 2. Danh mục 16 Section chi tiết trên Trang chủ

| Thứ tự | Tên Section | Thành phần giao diện / Layout | Mục đích & Trải nghiệm người dùng | Nguồn dữ liệu & Tương tác |
|:---:|:---|:---|:---|:---|
| **Top** | **Announcement Bar** | Thanh băng rôn phía trên cùng, font mono, hiệu ứng chuyển động chữ | Thông báo chính sách giao hàng miễn phí, ưu đãi thành viên mới, mã voucher | Nội dung luân phiên, click mở modal Voucher |
| **01** | **Immersive Hero** | Split-screen: Bên trái Typography ấn tượng + Dual CTAs; Bên phải Three.js Silk Wave canvas | Tạo ấn tượng mở màn choáng ngợp về thương hiệu may đo đương đại | Tương tác chuột chuyển động sóng vải 3D, CTA sang `/products` và `/lookbooks` |
| **02** | **Signature Value Pillars** | Lưới 4 cột tối giản viền tinh tế, icon may đo Atelier (Haute Tailoring, Monochromatic, Luxury Fabric, AI Stylist) | Khẳng định 4 trụ cột chất lượng và uy tín may đo | Hover micro-animations, link tới trang Giới thiệu |
| **03** | **Shop by Category Mosaic** | Bento Grid bất đối xứng 5 danh mục: Áo Khoác Atelier (Hero tile), Quần Tây May Đo, Sơ Mi Cấu Trúc, Phụ Kiện Da, Giày & Boots | Khơi gợi cảm hứng danh mục thời trang có chiều sâu | Lấy từ `categoryApi.getAll()`, click lọc ngay danh mục tương ứng |
| **04** | **New Arrivals (Tuyển Tập Mới)** | Thanh tab chọn nhanh danh mục + Lưới sản phẩm cao cấp có badge "NEW", Quick Add-to-cart, so sánh | Trưng bày các mẫu thiết kế mới ra mắt trong mùa | Lấy từ `productApi.getAll({ limit: 8 })`, tương tác thêm vào giỏ và xem chi tiết |
| **05** | **Brand Story & Artisan Heritage** | Bố cục Split-Screen: Ảnh nghệ nhân may đo thủ công + Tuyên ngôn bản sắc thương hiệu + Chỉ số 240+ giờ may đo, 100% sợi tự nhiên | Truyền tải linh hồn và giá trị thủ công độc bản | Nút "Tìm hiểu câu chuyện thương hiệu" chuyển đến `/about` |
| **06** | **Trending Now vs Best Sellers** | Tab Switcher tương tác 2 trạng thái: "Đang Thịnh Hành" và "Bán Chạy Nhất" | Hỗ trợ quyết định mua sắm dựa trên độ ưa chuộng của cộng đồng | Chuyển đổi tab tức thì không tải lại trang, nút thêm giỏ hàng nhanh |
| **07** | **Editorial Seasonal Campaign** | Banner phong cách tạp chí toàn khổ (Full-width Magazine) với typography khổ lớn và hình ảnh Monochrome | Giới thiệu bộ sưu tập chủ đạo của mùa Thu Đông 2026/27 | Nút "Khám phá chiến dịch" đưa về danh mục Capsule |
| **08** | **Shoppable Lookbook Hotspots** | Hình ảnh lookbook phong cách đường phố có 3 điểm gắn ghim (Interactive Hotspot Pins) | Trải nghiệm mua sắm trên ảnh chụp phối đồ thực tế | Click pin mở popover hiển thị tên sản phẩm, giá tiền và nút "Thêm vào giỏ" |
| **09** | **Complete The Look Coordinator** | Khối phối đồ 3 món (Áo khoác + Sơ mi + Quần tây) với huy hiệu giảm giá combo 10% | Tăng giá trị trung bình đơn hàng (AOV) bằng gợi ý phối trang phục hài hòa | Chọn size từng món và nút "Thêm trọn bộ vào giỏ" tích hợp 1-click bundle |
| **10** | **AI Personal Stylist & Style Quiz** | Thẻ tương tác phong cách sang trọng với hình khối AI và nút kích hoạt Style Quiz 60s | Cá nhân hóa trải nghiệm khách hàng theo gu ăn mặc (Minimalist, Sartorial, Quiet Luxury) | Kích hoạt `AiStyleQuizModal` đã tích hợp trong store |
| **11** | **Shop by Occasion** | 4 thẻ phong cách đại diện cho 4 dịp: Công sở, Dạo phố, Dạ tiệc, Du lịch | Tiếp cận sản phẩm theo ngữ cảnh sử dụng thực tế của khách hàng | Click lọc sản phẩm theo tag ngữ cảnh |
| **12** | **Customer Reviews & Voices** | Lưới 3 đánh giá kèm số sao 5/5, trích dẫn cảm nhận, tên khách hàng và nhãn "Đã xác thực mua hàng" | Xây dựng niềm tin thương hiệu và bằng chứng xã hội (Social Proof) | Dữ liệu đánh giá chân thực từ khách hàng đã trải nghiệm sản phẩm |
| **13** | **Fashion Journal & Style Guides** | 3 bài viết tạp chí với hình ảnh khổ dọc, thời gian đọc, tác giả và tóm tắt cẩm nang phối đồ | Gia tăng giá trị nội dung, tư vấn cách chăm sóc trang phục và xu hướng thời trang | Click xem chi tiết bài viết dẫn đến `/blog` |
| **14** | **FAQ & Shopping Concierge** | Accordion tương tác 4 nhóm câu hỏi: Chọn size, Thời gian giao nhận, Chính sách đổi trả, Bảo quản sợi len lụa | Tháo gỡ các do dự trước khi mua hàng của người tiêu dùng | Accordion đóng mở êm mượt, hỗ trợ bàn phím WCAG |
| **15** | **Atelier VIP Club Newsletter** | Form đăng ký nhận tin với lời hứa mã ưu đãi độc quyền 10% cho đơn hàng đầu tiên | Thu thập danh sách khách hàng trung thành và gửi ưu đãi bí mật | Form submit có toast phản hồi thành công và cấp mã voucher mẫu |
| **16** | **Comprehensive Footer** | Chân trang 4 cột chuyên nghiệp: Về Atelier, Dịch vụ khách hàng, Hệ sinh thái sản phẩm, Showroom & Chứng nhận | Hoàn thiện bản đồ điều hướng và tính pháp lý thương hiệu | Liên kết đầy đủ đến 12 trang chính sách và mạng xã hội |

---

## 3. Quy chuẩn hiệu năng và tính tiếp cận (Performance & Accessibility)

- **Lazy Rendering:** Các section từ số 4 trở đi sử dụng IntersectionObserver hoặc hiển thị mượt mà không chặn luồng chính.
- **Safe Image Fallback:** 100% hình ảnh bọc trong `<SafeImage>` chống vỡ hình khi mạng chậm.
- **Motion Preference:** Tuân thủ `prefers-reduced-motion` đối với canvas Three.js và các animation chuyển cảnh.
- **Touch Target Size:** Toàn bộ nút bấm, điểm hotspot pin, thẻ danh mục đạt kích thước tối thiểu $44 \times 44\text{px}$.
