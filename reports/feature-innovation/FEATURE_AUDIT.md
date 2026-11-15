# FEATURE_AUDIT.md — Comprehensive Feature Audit

**Project:** REACT-WebFashion  
**Auditor:** Principal Full-Stack Engineer & E-commerce Product Architect  
**Branch:** `redesign-v2`  
**Date:** 2026-11-16  

---

## 1. Hệ Thống 20 Phân Hệ Chức Năng Hiện Có

| ID | Chức năng | Route | Component / Store | API / Backend Endpoint | Trạng thái | Vấn đề phát hiện | Hướng cải tiến & Đổi mới |
|---|---|---|---|---|---|---|---|
| F-01 | **Authentication & Authorization** | `/login`, `/register`, `/verify-otp`, `/reset-password` | `AuthPages.jsx`, `authStore.js` | `POST /api/auth/*` | Hoàn chỉnh | Chưa có tùy chọn ghi nhớ phiên đăng nhập nâng cao và tự động đồng bộ giỏ hàng khách vãng lai sau đăng nhập. | Bổ sung cơ chế merge guest cart và lưu trữ phiên an toàn. |
| F-02 | **Product Catalog** | `/products` | `Products.jsx`, `ProductCard.jsx` | `GET /api/products`, `GET /api/categories` | Hoàn chỉnh | Danh mục hiển thị danh sách tĩnh, thiếu tính năng so sánh trực diện giữa 2 sản phẩm cùng phân khúc. | Triển khai **Product Comparison Drawer** so sánh đa thuộc tính. |
| F-03 | **Product Search & Filtering** | `/products` | `Products.jsx` | `GET /api/products?search=...` | Hoàn chỉnh | Bộ tìm kiếm mới lọc theo từ khóa chính xác, chưa hỗ trợ tìm kiếm bằng ngôn ngữ tự nhiên hoặc phân tích ý định. | Tích hợp **AI Smart Natural Language Search** nhận diện budget và dịp sử dụng. |
| F-04 | **Product Details & Variants** | `/product/:slug` | `ProductDetail.jsx` | `GET /api/products/:slug`, `GET /api/products/:id/availability` | Hoàn chỉnh | Khách hàng mua đơn lẻ từng món, thiếu gợi ý phối trọn bộ trang phục và thiếu hỗ trợ chọn size thông minh. | Triển khai **Complete The Look (Bundle 1-Click Buy)** và **Smart Size Assistant**. |
| F-05 | **Shopping Cart** | `/cart` | `Cart.jsx`, `cartStore.js` | `GET /api/cart`, `POST /api/cart_items` | Hoàn chỉnh | Giỏ hàng chỉ tính tổng tiền cơ bản, thiếu các gợi ý tăng giá trị đơn hàng (AOV) thông minh. | Triển khai **Smart Cart Assistant** thông báo ngưỡng freeship và gợi ý bundle tiết kiệm. |
| F-06 | **Checkout & Payments** | `/checkout`, `/payment-result` | `Checkout.jsx`, `PaymentResult.jsx` | `POST /api/order`, `POST /api/payments/*` | Hoàn chỉnh | Quy trình đặt hàng đầy đủ COD, MoMo, VNPay. | Bổ sung mã giảm giá tự động tối ưu nhất cho giỏ hàng. |
| F-07 | **Orders & Tracking** | `/orders`, `/order-lookup` | `Orders.jsx`, `OrderLookup.jsx` | `GET /api/order/my-orders`, `GET /api/order/lookup` | Hoàn chỉnh | Tiến trình đơn hàng hiển thị các mốc chuẩn. | Tích hợp cập nhật thời gian thực vào Notification Center. |
| F-08 | **Wishlist / Favorites** | `/favorites` | `Favorites.jsx` | `GET /api/favorites` | Hoàn chỉnh | Danh sách sản phẩm yêu thích phẳng, thiếu phân nhóm bộ sưu tập cá nhân và cảnh báo giảm giá. | Nâng cấp **Smart Wishlist** hỗ trợ lưu outfit và theo dõi tồn kho. |
| F-09 | **Reviews & Ratings** | `/reviews/create` | `CreateReview.jsx` | `POST /api/reviews` | Hoàn chỉnh | Đánh giá số sao và nhận xét kèm bình luận. | Bổ sung huy hiệu "Đã mua hàng chính hãng" (Verified Buyer). |
| F-10 | **Customer Profile & GDPR** | `/profile`, `/user/dashboard`, `/profile/data-requests` | `CustomerPages.jsx` | `GET /api/user/me`, `POST /api/privacy/request` | Hoàn chỉnh | Quản lý thông tin, sổ địa chỉ và yêu cầu xuất dữ liệu GDPR đạt chuẩn. | Bổ sung lưu trữ **Fashion Persona Badge** từ kết quả Style Quiz. |
| F-11 | **AI Shopping Assistant** | Global Modal | `AiAssistantModal.jsx` | `POST /api/ai/chat` | Hoàn chỉnh | Chatbox tương tác tốt nhưng chưa cá nhân hóa sâu theo bài khảo sát sở thích riêng biệt của từng người dùng. | Kết nối với **AI Style Quiz** để cá nhân hóa câu trả lời. |
| F-12 | **AI Recommendations** | `/`, `/products` | `Home.jsx`, `SignalFabricCanvas.jsx` | `GET /api/recommendations` | Hoàn chỉnh | Gợi ý sản phẩm dựa trên catalog chung. | Đề xuất sản phẩm theo hồ sơ phong cách cá nhân hóa. |
| F-13 | **Promotions & Coupons** | `/vouchers`, `/my-coupons` | `Vouchers.jsx`, `MyCoupons.jsx` | `GET /api/vouchers` | Hoàn chỉnh | Thẻ voucher phong cách may đo, sao chép mã và lưu vào ví. | Tự động áp dụng voucher có lợi nhất khi thanh toán. |
| F-14 | **Admin Management Suite** | `/admin/*` (14 routes) | `AdminPages.jsx`, `AdminLayout.jsx` | `GET /api/admin/*` | Hoàn chỉnh | Đầy đủ bảng dashboard, sản phẩm, đơn hàng, khách hàng, chiến dịch, banner, lookbook, tin nhắn CSKH. | Bổ sung công cụ AI hỗ trợ viết mô tả sản phẩm may đo. |
| F-15 | **Inventory Management** | `/admin/products` | `AdminPages.jsx` | `GET /api/products` | Hoàn chỉnh | Theo dõi số lượng tồn kho từng biến thể size/màu. | Cảnh báo tồn kho thấp (Low-Stock Alert) theo thời gian thực. |
| F-16 | **Analytics & A/B Testing** | `/admin/ab-testing`, `/admin/user-activity` | `AdminPages.jsx` | `GET /api/experiments`, `GET /api/events/admin/realtime` | Hoàn chỉnh | Theo dõi luồng sự kiện hành vi và thử nghiệm A/B. | Phân tích phễu chuyển đổi (Conversion Funnel). |
| F-17 | **Notification System** | Toàn trang | **CHƯA CÓ** | Client Store / Backend WebSocket | **THIẾU** | Người dùng không nhận được thông báo in-app về cập nhật đơn hàng, voucher mới hay cảnh báo giảm giá. | Triển khai **Smart Notification Center** trên Header với chuông báo và badge đếm. |
| F-18 | **Customer Support** | `/faq`, `/contact-legal`, `/admin/chats` | `StaticPages.jsx`, `AdminChats` | `GET /api/admin/conversations` | Hoàn chỉnh | Accordion tra cứu và trung tâm CSKH trực tiếp. | Tích hợp hotline showroom trực quan. |
| F-19 | **Mobile Experience** | Toàn bộ 48 routes | Layouts & Components | Responsive CSS | Hoàn chỉnh | 48/48 routes đạt PASS 100%, không tràn layout ngang, touch targets >= 44px. | Giữ vững chuẩn thiết kế khi bổ sung tính năng mới. |
| F-20 | **Accessibility & Motion** | Toàn bộ 48 routes | `tokens.css`, `index.css` | Local Tokens | Hoàn chỉnh | Phím tắt `:focus-visible`, fallback `prefers-reduced-motion` cho Three.js Silk Canvas. | Mở rộng accessibility cho các modal và drawer mới. |
