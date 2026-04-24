# 👗 Web Fashion - Nền Tảng Bán Quần Áo

## 📌 Giới Thiệu

**Web Fashion** là một ứng dụng e-commerce hiện đại được xây dựng bằng **React + Vite** cho phía frontend và **Node.js + Express + MongoDB** cho phía backend. Ứng dụng cung cấp trải nghiệm mua sắm quần áo trực tuyến hoàn chỉnh với các tính năng quản lý sản phẩm, giỏ hàng, đơn hàng và xác thực người dùng.

## ✨ Tính Năng Chính

- 👤 **Xác thực người dùng**: Đăng ký, đăng nhập an toàn với JWT
- 🛍️ **Quản lý sản phẩm**: Xem danh sách, chi tiết sản phẩm, lọc theo danh mục
- 🛒 **Giỏ hàng**: Thêm, sửa, xóa sản phẩm khỏi giỏ
- 📦 **Quản lý đơn hàng**: Tạo, xem, theo dõi đơn hàng
- ⭐ **Đánh giá sản phẩm**: Khách hàng có thể đánh giá sản phẩm
- 👨‍💼 **Bảng điều khiển quản trị**: Quản lý sản phẩm, danh mục, đơn hàng
- 🔔 **Thông báo**: Nhận thông báo về đơn hàng

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 18** - Thư viện UI
- **Vite** - Build tool hiệu suất cao
- **Tailwind CSS** - CSS framework
- **Ant Design** - UI component library
- **React Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication token
- **Bcrypt** - Password hashing
- **Dotenv** - Environment variables

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 4.4
- Git

## ⚙️ Hướng Dẫn Cài Đặt

### 1️⃣ Clone Repository
```bash
git clone <repository-url>
cd REACT-WebFashion
```

### 2️⃣ Cài Đặt Backend

```bash
cd back-end

# Cài đặt các dependencies
npm install

# Các package sẽ cài đặt bao gồm:
# - express: Web framework
# - mongoose: MongoDB ORM
# - jsonwebtoken: JWT authentication
# - bcrypt: Password encryption
# - dotenv: Environment variables
# - slugify: URL slug generation
# - nodemon: Development auto-reload
```

#### Cấu hình Backend

Tạo file `.env` trong thư mục `back-end`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/web-fashion
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3️⃣ Cài Đặt Frontend

```bash
cd front-end

# Cài đặt các dependencies
npm install

# Các package sẽ cài đặt bao gồm:
# - react & react-dom: React libraries
# - vite: Build tool
# - tailwindcss: Styling framework
# - antd: UI components
# - react-icons: Icon set
# - axios: HTTP requests
```

#### Cấu hình Frontend

Nếu cần, tạo file `.env.local` trong thư mục `front-end`:
```
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Chạy Ứng Dụng

### Chạy Backend

```bash
cd back-end
npm start
# hoặc để development với auto-reload:
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### Chạy Frontend

```bash
cd front-end
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Chạy Cả Hai Cùng Lúc (Tùy Chọn)

Mở hai terminal riêng biệt:
- Terminal 1: `cd back-end && npm start`
- Terminal 2: `cd front-end && npm run dev`

## 📁 Cấu Trúc Dự Án

```
REACT-WebFashion/
├── back-end/                 # Backend API
│   ├── src/
│   │   ├── server.js         # Entry point
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   └── utils/            # Helper functions
│   ├── package.json
│   └── .env                  # Environment variables
│
└── front-end/                # Frontend React app
    ├── src/
    │   ├── App.jsx           # Root component
    │   ├── main.jsx          # Entry point
    │   ├── components/       # Reusable components
    │   ├── pages/            # Page components
    │   ├── layout/           # Layout components
    │   ├── hooks/            # Custom hooks
    │   ├── api/              # API calls
    │   ├── assets/           # Images, fonts
    │   ├── services/         # Service layer
    │   ├── utils/            # Helper functions
    │   └── styles/           # Global styles
    ├── public/               # Static assets
    ├── index.html
    ├── package.json
    ├── vite.config.js        # Vite configuration
    └── .env.local            # Environment variables
```

## 🔌 API Endpoints (Ví dụ)

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)

### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart` - Thêm vào giỏ hàng
- `PUT /api/cart/:id` - Cập nhật giỏ hàng
- `DELETE /api/cart/:id` - Xóa khỏi giỏ hàng

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```
Kiểm tra:
- MongoDB service có chạy không
- Connection string trong .env có đúng không
- Database name có chính xác không
```

### Lỗi CORS
```
- Kiểm tra backend có enable CORS không
- Frontend URL có trong whitelist không
```

### Port đã bị sử dụng
```bash
# Thay đổi port trong .env hoặc config file
PORT=5001  # hoặc port khác
```

### Dependencies conflict
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📝 Các Lệnh Hữu Ích

### Backend Commands
```bash
npm start       # Chạy production
npm run dev     # Chạy development với nodemon
npm run build   # Build production
```

### Frontend Commands
```bash
npm run dev     # Development server
npm run build   # Build production
npm run preview # Preview production build
npm run lint    # Kiểm tra linting
```

## 👥 Đóng Góp

Để đóng góp vào dự án:
1. Fork repository
2. Tạo branch tính năng (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Dự án này được cấp phép dưới giấy phép MIT.

## 📞 Liên Hệ

Nếu bạn có câu hỏi hoặc gợi ý, vui lòng liên hệ qua email hoặc tạo Issue trên GitHub.
