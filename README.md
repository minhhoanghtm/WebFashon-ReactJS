# 👗 WebFashion - Premium Fashion E-Commerce Platform

WebFashion là một nền tảng thương mại điện tử mua sắm thời trang cao cấp, được xây dựng theo kiến trúc phân tách rõ ràng giữa **Client (React + Vite)** và **API Server (Node.js + Express + MongoDB + Redis)**. 

Dự án sở hữu thiết kế giao diện theo phong cách tối giản đơn sắc (Monochromatic) sang trọng, hỗ trợ chuyển đổi giao diện Sáng/Tối linh hoạt và tích hợp các tính năng vận hành doanh nghiệp hoàn chỉnh.

---

## 🚀 Tính Năng Nổi Bật

### 👤 Xác thực & Quản lý phiên (JWT + Redis Session)
- **Cơ chế bảo mật kép:** Sử dụng Access Token (định dạng JWT có JTI ngẫu nhiên) lưu ở LocalStorage và Refresh Token lưu trong Cookie bảo mật (`httpOnly`, `secure`, `sameSite: none`).
- **Gia hạn phiên chủ động (Proactive sliding session renewal):** Client tự động giải mã và kiểm tra thời hạn sống của Access Token trước mỗi yêu cầu API. Nếu thời gian còn lại dưới **5 phút**, Client sẽ chủ động gửi yêu cầu làm mới để gia hạn phiên làm việc thêm 30 phút mà không làm gián đoạn hay gây lỗi 401 cho người dùng.
- **progressive throttling:** Khóa đăng nhập tạm thời dựa trên số lần thử thất bại liên tiếp (lưu vết bằng Redis atomic counters).
- **Đăng xuất đa thiết bị (Sign out all devices):** Thu hồi toàn bộ token liên quan đến UserId được lưu trữ trong Redis whitelist.

### 🛍️ Quản lý danh mục & Sản phẩm nâng cao
- **Quản lý đa hình ảnh:** Cho phép quản trị viên thêm nhiều liên kết ảnh cho một sản phẩm. Hình ảnh đầu tiên sẽ được chọn làm ảnh đại diện hiển thị đại diện chính.
- **Huy hiệu chiết khấu trực quan:** Tự động tính toán và hiển thị phần trăm giảm giá chính xác (ví dụ: `-$15%`) thay vì các huy hiệu tĩnh, tăng tính hấp dẫn khi mua sắm.
- **Chống crop ảnh thông minh:** Catalog sản phẩm sử dụng tỉ lệ co giãn ảnh chuẩn `object-contain` kết hợp với màu nền bổ trợ, bảo toàn tỷ lệ ảnh gốc của người mẫu mà không bị cắt xén góc.

### ⚙️ Hệ thống Cấu hình Website Động (Admin Settings)
- **Đồng bộ Favicon & Tiêu đề:** Favicon và Tiêu đề website được cập nhật động từ cơ sở dữ liệu qua Zustand store. Trình duyệt tự động thay đổi favicon và title tab tương ứng theo cấu hình mới của Admin trong Database.
- **Chọn địa chỉ 3 cấp độ:** Sử dụng bộ dữ liệu phân cấp hành chính (Tỉnh/Thành phố $\rightarrow$ Quận/Huyện $\rightarrow$ Phường/Xã) tải qua API, đi kèm với hộp xem trước địa chỉ trụ sở chi tiết.
- **Tích hợp mã nhúng Scripts:** Cho phép admin chèn trực tiếp các mã theo dõi phân tích hoặc chatbot như *Google Tag Manager*, *Google Analytics ID (G-ID)*, *Facebook Pixel* và *Live Chat Script*.

### 💬 Chat Hỗ Trợ Trực Tuyến & Đơn Hàng
- **Websockets Live Chat:** Khách hàng có thể kết nối chat trực tiếp với đội ngũ Admin trực tuyến thông qua kênh truyền Websocket thời gian thực.
- **Quy trình xử lý đơn hàng chi tiết:** Theo dõi và cập nhật trạng thái đơn hàng qua các bước: *Chờ xác nhận* $\rightarrow$ *Đang xử lý* $\rightarrow$ *Đang giao* $\rightarrow$ *Đã giao* / *Đã hủy*.

---

## 🛠️ Công Nghệ Sử Dụng

