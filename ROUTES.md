# BẢN KHẢO SÁT TOÀN BỘ ROUTE & HỆ THỐNG API BACKEND
**Dự án:** WebFashion Rebuild & Redesign V2  
**Thời gian khảo sát:** 2026-11-15  
**Phạm vi:** Toàn bộ Router Frontend (`front-end/src/routes/AppRouter.jsx`) và Backend API Routes (`back-end/src/routes/index.js`)

---

## 1. HỆ THỐNG ROUTE FRONTEND (48 Routes)

### 1.1. Root Layout (`RootAppLayout`)
Chứa các thành phần toàn cục:
- `CookieConsentBanner`: Banner đồng ý cookie theo GDPR & PDPA
- `PrivacyPreferencesModal`: Modal điều chỉnh quyền riêng tư dữ liệu
- `ToastContainer`: Thông báo trạng thái hệ thống

---

### 1.2. Nhánh Public & Khách hàng (`MainLayout`)
Đường dẫn cha: `/`  
Bao bọc bởi Header điều hướng, Navigation drawer, Footer thương hiệu, Quick Support Chat Drawer.

| STT | Tuyến đường (Path) | Component trang | Quyền hạn (Guard) | Mô tả chức năng |
|:---:|:---|:---|:---:|:---|
| 1 | `/` | `Home` | Public | Trang chủ thương hiệu thời trang: Cinematic Hero, 3D Canvas, Featured Collections, Trending, Flash Sale, Lookbook preview, Brand Philosophy |
| 2 | `/products` | `ProductSearch` | Public | Khám phá & Lọc sản phẩm: Danh mục, Khoảng giá, Màu sắc, Size, Sắp xếp, Phân trang, Tìm kiếm Vector AI |
| 3 | `/product/:slug` | `ProductDetail` | Public | Chi tiết sản phẩm: Gallery ảnh, Chọn biến thể (size, color), Thêm vào giỏ hàng, Yêu thích, Đánh giá, Sản phẩm liên quan |
| 4 | `/cart` | `Cart` | Public / User | Giỏ hàng: Xem sản phẩm, Thay đổi số lượng, Chọn mã giảm giá, Tóm tắt chi phí, Tiến hành thanh toán |
| 5 | `/checkout` | `Checkout` | Public / User | Đặt hàng & Thanh toán: Địa chỉ giao hàng, Phương thức vận chuyển, Voucher áp dụng, Phương thức thanh toán (COD, VNPay, ZaloPay) |
| 6 | `/payment-result` | `PaymentResult` | Public | Kết quả giao dịch từ cổng thanh toán trực tuyến (VNPay/ZaloPay IPN return) |
| 7 | `/payment/:orderId` | `Payment` | Protected (`user`) | Màn hình thanh toán lại / tiếp tục thanh toán cho đơn hàng đã tạo |
| 8 | `/order-lookup` | `OrderLookup` | Public | Tra cứu đơn hàng cho khách vãng lai bằng Mã đơn + SĐT / Token tra cứu |
| 9 | `/favorites` | `Favorites` | Public / User | Danh sách sản phẩm yêu thích (Wishlist) lưu trữ đồng bộ Store/API |
| 10 | `/vouchers` | `VoucherHunting` | VoucherRouteGuard | Săn voucher & Khuyến mãi: Danh sách mã đang hoạt động, Hạn sử dụng, Điều kiện áp dụng |
| 11 | `/lookbooks` | `LookbookList` | Public | Danh sách bộ sưu tập Lookbook thời trang theo mùa (Editorial Stories) |
| 12 | `/policy` | `Policy` | Public | Chính sách chung của thương hiệu thời trang |
| 13 | `/privacy` | `Privacy` | Public | Chính sách bảo mật dữ liệu khách hàng & Quyền riêng tư |
| 14 | `/terms` | `Terms` | Public | Điều khoản & Điều kiện sử dụng dịch vụ |
| 15 | `/shipping` | `Shipping` | Public | Chính sách vận chuyển & Biểu phí giao hàng |
| 16 | `/returns-refunds` | `ReturnsRefunds` | Public | Chính sách đổi trả & Hoàn tiền trong 30 ngày |
| 17 | `/payment-policy` | `PaymentPolicy` | Public | Chính sách và quy định thanh toán an toàn |
| 18 | `/cookies` | `Cookies` | Public | Chính sách quản lý Cookies và công nghệ theo dõi |
| 19 | `/contact-legal` | `ContactLegal` | Public | Thông tin pháp lý & Kênh liên hệ chính thức |
| 20 | `/faq` | `FAQ` | Public | Câu hỏi thường gặp & Hướng dẫn mua sắm |
| 21 | `/guide` | `Guide` | Public | Bảng quy đổi kích cỡ (Size Guide) & Hướng dẫn bảo quản trang phục |
| 22 | `/about` | `Policy` | Public | Giới thiệu câu chuyện thương hiệu & Tầm nhìn thiết kế |
| 23 | `/blog` | `LookbookList` | Public | Tạp chí xu hướng thời trang & Bài viết phong cách |
| 24 | `/my-coupons` | `MyCoupons` | Protected (`user`) | Kho voucher cá nhân đã lưu và khả dụng |
| 25 | `/profile` | `Profile` | Protected (`user`) | Hồ sơ khách hàng: Thông tin cá nhân, Đổi mật khẩu, Cập nhật SĐT OTP |
| 26 | `/profile/data-requests`| `DataRequests` | Protected (`user`) | Quyền GDPR/PDPA: Yêu cầu trích xuất dữ liệu, Yêu cầu xóa tài khoản |
| 27 | `/user/dashboard` | `Profile` | Protected (`user`) | Bảng điều khiển khách hàng cá nhân |
| 28 | `/orders` | `Order` | Protected (`user`) | Quản lý lịch sử đơn hàng: Trạng thái, Chi tiết kiện hàng, Hủy đơn |
| 29 | `/reviews/create` | `Review` | Protected (`user`) | Gửi đánh giá sản phẩm sau khi mua hàng thành công |
| 30 | `*` | `NotFound` | Public | Trang 404 Không tìm thấy trang với liên kết điều hướng về trang chủ |

