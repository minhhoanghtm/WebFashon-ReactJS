# FEATURE_PROPOSALS.md — Innovation Proposals & Evaluation Matrix

**Project:** REACT-WebFashion  
**Architect:** Principal Full-Stack Engineer & AI Shopping Experience Architect  
**Branch:** `redesign-v2`  
**Date:** 2026-11-16  

---

## 1. Ma Trận Đánh Giá Ý Tưởng (Evaluation Matrix)

Mỗi ý tưởng được chấm điểm trên thang 1 - 5 điểm theo 5 tiêu chí:
- **Giá trị kinh doanh (Business Value - BV):** Tác động tới AOV (Average Order Value), tỷ lệ chuyển đổi (CR) hoặc giữ chân khách hàng (Retention).
- **Tính độc đáo & Trải nghiệm (Uniqueness & UX - UX):** Sự khác biệt so với các sàn TMĐT đại trà, mang lại phong thái Haute Couture / High-End Fashion.
- **Tính khả thi kỹ thuật (Technical Feasibility - TF):** Tương thích với Backend hiện tại mà không làm phá vỡ cơ sở dữ liệu hoặc schema MongoDB.
- **Độ phức tạp & Công sức (Effort - EF):** Thời gian và tài nguyên để hoàn thiện từ UI, logic, store đến E2E test (1 = rất cao, 5 = dễ kiểm soát).
- **Mức độ an toàn (Risk - RK):** Khả năng không gây regression cho 48 routes hiện có (5 = an toàn tuyệt đối).

| Mã | Tên Đề Xuất Đổi Mới | BV | UX | TF | EF | RK | Tổng Điểm | Quyết Định & Phân Loại |
|---|---|---|---|---|---|---|---|---|
| **INN-01** | **Complete The Look & Outfit Bundler (1-Click Buy)** | 5 | 5 | 5 | 4 | 5 | **24/25** | **P0 — Triển Khai Ngay** |
| **INN-02** | **AI Style Quiz & Fashion Persona Profiler** | 5 | 5 | 5 | 4 | 5 | **24/25** | **P0 — Triển Khai Ngay** |
| **INN-03** | **Smart In-App Notification Center** | 4 | 5 | 5 | 4 | 5 | **23/25** | **P1 — Triển Khai Ngay** |
| **INN-04** | **Smart Size Assistant & Fit Recommender** | 5 | 4 | 5 | 4 | 5 | **23/25** | **P1 — Triển Khai Ngay** |
| **INN-05** | **Interactive Product Comparison Drawer & Modal** | 4 | 4 | 5 | 4 | 5 | **22/25** | **P1 — Triển Khai Ngay** |
| **INN-06** | **Interactive Shoppable Lookbook Hotspots** | 4 | 5 | 4 | 4 | 5 | **22/25** | **P1 — Triển Khai Ngay** |
| **INN-07** | AR Virtual Fitting Room qua WebGL/WebXR | 3 | 5 | 2 | 1 | 2 | **13/25** | **REJECTED** (Độ trễ cao, phụ thuộc camera ngoài, rủi ro tương thích thiết bị) |
| **INN-08** | Blockchain Digital Authenticity Certificate (NFT) | 2 | 3 | 2 | 1 | 1 | **9/25** | **REJECTED** (Rào cản người dùng quá lớn, không phù hợp luồng mua sắm thanh lịch) |
| **INN-09** | Group Buying / Mua Chung Giảm Giá | 3 | 2 | 3 | 2 | 3 | **13/25** | **REJECTED** (Làm giảm giá trị thương hiệu cao cấp, giống sàn giá rẻ) |
| **INN-10** | Live Stream Video Shopping Bán Hàng Trực Tiếp | 3 | 3 | 2 | 2 | 2 | **12/25** | **P2 — Đưa vào Roadmap tương lai** |
| **INN-11** | Smart Wardrobe Digital Closet (Tủ đồ số cá nhân) | 4 | 4 | 3 | 2 | 3 | **16/25** | **P2 — Đưa vào Roadmap tương lai** |

---

## 2. Chi Tiết Các Tính Năng Đổi Mới Được Triển Khai

### 2.1. INN-01: Complete The Look & Outfit Bundler (P0)
- **Vị trí:** Trang Chi tiết sản phẩm (`/product/:slug`).
- **Mô tả:** Phối hợp thông minh giữa sản phẩm hiện tại và các item phụ kiện bổ trợ (Ví dụ: Áo Blazer Silk + Quần Trouser Ý + Giày Oxford Da Bò Thủ Công).
- **Tương tác:** Khách hàng có thể chọn/bỏ chọn từng món, xem giá tổng bundle kèm mức ưu đãi tiết kiệm (Bundle Discount 10%), và bấm nút "Thêm Trọn Bộ Vào Giỏ Hàng" chỉ với 1 cú click. Tự động kiểm tra tồn kho và thêm nhiều items vào Zustand `cartStore`.
- **Hiệu quả:** Trực tiếp tăng AOV (giá trị trung bình mỗi đơn hàng) từ 30% đến 55%.

### 2.2. INN-02: AI Style Quiz & Fashion Persona Profiler (P0)
- **Vị trí:** Modal toàn màn hình kích hoạt từ Header ("Phong Cách Của Bạn") và Banner trên Trang Chủ (`/`).
- **Mô tả:** Bài khảo sát phong cách tương tác 4 bước tinh gọn:
  1. *Dịp sử dụng thường xuyên* (Dạ tiệc thượng lưu, Công sở hiện đại, Dạo phố tinh giản, Du lịch nghỉ dưỡng).
  2. *Tone màu & Bảng màu yêu thích* (Monochrome Tối giản, Earthy Tự nhiên, Pastel Tinh tế, Bold Sang trọng).
  3. *Phom dáng & Đường cắt* (Slim-fit Tôn dáng, Relaxed Phóng khoáng, Structured Cổ điển).
  4. *Mức ngân sách & Tần suất mua sắm*.