### Phân Hệ Front-end (Client)
- **Vite 8** + **React 18** (Runtime tối ưu hiệu năng)
- **Tailwind CSS v4** (Hệ thống thiết kế tiện ích thế hệ mới)
- **Zustand** (Quản lý trạng thái gọn nhẹ, chia nhỏ Store cho Auth và WebsiteSettings)
- **React Query (@tanstack/react-query)** (Caching và đồng bộ hóa dữ liệu API)
- **Ant Design** (Thư viện UI phụ trợ cho bảng biểu và biểu đồ)
- **React Toastify** (Hiển thị thông báo, đã cấu hình cố định ở góc phải trên cùng `top-right`)

### Phân Hệ Back-end (API Server)
- **Node.js** + **Express**
- **MongoDB** + **Mongoose** (NoSQL Database lưu trữ dữ liệu sản phẩm, đơn hàng, người dùng và cài đặt)
- **Redis** (Cơ chế whitelist/blacklist Token, lưu trữ phiên đăng nhập và khóa tài khoản tạm thời)
- **Zod** (Khung xác thực dữ liệu đầu vào mạnh mẽ, hỗ trợ `.passthrough()` lưu trữ cấu hình linh động)

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
REACT-WebFashion/
├── back-end/                     # API Server & Services
│   ├── src/
│   │   ├── configs/              # Cấu hình Mongoose, Redis
│   │   ├── middlewares/          # Xác thực JWT, phân quyền Admin, xử lý lỗi
│   │   ├── modules/              # Các phân hệ logic (Auth, Users, Products, Carts, Orders...)
│   │   │   ├── auth/             # Quản lý token, kiểm tra whitelist Redis
│   │   │   └── websiteSettings/  # Lưu trữ cấu hình SEO, Address, Integration Scripts
│   │   └── app.js                # Khởi tạo Express app
│   └── docker-compose.yml        # Docker hỗ trợ chạy Redis nhanh
│
└── front-end/                    # Single Page Application
    ├── src/
    │   ├── api/                  # Khởi tạo axiosClient với cơ chế tự động gia hạn phiên
    │   ├── components/
    │   │   ├── admin/            # Bộ chọn địa chỉ 3 cấp (HeadquartersAddressPicker)
    │   │   └── layout/           # Sidebar cuộn mượt (overflow-y-auto)
    │   ├── store/                # Zustand Store (auth.store, websiteSettings.store)
    │   ├── pages/
    │   │   └── admin/            # Dashboard và Cài đặt Website (WebsiteSettingsManagement)
    │   ├── index.css             # Cấu hình Theme đơn sắc và Custom Dark Mode
    │   └── App.jsx               # Khởi chạy session & định tuyến ứng dụng
    └── vite.config.js            # Cấu hình build Vite
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Khởi động các dịch vụ bổ trợ (Redis & MongoDB)
Nếu bạn sử dụng Docker, có thể chạy nhanh Redis bằng Docker Compose có sẵn trong dự án:
```bash
docker-compose up -d redis
```
Đồng thời đảm bảo rằng bạn đã khởi động cơ sở dữ liệu MongoDB cục bộ hoặc có kết nối MongoDB Atlas.

### 2. Cài đặt & Khởi chạy Backend
Di chuyển vào thư mục `back-end`, tạo file cấu hình `.env` dựa theo mẫu:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/web-fashion
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key
```
Sau đó tiến hành cài đặt dependencies và khởi chạy chế độ phát triển:
```bash
cd back-end
npm install
npm run dev
```

### 3. Cài đặt & Khởi chạy Frontend
Di chuyển vào thư mục `front-end`, tạo file cấu hình `.env` kết nối API:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
Tiến hành cài đặt và khởi chạy:
```bash
cd front-end
npm install
npm run dev
```
Mở trình duyệt truy cập ứng dụng tại địa chỉ: `http://localhost:5173`.

---

## 📝 Xác Minh & Kiểm Thử
Dự án được trang bị sẵn các mã kịch bản kiểm thử nhanh để xác minh tính ổn định của API và dữ liệu:
- **Kiểm thử logic xác thực đầu vào:** `node back-end/src/scratch/test_validators.js`
- **Kiểm thử lưu dữ liệu cài đặt trực tiếp:** `node back-end/src/scratch/test_live_save.js`
- **Biên dịch Frontend:** Chạy lệnh `npm run build` bên trong thư mục `front-end` để đảm bảo dự án luôn sẵn sàng đóng gói cho môi trường Production mà không phát sinh lỗi kiểu hoặc cú pháp.