---

### 1.3. Nhánh Xác thực tài khoản (`AuthLayout`)
Đường dẫn gốc: `/`  
Giao diện tập trung tối giản, sang trọng, không bị phân tán bởi Header/Footer phức tạp.

| STT | Tuyến đường (Path) | Component trang | Quyền hạn | Mô tả chức năng |
|:---:|:---|:---|:---:|:---|
| 31 | `/login` | `Login` | Guest | Đăng nhập tài khoản bằng Email/Password hoặc Google OAuth |
| 32 | `/register` | `Register` | Guest | Đăng ký tài khoản khách hàng mới |
| 33 | `/verify-otp` | `VerifyOTP` | Guest/User | Xác minh mã OTP gửi qua SMS/Email |
| 34 | `/reset-password` | `ResetPassword` | Guest | Đặt lại mật khẩu mới qua mã xác thực an toàn |

---

### 1.4. Nhánh Quản trị hệ thống (`AdminLayout`)
Đường dẫn cha: `/admin`  
Bảo vệ bằng `ProtectedRoute(allowedRoles: ["admin"])`. Lazy-loaded với AdminFallbackSkeleton.

| STT | Tuyến đường (Path) | Component trang | Mô tả chức năng quản trị |
|:---:|:---|:---|:---|
| 35 | `/admin` (index) | `Dashboard` | Tổng quan số liệu kinh doanh: Doanh thu, Đơn hàng, Khách hàng, Biểu đồ tăng trưởng |
| 36 | `/admin/categories` | `CatalogManagement` | Quản lý danh mục & phân cấp nhóm sản phẩm thời trang |
| 37 | `/admin/products` | `ProductManagement` | Quản lý sản phẩm: Biến thể (size, color, SKU), Giá bán, Tồn kho, Ảnh đại diện |
| 38 | `/admin/orders` | `OrderManagement` | Quản trị đơn hàng: Xử lý quy trình (Chờ xác nhận -> Đang xử lý -> Đang giao -> Đã giao -> Đã hủy) |
| 39 | `/admin/chats` | `AdminChatManagement`| Trung tâm tin nhắn CSKH: Trò chuyện trực tiếp với khách hàng, gửi gợi ý sản phẩm |
| 40 | `/admin/customers` | `UserManagement` | Quản lý người dùng: Phân quyền vai trò, Trạng thái hoạt động, Lịch sử mua sắm |
| 41 | `/admin/coupons` | `CouponManagement` | Quản lý mã giảm giá: Tạo khuyến mãi theo % hoặc số tiền, Số lượt dùng, Hạn sử dụng |
| 42 | `/admin/campaigns` | `CampaignManagement`| Quản lý chiến dịch tiếp thị: Flash Sale, Mùa giảm giá, Đồng hồ đếm ngược |
| 43 | `/admin/banners` | `BannerManagement` | Quản lý banner quảng cáo trang chủ & slider |
| 44 | `/admin/lookbooks` | `LookbookManagement`| Quản lý bộ sưu tập Lookbook: Ảnh nghệ thuật, Gắn thẻ sản phẩm liên quan |
| 45 | `/admin/ab-testing` | `ABTestingManagement`| Quản trị thử nghiệm A/B: Tỷ lệ phân luồng, Đo lường chuyển đổi |
| 46 | `/admin/user-activity`| `UserActivityMonitoring`| Giám sát hành vi người dùng trực tiếp, Heatmap, Luồng di chuyển (Session Journey) |
| 47 | `/admin/pages` | `PageManagement` | Quản trị nội dung trang tĩnh & các section động trên trang chủ |
| 48 | `/admin/settings` | `WebsiteSettingsManagement`| Cấu hình cửa hàng: Tên shop, Logo, Hotline, Mạng xã hội, Tích hợp cổng thanh toán |

