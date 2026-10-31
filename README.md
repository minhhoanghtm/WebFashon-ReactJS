# WebFashion — Monochrome Luxury Atelier E-Commerce

WebFashion là nền tảng thương mại điện tử thời trang may đo cao cấp được thiết kế theo phong cách tối giản đơn sắc (Monochrome Luxury). Hệ thống áp dụng kiến trúc tách biệt hoàn toàn giữa Front-end Single Page Application (SPA) và Back-end RESTful API Server, tối ưu hiệu năng tải trang, chuyển động mượt mà và quy trình vận hành toàn diện.

---

## 📸 Hình Ảnh Demo & Trải Nghiệm

<!-- Thêm liên kết ảnh chụp màn hình hoặc GIF demo giao diện tại đây -->
| Trang chủ điện ảnh (Cinematic) | Danh mục & Bộ lọc sản phẩm |
| :---: | :---: |
| ![Trang chủ](https://placehold.co/600x340/0c0c0e/ffffff?text=Cinematic+Homepage) | ![Danh mục sản phẩm](https://placehold.co/600x340/0c0c0e/ffffff?text=Product+Catalog) |

| Chi tiết sản phẩm & 3D Tilt | Xác nhận thanh toán (Checkout) |
| :---: | :---: |
| ![Chi tiết sản phẩm](https://placehold.co/600x340/0c0c0e/ffffff?text=Product+Detail) | ![Thanh toán](https://placehold.co/600x340/0c0c0e/ffffff?text=Checkout+Order) |

---

## 🌐 Liên Kết Triển Khai (Live Demo)

- **Website Khách hàng:** `https://your-domain.com` *(Điền link triển khai thực tế)*
- **Trang Quản trị (Admin):** `https://your-domain.com/admin`
- **Tài liệu API (Swagger / Postman):** `https://api.your-domain.com/docs` *(Nếu có)*

---

## 🛠️ Công Nghệ Sử Dụng

### Front-end (`front-end/package.json`)
- **Core Runtime:** React 19 (`19.2.4`), Vite 8 (`8.0.1`), React Router DOM v7 (`7.13.1`).
- **Styling & Design System:** Tailwind CSS v4 (`@tailwindcss/vite`), typography đơn sắc (Oswald & Plus Jakarta Sans).
- **Chuyển động & Cuộn mượt:** GSAP 3 (`ScrollTrigger`), Lenis smooth scroll.
- **Quản lý dữ liệu & Trạng thái:** TanStack Query (React Query v5), Zustand.
- **Giao diện & Tiện ích:** Lucide React, Axios, SweetAlert2, React Toastify, Socket.io Client.
- **Biểu đồ Quản trị:** Apache ECharts (`echarts`, `echarts-for-react`) được code-split / lazy-load độc lập cho Admin Dashboard.
- **Xử lý nội dung:** Marked, DOMPurify.

### Back-end (`back-end/package.json`)
- **Nền tảng máy chủ:** Node.js, Express (`4.18.2`).
- **Cơ sở dữ liệu & Caching:** MongoDB (Mongoose `9.3.0`), Redis (ioredis `5.11.1`, BullMQ `5.78.0`).
- **Thời gian thực (Real-time):** Socket.io (`4.8.3`).
- **Bảo mật & Xác thực:** JWT (jsonwebtoken), Bcrypt, Google Auth Library (OAuth 2.0), Helmet, Express Rate Limit, Mongo Sanitize.
- **Xác thực dữ liệu (Validation):** Zod (`4.4.3`).
- **Gửi thư & Tác vụ nền:** Nodemailer, Node-cron.
- **Ghi nhật ký (Logging):** Winston.
- **Tích hợp cổng thanh toán:** MoMo Payment API, VNPay Payment API.

---

## ✨ Tính Năng Chính

### 1. Trải nghiệm Khách hàng (Storefront)
- **Trang chủ điện ảnh (Cinematic):** Hero banner toàn cảnh, các chương giới thiệu triết lý may đo, video manifesto, dòng thời gian timeline ngang ghim cuộn (GSAP pin/horizontal scroll), tuyển tập sản phẩm boutique và bản tin atelier.
- **Danh mục & Tìm kiếm (`/products`, `/product/:slug`):**
  - Tìm kiếm theo từ khóa và hỗ trợ tìm kiếm ngữ nghĩa AI.
  - Bộ lọc đa chiều: Phân cấp danh mục (Cha - Con), khoảng giá, màu sắc thực tế, kích cỡ.
  - Sắp xếp linh hoạt theo độ phổ biến, giá tăng/giảm, đánh giá.
  - Thẻ sản phẩm với hiệu ứng nghiêng 3D (GSAP quickTo tilt) theo con trỏ chuột và chuyển ảnh thứ hai khi rê chuột.
- **Giỏ hàng & Thanh toán (`/cart`, `/checkout`):**
  - Quản lý số lượng, cập nhật kho hàng thời gian thực.
  - Áp dụng đồng thời voucher giảm giá sản phẩm và voucher miễn phí vận chuyển.
  - Tính phí giao hàng theo địa giới hành chính (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã).
  - Hỗ trợ 3 phương thức thanh toán: COD (Tiền mặt khi nhận hàng), Ví điện tử MoMo, Cổng thanh toán ngân hàng VNPay.
- **Khuyến mãi & Yêu thích (`/vouchers`, `/favorites`, `/my-coupons`):**
  - Bộ sưu tập mã giảm giá phong cách vé atelier với đường cắt răng cưa CSS.
  - Lưu voucher vào ví cá nhân, kiểm tra điều kiện áp dụng và hạn dùng.
  - Lưu và quản lý danh sách sản phẩm yêu thích (Favorites).
- **Tài khoản & Đơn hàng (`/login`, `/register`, `/verify-otp`, `/reset-password`, `/profile`, `/orders`):**
  - Đăng nhập bằng tài khoản hoặc Google OAuth 2.0.
  - Đăng ký và kích hoạt tài khoản qua mã xác thực OTP gửi về email.
  - Đổi mật khẩu, quên mật khẩu và đặt lại mật khẩu bảo mật.
  - Quản lý thông tin cá nhân, sổ địa chỉ nhận hàng.
  - Theo dõi trạng thái đơn hàng (Chờ xác nhận, Đang xử lý, Đang giao, Hoàn tất, Đã hủy).
- **Hỗ trợ khách hàng & Theo dõi:**
  - Widget chat trực tuyến thời gian thực kết nối với tư vấn viên qua Socket.io.
  - Theo dõi hiển thị sản phẩm (Product Impression tracking) với IntersectionObserver nhằm tối ưu đề xuất mua sắm.

### 2. Quản trị Hệ thống (`/admin`)
- **Dashboard Tổng quan:** Biểu đồ doanh thu theo chu kỳ (7 ngày, 30 ngày, 1 năm), phễu chuyển đổi hành vi (Conversion Funnel), thống kê tương tác voucher, top sản phẩm và từ khóa tìm kiếm.
- **Quản lý Danh mục & Sản phẩm:** Tạo, cập nhật, tải ảnh, quản lý biến thể (màu sắc, size, số lượng tồn kho).
- **Quản lý Đơn hàng:** Xem danh sách, lọc theo trạng thái, cập nhật tiến độ vận chuyển đơn hàng.
- **Quản lý Khuyến mãi (Voucher & Campaign):** Tạo mã giảm giá theo số tiền hoặc phần trăm, phân loại voucher đơn hàng/vận chuyển, thiết lập thời hạn và giới hạn sử dụng.
- **Cấu hình Website:** Cập nhật tên thương hiệu, favicon, logo, địa chỉ trụ sở và tích hợp mã script bên thứ ba.

---

## 📁 Cấu Trúc Thư Mục

```text
REACT-WebFashion/
├── back-end/                     # API Server (Node.js + Express)
│   ├── src/
│   │   ├── api/                  # Tích hợp cổng thanh toán bên ngoài (MoMo, VNPay)
│   │   ├── configs/              # Cấu hình Mongoose, Redis, Socket
│   │   ├── controllers/          # Bộ điều khiển xử lý logic nghiệp vụ
│   │   ├── middlewares/          # Xác thực JWT, phân quyền, kiểm tra rate limit
│   │   ├── models/               # Định nghĩa Schema MongoDB
│   │   ├── routes/               # Khai báo các endpoint API
│   │   ├── services/             # Xử lý nghiệp vụ chính và database
│   │   └── server.js             # Khởi chạy Express server
│   ├── Dockerfile
│   └── package.json
│
├── front-end/                    # Client Application (React 19 + Vite 8)
│   ├── src/
│   │   ├── api/                  # Cấu hình axiosClient và các hàm gọi API
│   │   ├── components/           # UI components dùng chung (Header, Footer, ProductCard...)
│   │   ├── hooks/                # Custom React hooks (useLenis, useTracking, useWebsiteSettings...)
│   │   ├── layouts/              # MainLayout, AuthLayout, AdminLayout
│   │   ├── pages/                # Các trang chức năng (Home, ProductSearch, Checkout, Profile, Admin...)
│   │   ├── routes/               # AppRouter cấu hình định tuyến và code-splitting
│   │   ├── services/             # Lớp kết nối API và chuẩn hóa dữ liệu
│   │   ├── store/                # Zustand stores (auth, cart, favorite, chat...)
│   │   └── index.css             # Tailwind CSS tokens và phong cách Monochrome
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml            # Điều phối các container Docker (App, Mongo, Redis)
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Yêu cầu Tiên quyết
- Node.js (phiên bản 20 trở lên)
- Trình quản lý gói `npm`
- MongoDB (chạy cục bộ cổng `27017` hoặc tài khoản MongoDB Atlas)
- Redis (chạy cục bộ cổng `6379` hoặc qua Docker)

---

### 2. Khởi chạy Dịch vụ Nền (Redis & MongoDB)
Nếu sử dụng Docker Compose:
```bash
docker compose up -d mongo redis
```

---

### 3. Cài đặt & Chạy Back-end

1. Di chuyển vào thư mục back-end:
   ```bash
   cd back-end
   npm install
   ```

2. Tạo file `.env` từ mẫu sau (thay thế bằng cấu hình của bạn):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   FRONTEND_URL=http://localhost:5173

   # Kết nối MongoDB
   MONGO_CONNECTIONSTRING=mongodb://localhost:27017/webfashion

   # Kết nối Redis
   REDIS_URL=redis://localhost:6379

   # Khóa bảo mật JWT
   ACCESS_TOKEN_SECRET=your_jwt_access_secret_64_byte_hex
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_64_byte_hex

   # Cấu hình gửi mail xác thực (Nodemailer)
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_app_password

   # Đăng nhập Google
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

   # Cổng thanh toán MoMo (Môi trường Test)
   MOMO_PARTNER_CODE=your_momo_partner_code
   MOMO_ACCESS_KEY=your_momo_access_key
   MOMO_SECRET_KEY=your_momo_secret_key
   MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
   MOMO_REDIRECT_URL=http://localhost:5173/payment-result
   MOMO_IPN_URL=http://localhost:5000/api/payments/momo/ipn

   # Cổng thanh toán VNPay (Môi trường Sandbox)
   VNP_TMNCODE=your_vnpay_tmncode
   VNP_HASHSECRET=your_vnpay_hashsecret
   VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   VNP_RETURNURL=http://localhost:5173/payment-result
   ```

3. Khởi chạy máy chủ ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   Máy chủ API sẽ chạy tại: `http://localhost:5000`

---

### 4. Cài đặt & Chạy Front-end

1. Di chuyển vào thư mục front-end:
   ```bash
   cd front-end
   npm install --legacy-peer-deps
   ```

2. Tạo file `.env`:
   ```env
   PORT=5173
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   ```

3. Khởi chạy ứng dụng:
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập: `http://localhost:5173`

4. Đóng gói cho Production:
   ```bash
   npm run build
   ```

---

## 🔒 Kiểm Tra An Toàn & Bảo Mật

- File `.env` chứa thông tin nhạy cảm đã được loại trừ qua `.gitignore` và không bao giờ commit lên kho lưu trữ mã nguồn.
- Mọi mật khẩu người dùng đều được mã hóa một chiều bằng thư viện `bcrypt`.
- Cookie chứa Refresh Token được cấu hình bảo vệ chống truy cập trái phép qua script (`httpOnly: true`).
