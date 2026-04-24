# API Testing Guide - REACT-WebFashion

Tài liệu này hướng dẫn cách test tất cả các API endpoints của dự án.

## 📋 Các file test có sẵn

### 1. **API_TEST.http** (REST Client Format)
- Định dạng: REST Client (VS Code Extension)
- Dùng cho: Quick testing trực tiếp trong VS Code
- Cách sử dụng: Cần cài đặt extension "REST Client" trong VS Code

**Installation:**
```bash
# Vào Extensions trong VS Code, tìm "REST Client" của Huachao Mao
# Cài đặt extension
```

**Sử dụng:**
1. Mở file `API_TEST.http`
2. Click vào "Send Request" trên mỗi endpoint
3. Xem kết quả trong tab bên phải

---

### 2. **test-api.js** (Node.js Automated Tests)
- Định dạng: JavaScript với Axios
- Dùng cho: Automated testing, CI/CD pipelines
- Cách sử dụng: Chạy qua Node.js

**Installation:**
```bash
# Đảm bảo đã install axios
npm install axios
```

**Sử dụng:**
```bash
# Chạy test script
node test-api.js

# Hoặc thêm vào package.json scripts
{
  "scripts": {
    "test:api": "node test-api.js"
  }
}

# Sau đó chạy
npm run test:api
```

---

### 3. **REACT-WebFashion-API.postman_collection.json** (Postman Collection)
- Định dạng: Postman Collection v2.1
- Dùng cho: Visual testing, team collaboration
- Cách sử dụng: Import vào Postman

**Installation & Sử dụng:**
1. Mở Postman
2. Click **Import** → **Upload Files**
3. Chọn file `REACT-WebFashion-API.postman_collection.json`
4. Collection sẽ được import với tất cả endpoints
5. Cài đặt variables: `baseUrl`, `accessToken`, `userId`, v.v.

---

## 🚀 Quick Start

### Cách 1: REST Client (Nhanh nhất)
```
1. Cài REST Client extension
2. Mở API_TEST.http
3. Click "Send Request"
```

### Cách 2: Node.js Script (Tự động)
```bash
npm install axios
node test-api.js
```

### Cách 3: Postman (Dễ nhất)
```
1. Mở Postman
2. Import JSON collection
3. Set variables
4. Run requests
```

---

## 📝 Các API Endpoints

### **Public Routes** (Không cần token)

#### Authentication
```
POST   /api/auth/signUp          - Đăng ký
POST   /api/auth/signIn          - Đăng nhập
POST   /api/auth/sendOTP         - Gửi OTP
POST   /api/auth/verify-otp      - Xác thực OTP
POST   /api/auth/resetPassword   - Đặt lại mật khẩu
POST   /api/auth/signOut         - Đăng xuất
```

#### Categories
```
GET    /api/categories           - Lấy tất cả danh mục
GET    /api/categories/:id       - Lấy danh mục theo ID
POST   /api/categories           - Tạo danh mục (Admin)
PUT    /api/categories/:id       - Cập nhật danh mục (Admin)
DELETE /api/categories/:id       - Xóa danh mục (Admin)
```

#### Products
```
GET    /api/products             - Lấy tất cả sản phẩm
GET    /api/products/:slug       - Lấy sản phẩm theo slug
POST   /api/products             - Tạo sản phẩm (Admin)
PUT    /api/products/:id         - Cập nhật sản phẩm (Admin)
DELETE /api/products/:id         - Xóa sản phẩm (Admin)
```

#### Product Items
```
GET    /api/product_items        - Lấy tất cả product items
GET    /api/product_items/:id    - Lấy product item theo ID
POST   /api/product_items        - Tạo product item (Admin)
PUT    /api/product_items/:id    - Cập nhật product item (Admin)
DELETE /api/product_items/:id    - Xóa product item (Admin)
```

---

### **Private Routes** (Cần JWT Token)

#### Cart
```
GET    /api/cart                 - Lấy giỏ hàng
POST   /api/cart                 - Thêm vào giỏ hàng
PUT    /api/cart/:id             - Cập nhật giỏ hàng
DELETE /api/cart/:id             - Xóa khỏi giỏ hàng
```

#### Orders
```
GET    /api/order/:userId        - Lấy đơn hàng của user
POST   /api/order                - Tạo đơn hàng
PUT    /api/order/:id            - Cập nhật đơn hàng
DELETE /api/order/:id            - Xóa đơn hàng
```