---

## 2. DANH MỤC API BACKEND ĐANG CÓ (Mapped Endpoint)

### 2.1. Xác thực & Tài khoản (`/api/auth`, `/api/user`)
- `POST /api/auth/register`: Đăng ký tài khoản mới
- `POST /api/auth/login`: Đăng nhập lấy access_token + refresh_token
- `POST /api/auth/logout`: Đăng xuất và vô hiệu hóa refresh_token
- `POST /api/auth/refresh-token`: Làm mới token tự động
- `POST /api/auth/google`: Đăng nhập / đăng ký nhanh bằng Google OAuth
- `POST /api/auth/send-otp`: Gửi mã OTP xác nhận
- `POST /api/auth/verify-otp`: Kiểm tra mã OTP hợp lệ
- `POST /api/auth/forgot-password`: Yêu cầu cấp lại mật khẩu
- `POST /api/auth/reset-password`: Đặt lại mật khẩu mới
- `GET /api/user/me`: Lấy thông tin cá nhân của người dùng hiện tại
- `PUT /api/user/profile`: Cập nhật họ tên, địa chỉ, số điện thoại
- `PUT /api/user/change-password`: Thay đổi mật khẩu tài khoản
- `GET /api/user/all`: [Admin] Lấy danh sách toàn bộ khách hàng
- `PUT /api/user/:id`: [Admin] Cập nhật vai trò / khóa tài khoản

### 2.2. Danh mục & Sản phẩm (`/api/categories`, `/api/products`, `/api/product_variants`)
- `GET /api/categories`: Lấy danh sách danh mục thời trang
- `POST /api/categories`: [Admin] Thêm danh mục mới
- `PUT /api/categories/:id`: [Admin] Cập nhật danh mục
- `DELETE /api/categories/:id`: [Admin] Xóa danh mục
- `GET /api/products`: Lấy danh sách sản phẩm (có filter, pagination, sort, search)
- `GET /api/products/:slugOrId`: Lấy chi tiết sản phẩm và các biến thể liên quan
- `POST /api/products`: [Admin] Tạo sản phẩm mới
- `PUT /api/products/:id`: [Admin] Cập nhật thông tin sản phẩm
- `DELETE /api/products/:id`: [Admin] Xóa mềm/xóa sản phẩm
- `GET /api/products/featured`: Lấy danh sách sản phẩm nổi bật
- `GET /api/products/new-arrivals`: Lấy danh sách sản phẩm mới về
- `GET /api/products/flash-sale`: Lấy sản phẩm đang trong chương trình giảm giá sốc

### 2.3. Giỏ hàng & Yêu thích (`/api/cart`, `/api/cart_items`, `/api/favorites`)
- `GET /api/cart`: Lấy giỏ hàng của người dùng hiện tại
- `POST /api/cart_items`: Thêm sản phẩm và biến thể vào giỏ
- `PUT /api/cart_items/:id`: Cập nhật số lượng sản phẩm trong giỏ
- `DELETE /api/cart_items/:id`: Xóa sản phẩm khỏi giỏ hàng
- `DELETE /api/cart`: Làm rỗng toàn bộ giỏ hàng
- `GET /api/favorites`: Lấy danh sách sản phẩm yêu thích của user
- `POST /api/favorites/:productId`: Thêm / xóa sản phẩm khỏi mục yêu thích (toggle)