- **Kết quả:** Phân tích ra Fashion Persona độc bản (Ví dụ: *"Archival Minimalist"*, *"Modern Sartorialist"*, *"Quiet Luxury Aficionado"*), lưu vào `localStorage`, gắn thẻ Persona Badge trên Header và Profile, đồng thời tự động đề xuất danh mục trang phục tương thích.

### 2.3. INN-03: Smart In-App Notification Center (P1)
- **Vị trí:** Biểu tượng Chuông thông báo trên Header (Desktop & Mobile).
- **Mô tả:** Trung tâm thông báo tương tác với badge đếm số lượng tin chưa đọc:
  - Phân loại 3 tab: *Tất cả*, *Đơn hàng*, *Khuyến mãi*.
  - Chứa thông báo thực tế: Xác nhận đơn hàng, tiến trình vận chuyển, voucher độc quyền mới được phát hành, thông báo ưu đãi thành viên.
  - Hỗ trợ đánh dấu đã đọc từng tin hoặc "Đánh dấu tất cả đã đọc", xóa thông báo, và click chuyển hướng trực tiếp tới trang chi tiết đơn hàng hoặc mã giảm giá.

### 2.4. INN-04: Smart Size Assistant & Fit Recommender (P1)
- **Vị trí:** Modal kích hoạt từ nút "Tư vấn Size Chuẩn AI" ngay cạnh Bảng quy đổi Size tại trang chi tiết sản phẩm (`ProductDetail.jsx`).
- **Mô tả:** Khách hàng nhập nhanh Chiều cao (cm), Cân nặng (kg), Dáng người (Mảnh mai, Cân đối, Đầy đặn) và Phong cách mặc mong muốn (Vừa vặn ôm người, Thoải mái thường nhật, Rộng phóng khoáng Oversized).
- **Thuật toán:** Tính toán chỉ số BMI và tỷ lệ nhân trắc học thời trang may đo, đưa ra gợi ý size chính xác (S, M, L, XL, XXL) kèm mức độ tin cậy (Confidence Score: 96%) và lời khuyên phom dáng cụ thể. Có thể nhấn "Chọn Size Này" để cập nhật trực tiếp vào bộ chọn kích cỡ của sản phẩm.

### 2.5. INN-05: Product Comparison Drawer & Modal (P1)
- **Vị trí:** Thanh dock cố định dưới chân trang (Floating Compare Dock) tự động hiện khi người dùng tích chọn so sánh từ danh mục (`Products.jsx`) hoặc xem chi tiết.
- **Mô tả:** Cho phép so sánh trực diện từ 2 đến 4 sản phẩm thời trang:
  - Bảng ma trận so sánh chi tiết: Ảnh đại diện, Tên, Giá bán, Chất liệu cấu thành (Lụa Mulberry, Len Merino, Cotton Pima), Phom dáng, Đánh giá trung bình, và Trạng thái tồn kho.
  - Nút thêm nhanh vào giỏ hàng ngay trong bảng so sánh.

### 2.6. INN-06: Interactive Shoppable Lookbook Hotspots (P1)
- **Vị trí:** Trang Bộ Sưu Tập / Lookbooks (`/lookbooks` hoặc bộ sưu tập trang chủ).
- **Mô tả:** Từng bức ảnh photoshoot nghệ thuật có gắn các điểm chạm chấm tròn phát sáng (Pulsating Hotspots). Khi rê chuột hoặc chạm vào điểm nóng, một thẻ Preview sản phẩm tinh gọn mở ra với tên, giá bán và nút "Thêm vào giỏ" ngay lập tức mà không cần rời khỏi trải nghiệm thị giác của Lookbook.

---

## 3. Kiến Trúc Tích Hợp Kỹ Thuật

```
[UI Components]
  ├── CompleteTheLook.jsx            ──> ProductDetail.jsx
  ├── AiStyleQuizModal.jsx           ──> Header.jsx & Home.jsx (Zustand personaStore)
  ├── SmartSizeAssistantModal.jsx    ──> ProductDetail.jsx
  ├── NotificationCenter.jsx         ──> Header.jsx (Zustand notificationStore)
  ├── ProductComparisonDrawer.jsx    ──> Products.jsx & Layout (Zustand compareStore)
  └── ShoppableLookbook.jsx          ──> Lookbooks Page / Home.jsx

[State & Stores]
  ├── cartStore.js (addMultipleItems, bundleDiscounts)
  ├── notificationStore.js (in-app notifications, badge count, persistence)
  ├── compareStore.js (compareList, add, remove, clear)
  └── stylePersonaStore.js (quiz results, persona archetype, recommended tags)
```

Tất cả các thành phần tuân thủ nghiêm ngặt:
- Không can thiệp phá vỡ backend API.
- Chuẩn giao diện Haute Couture Minimalist: Màu than đá, chữ vàng Champagne, nền kính mờ `backdrop-blur`.
- Chuẩn WCAG 2.1 AA, responsive 100% trên cả Desktop và Mobile.
- Tự động lưu trữ trạng thái người dùng an toàn vào `localStorage`.