#### Order Items
```
GET    /api/order_items          - Lấy tất cả order items
GET    /api/order_items/:id      - Lấy order item theo ID
POST   /api/order_items          - Tạo order item
PUT    /api/order_items/:id      - Cập nhật order item
DELETE /api/order_items/:id      - Xóa order item
```

#### User
```
GET    /api/user/me              - Lấy thông tin user hiện tại
PUT    /api/user/updateProfile   - Cập nhật hồ sơ
PUT    /api/user/updatePassword  - Đổi mật khẩu
```

---

## 🔐 Authentication Flow

### 1. **Sign Up** → **Sign In** → **Get Token**
```bash
# 1. Đăng ký
POST /api/auth/signUp
{
  "email": "user@gmail.com",
  "passWord": "Password123",
  "firstName": "Nguyen",
  "lastName": "Van A",
  "userName": "user123"
}

# 2. Đăng nhập
POST /api/auth/signIn
{
  "userName": "user123",
  "passWord": "Password123"
}
// Nhận được accessToken

# 3. Sử dụng token cho private routes
Authorization: Bearer <accessToken>
```

### 2. **OTP Verification** → **Reset Password**
```bash
# 1. Gửi OTP
POST /api/auth/sendOTP
{
  "email": "user@gmail.com"
}

# 2. Xác thực OTP
POST /api/auth/verify-otp
{
  "email": "user@gmail.com",
  "otp": "123456"
}

# 3. Đặt lại mật khẩu
POST /api/auth/resetPassword
{
  "email": "user@gmail.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

---

## 💡 Testing Tips

### **Postman Tips:**
1. Set environment variables để reuse values:
   ```
   baseUrl: http://localhost:5001/api
   accessToken: (copy từ sign in response)
   userId: (copy từ database hoặc sign in response)
   ```

2. Dùng Pre-request Scripts để tự động set variables:
   ```javascript
   // Post-response script
   pm.environment.set("accessToken", pm.response.json().accessToken);
   ```

3. Tạo Test Scripts để validate response:
   ```javascript
   pm.test("Status is 200", function() {
     pm.response.to.have.status(200);
   });
   ```

### **REST Client Tips:**
1. Lưu giá trị từ response:
   ```
   @token = <copy từ response>
   Authorization: Bearer {{token}}
   ```

2. Environment variables:
   ```
   # Tạo file .rest.env
   @baseUrl = http://localhost:5001/api
   @accessToken = your_token_here
   ```

### **Node.js Script Tips:**
1. Thêm logging chi tiết:
   ```javascript
   console.log('Request:', config);
   console.log('Response:', response.data);
   ```

2. Thêm timeout handling
3. Thêm retry logic cho failed requests

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Cannot find module 'axios'"**
```bash
Solution: npm install axios
```

### **Issue 2: "CORS error"**
```
Solution: Backend có đã enable CORS? 
Check server.js có cors middleware không
```

### **Issue 3: "Unauthorized (401)"**
```
Solution: 
- JWT token hết hạn?
- Token format sai?
- Quên thêm Authorization header?
```

### **Issue 4: "OTP không hợp lệ"**
```
Solution:
- Chắc chắn OTP chưa hết hạn (5 phút)
- Format OTP có đúng không?
- Đã gửi OTP chưa?
```

---

## 📊 Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth | 6 | 100% |
| Categories | 5 | 100% |
| Products | 5 | 100% |
| Product Items | 5 | 100% |
| Cart | 4 | 100% |
| Orders | 4 | 100% |
| Order Items | 5 | 100% |
| User | 3 | 100% |
| **Total** | **37** | **100%** |

---

## 🔄 Automation with CI/CD

### GitHub Actions Example:
```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:api
```

---

## 📞 Support & Troubleshooting

1. **Check Backend is running:**
   ```bash
   curl http://localhost:5001/api/products
   ```

2. **Check MongoDB connection:**
   ```bash
   # Chạy server và xem console logs
   npm run dev
   ```

3. **Check .env file:**
   ```bash
   # Đảm bảo có:
   - MONGODB_URI
   - PORT
   - ACCESS_TOKEN_SECRET
   - EMAIL_USER
   - EMAIL_PASS
   ```

---

## 🎯 Next Steps

1. ✅ Chọn một trong 3 cách test
2. ✅ Setup environment
3. ✅ Chạy test sign up & sign in
4. ✅ Test các endpoints khác
5. ✅ Fix lỗi nếu có
6. ✅ Deploy khi mọi test pass

---

**Happy Testing! 🚀**