### 2.4. Đơn hàng & Thanh toán (`/api/order`, `/api/payments`, `/api/shipping`)
- `POST /api/order`: Tạo đơn hàng mới (hỗ trợ cả tài khoản và khách vãng lai)
- `GET /api/order/my-orders`: Lấy danh sách đơn hàng của người dùng đang đăng nhập
- `GET /api/order/:id`: Lấy chi tiết đơn hàng
- `PUT /api/order/:id/cancel`: Hủy đơn hàng khi chưa chuyển sang giao vận
- `POST /api/order/lookup`: Tra cứu thông tin đơn hàng cho khách vãng lai
- `GET /api/order/admin/all`: [Admin] Lấy toàn bộ đơn hàng của hệ thống
- `PUT /api/order/admin/:id/status`: [Admin] Cập nhật trạng thái đơn hàng
- `POST /api/payments/create-url`: Khởi tạo liên kết thanh toán VNPay / ZaloPay
- `GET /api/payments/vnpay-return`: Xử lý redirect phản hồi từ VNPay
- `POST /api/shipping/calculate`: Tính phí giao hàng theo khu vực và trọng lượng

### 2.5. Khuyến mãi & Chiến dịch (`/api/vouchers`, `/api/campaigns`, `/api/banners`)
- `GET /api/vouchers/available`: Lấy các mã voucher đang phát hành
- `GET /api/vouchers/my`: Lấy danh sách voucher trong ví của user
- `POST /api/vouchers/claim/:id`: Lưu voucher vào ví
- `POST /api/vouchers/apply`: Xác thực và áp dụng mã voucher cho đơn hàng
- `GET /api/campaigns/active`: Lấy các chiến dịch khuyến mãi đang hoạt động
- `GET /api/banners`: Lấy danh sách banner quảng cáo hoạt động

### 2.6. Nội dung & Bộ sưu tập (`/api/lookbooks`, `/api/pages`, `/api/reviews`)
- `GET /api/lookbooks`: Danh sách các lookbook thời trang
- `GET /api/lookbooks/:slug`: Chi tiết lookbook và sản phẩm liên kết
- `GET /api/pages/:slug`: Lấy nội dung trang tĩnh (policy, terms, shipping...)
- `GET /api/reviews/product/:productId`: Lấy đánh giá của sản phẩm
- `POST /api/reviews`: Gửi đánh giá và chấm điểm sao cho sản phẩm

### 2.7. Trò chuyện & Hỗ trợ CSKH (`/api/chat`, `/api/admin/chat`)
- `GET /api/chat/session`: Lấy hoặc tạo phiên chat của khách hàng
- `GET /api/chat/messages/:sessionId`: Lấy lịch sử trò chuyện
- `POST /api/chat/message`: Gửi tin nhắn mới tới tư vấn viên / bot
- `GET /api/admin/chats`: [Admin] Lấy danh sách các cuộc trò chuyện cần hỗ trợ
- `POST /api/admin/chat/reply`: [Admin] Nhân viên trả lời khách hàng

### 2.8. Hệ thống gợi ý & AI Vector (`/api/ai`, `/api/recommendations`, `/api/search`)
- `GET /api/ai/smart-search`: Tìm kiếm ngữ nghĩa nâng cao (Vector Search)
- `GET /api/recommendations/personalized`: Gợi ý sản phẩm dựa trên hành vi xem hàng
- `POST /api/events`: Ghi nhận sự kiện xem hàng, thêm giỏ để cá nhân hóa

### 2.9. Quyền riêng tư & Cài đặt hệ thống (`/api/privacy`, `/api/settings`)
- `POST /api/privacy/export-data`: Yêu cầu sao lưu dữ liệu cá nhân
- `POST /api/privacy/delete-account`: Yêu cầu hủy và xóa dữ liệu tài khoản
- `GET /api/settings`: Lấy cấu hình chung của website
- `PUT /api/settings`: [Admin] Cập nhật thông tin website
