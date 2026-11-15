# LỘ TRÌNH ĐỔI MỚI TÍNH NĂNG (FEATURE INNOVATION ROADMAP)

**Dự án:** WEBFASHION Atelier  
**Định hướng:** Hậu Phase 16 (Phiên bản v2.1, v2.2 và v3.0)  
**Ngày phê duyệt:** 16/11/2026  
**Chủ trì:** Principal Full-Stack Engineer + Senior Product Architect  

---

## 1. TỔNG QUAN PHÂN HẠNG TÍNH NĂNG (TIER CLASSIFICATION)

Dựa trên nguyên tắc kỹ nghệ kiên cố (defensive engineering) và tối ưu hóa thời gian đưa sản phẩm ra thị trường (Time-to-Market), danh mục ý tưởng đổi mới của WEBFASHION được phân định thành 4 cấp độ:

```
┌─────────────────────────────────────────────────────────────┐
│  P0 (Triển khai ngay tại Phase 16): 4 Tính năng              │
│  - F-INV-01: AI Fashion Persona Profiler                    │
│  - F-INV-02: Smart Size & Fit Assistant                      │
│  - F-INV-03: Complete The Look Outfit Bundler                │
│  - F-INV-05: Real-time In-App Notification Center            │
├─────────────────────────────────────────────────────────────┤
│  P1 (Triển khai chọn lọc tại Phase 16): 3 Tính năng         │
│  - F-INV-04: Editorial Lookbook with Shoppable Hotspots     │
│  - F-INV-06: Side-by-Side Product Comparison Matrix          │
│  - F-INV-07: Free Shipping & Loyalty Tier Progress Tracker   │
├─────────────────────────────────────────────────────────────┤
│  P2 (Dự thảo phiên bản v2.1 & v2.2): 5 Tính năng Backlog     │
│  - F-PROP-07: Automated Web Push & SMS VIP Triggers          │
│  - F-PROP-09: WebXR / 3D Virtual Garment Fitting Room        │
│  - F-PROP-10: Live Atelier Streaming & Real-time Runway      │
│  - F-PROP-11: Digital Wardrobe & Mix-and-Match Canvas        │
│  - F-PROP-12: Social Shopping & Collaborative Shared Cart    │
├─────────────────────────────────────────────────────────────┤
│  REJECTED / DE-PRIORITIZED (Từ chối vì rủi ro cao): 3 Hạng   │
│  - Đề xuất A: Tích hợp tiền mã hóa / Crypto Web3 Checkout    │
│  - Đề xuất B: Tự động đổi màu trang phục thời gian thực WebGL│
│  - Đề xuất C: Gamification Vòng quay may mắn (Flash Spin)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. PHÂN TÍCH CHI TIẾT TÍNH NĂNG P2 (PRODUCT BACKLOG)

### 2.1. F-PROP-07: Automated Web Push & SMS VIP Triggers
* **Mô tả:** Hệ thống thông báo đẩy trên trình duyệt (Web Push Notifications) kết hợp cổng SMS Brandname thông báo biến động đơn hàng, cảnh báo hàng sắp hết (Low Stock Alerts) và mã giảm giá sinh nhật khách hàng VIP.
* **Lý do xếp hạng P2:**
  - Cần đăng ký tài khoản doanh nghiệp với đơn vị cung cấp dịch vụ viễn thông tại Việt Nam (như eSMS, VNPT, Viettel) và ký hợp đồng Brandname SMS.
  - Cần cấu hình VAPID keys và service worker trên môi trường HTTPS production có chứng chỉ SSL hợp lệ.
* **Kế hoạch triển khai (v2.1 - Quý 1/2027):**
  - Tích hợp OneSignal hoặc Firebase Cloud Messaging (FCM).
  - Bổ sung bảng quản trị phân quyền chiến dịch Push Notification trong trang Admin.

---

### 2.2. F-PROP-09: WebXR / 3D Virtual Garment Fitting Room (Phòng Thử Đồ Ảo AR)
* **Mô tả:** Cho phép người dùng quét khuôn mặt hoặc hình thể thông qua camera thiết bị di động để xem thử trang phục 3D chuyển động trên cơ thể thực tế (Augmented Reality).
* **Lý do xếp hạng P2:**
  - Yêu cầu dựng mô hình 3D (glTF/GLB) cho từng mã SKU với thông số rigging xương chuẩn xác.
  - Phân mảnh phần cứng (hardware fragmentation) lớn trên các dòng điện thoại tầm trung và cấp thấp, dễ gây sụt giảm FPS hoặc nóng máy.
* **Kế hoạch triển khai (v3.0 - Quý 3/2027):**
  - Thử nghiệm trước với phụ kiện (Kính mắt, Khuyên tai, Khăn lụa) bằng MediaPipe Face Mesh trước khi mở rộng sang toàn bộ trang phục.

---

### 2.3. F-PROP-10: Live Atelier Streaming & Real-time Runway (Bán Hàng Trực Tiếp)
* **Mô tả:** Kênh phát sóng trực tiếp (Livestreaming) các buổi ra mắt bộ sưu tập theo mùa của Atelier, tích hợp ghim sản phẩm đang mặc và giỏ hàng nổi thời gian thực.
* **Lý do xếp hạng P2:**
  - Yêu cầu hạ tầng máy chủ Media Streaming (RTMP / WebRTC / HLS CDN) với băng thông lớn và chi phí vận hành máy chủ chuyên biệt.
* **Kế hoạch triển khai (v2.2 - Quý 2/2027):**
  - Tích hợp Cloudflare Stream hoặc Agora Live Interactive Audio/Video SDK.

---

### 2.4. F-PROP-11: Digital Wardrobe & Mix-and-Match Canvas (Tủ Đồ Kỹ Thuật Số)
* **Mô tả:** Không gian bảng vẽ tự do (Canvas) cho phép khách hàng kéo-thả các trang phục đã mua hoặc trong danh sách yêu thích để tự phối phong cách riêng.
* **Lý do xếp hạng P2:**
  - Cần công cụ xóa phông nền ảnh trang phục (Background Removal AI API) tự động để tạo layer PNG trong suốt.
* **Kế hoạch triển khai (v2.1 - Quý 1/2027):**
  - Xây dựng component HTML5 Canvas với thư viện Konva.js hoặc Fabric.js.

---

### 2.5. F-PROP-12: Social Shopping & Collaborative Shared Cart (Mua Sắm Nhóm)
* **Mô tả:** Cho phép hai hoặc nhiều người bạn cùng xem một giỏ hàng thời gian thực qua WebSocket, bình luận trực tiếp trên từng món đồ trước khi người chủ phòng thanh toán.
* **Lý do xếp hạng P2:**
  - Cần nâng cấp mô hình dữ liệu Cart để hỗ trợ Multi-tenant Cart Lock & Concurrency Control phức tạp.
* **Kế hoạch triển khai (v2.2 - Quý 2/2027):**
  - Tận dụng hạ tầng Socket.IO hiện có trong backend để mở rộng phòng chat mua sắm theo phiên (Room Session).

---

## 3. PHÂN TÍCH CÁC TÍNH NĂNG BỊ TỪ CHỐI (REJECTED PROPOSALS)

| Ý tưởng đề xuất | Nguyên nhân từ chối chuyên môn |
|---|---|
| **Thanh toán bằng Tiền mã hóa (Crypto Web3 Checkout)** | Rủi ro pháp lý theo quy định hiện hành của Ngân hàng Nhà nước Việt Nam về việc sử dụng tiền mã hóa làm phương tiện thanh toán; biến động tỷ giá gây phức tạp cho đối soát tài chính và xuất hóa đơn VAT điện tử. |
| **Tự động đổi màu trang phục thời gian thực bằng Shader** | Làm sai lệch bản chất chất liệu vải thực tế ngoài đời thực (Lụa tơ tằm, nhung the, len dệt có độ bắt sáng khác nhau hoàn toàn so với đổi màu RGB số học), dễ dẫn đến khiếu nại của khách hàng may đo cao cấp. |
| **Gamification Vòng quay may mắn (Flash Lucky Wheel)** | Phá vỡ định vị thương hiệu xa xỉ và phong cách thanh lịch trầm lắng (Quiet Luxury / Editorial High Fashion) của WEBFASHION Atelier; tạo cảm giác thương mại giá rẻ đại trà. |

---

## 4. BẢNG TIẾN ĐỘ THEO DÕI CÁC PHIÊN BẢN (RELEASE SCHEDULE)

| Phiên bản | Thời gian mục tiêu | Trọng tâm phát triển | Chỉ số thành công (Target KPI) |
|---|---|---|---|
| **v2.0 (Hiện tại)** | 11/2026 | Full Rebuild Frontend, 7 Innovative Features, Backend Resilience | 100% E2E test pass, 0 Console errors, Video audit |
| **v2.1** | 02/2027 | Web Push Notifications, Digital Wardrobe Canvas, Loyalty Tier Rewards | +18% Tỷ lệ giữ chân khách hàng (Retention Rate) |
| **v2.2** | 05/2027 | Live Runway Streaming, Collaborative Co-Shopper Cart | +25% Giá trị trung bình giỏ hàng (AOV) |
| **v3.0** | 09/2027 | WebXR Phụ kiện AR, Personalized AI Tailor Agent Voice | Dẫn đầu trải nghiệm thương mại điện tử xa xỉ tại VN |
