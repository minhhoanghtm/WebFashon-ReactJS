# Tài liệu API Xác thực SMS & OTP (Authentication API)

Tài liệu này tổng hợp toàn bộ các điểm cuối API phục vụ quy trình xác thực người dùng qua Số điện thoại & mã OTP SMS (kèm hỗ trợ Fallback qua Email) cho hệ thống **404 STUDIO WebFashion**.

---

## 1. Nguyên tắc cốt lõi & Bảo mật

1. **Chuẩn hóa số điện thoại Việt Nam**:
   - Chấp nhận các định dạng đầu vào: `0xxxxxxxxx`, `+84xxxxxxxxx`, `84xxxxxxxxx`.
   - Hệ thống tự động chuẩn hóa và lưu trữ đồng nhất theo chuẩn quốc tế: `+84xxxxxxxxx`.
   - Kiểm tra các đầu số di động hợp lệ tại Việt Nam: `03x`, `05x`, `07x`, `08x`, `09x`.

2. **Quản lý OTP**:
   - Sinh 6 chữ số ngẫu nhiên mật mã an toàn bằng `crypto.randomInt(100000, 1000000)`.
   - Băm HMAC-SHA256 trước khi lưu vào Redis với TTL 5 phút (300 giây).
   - So sánh OTP bằng `crypto.timingSafeEqual` nhằm ngăn chặn các tấn công timing attack.
   - Cơ chế bảo vệ: Cooldown 60s giữa các lần gửi, tối đa 5 lần thử sai cho mỗi mã OTP, tối đa 5 OTP/giờ/số điện thoại, tối đa 20 OTP/giờ/IP.
   - OTP dùng 1 lần (Single-use): Tự động xóa khỏi Redis ngay sau khi xác thực thành công hoặc khi mã mới được tạo ra.

3. **Chống dò quét tài khoản (Anti-Account Enumeration)**:
   - Tại luồng quên mật khẩu (`POST /api/auth/password/forgot`), API luôn trả về mã HTTP `200` cùng thông điệp chung `Nếu thông tin tài khoản hợp lệ, mã OTP khôi phục mật khẩu đã được gửi.` bất kể số điện thoại/email có tồn tại trong hệ thống hay không.

4. **Thu hồi phiên làm việc khi đổi mật khẩu**:
   - Khi đặt lại mật khẩu thành công (`POST /api/auth/password/reset`), toàn bộ các Refresh Token và Access Token hiện có của người dùng trên mọi thiết bị sẽ bị vô hiệu hóa lập tức trong Redis.

5. **Đa nhà cung cấp SMS (SMS Providers)**:
   - Hỗ trợ kiến trúc Provider chuyển đổi linh hoạt (`console`, `esms`, `speedsms`).
   - Môi trường dev mặc định in OTP ra log máy chủ (che thông tin cá nhân).
   - Tự động fallback sang Email OTP (qua Nodemailer/BullMQ) nếu nhà cung cấp SMS gặp sự cố kỹ thuật hoặc tài khoản hết hạn mức.

---

## 2. Danh sách Endpoint API

### 2.1. Đăng ký tài khoản bằng SMS OTP

#### Bước 1: Gửi OTP đăng ký
- **Endpoint**: `POST /api/auth/register/send-otp`
- **Rate Limit**: 5 req / 15 phút (IP)
- **Request Body**:
```json
{
  "phone": "0901234567",
  "channel": "sms"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "phone": "+84 90*** ***67",
    "cooldown": 60,
    "ttl": 300
  },
  "message": "Mã OTP đăng ký đã được gửi đến số điện thoại của bạn."
}
```
- **Error Codes**:
  - `422 Unprocessable Entity`: `PHONE_INVALID` - Số điện thoại không đúng định dạng di động Việt Nam.
  - `409 Conflict`: `PHONE_EXISTS` - Số điện thoại này đã được đăng ký.
  - `429 Too Many Requests`: `OTP_COOLDOWN` / `OTP_HOURLY_LIMIT_PHONE` / `RATE_LIMITED`.

#### Bước 2: Xác thực OTP và khởi tạo tài khoản
- **Endpoint**: `POST /api/auth/register/verify`
- **Rate Limit**: 10 req / 15 phút
- **Request Body**:
```json
{
  "phone": "0901234567",
  "otp": "123456",
  "fullName": "Nguyễn Văn A",
  "passWord": "Password123@",
  "email": "user@example.com", // Tùy chọn
  "sex": "male",              // Tùy chọn: "male" | "female"
  "birthday": "2000-01-01"     // Tùy chọn
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "userId": "6724...",
    "user": {
      "id": "6724...",
      "fullName": "Nguyễn Văn A",
      "phone": "+84901234567",
      "role": "user"
    }
  },
  "message": "Đăng ký tài khoản thành công!"
}
```
*(Kèm cookie `refreshToken` HttpOnly)*

---

### 2.2. Đăng nhập hệ thống

#### Cách 1: Đăng nhập bằng Email/SĐT + Mật khẩu
- **Endpoint**: `POST /api/auth/login` (hoặc `POST /api/auth/signIn`)
- **Rate Limit**: 10 req / 15 phút
- **Request Body**:
```json
{
  "emailOrPhone": "0901234567", // Chấp nhận cả Email hoặc Số điện thoại
  "passWord": "Password123@"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "userId": "6724...",
    "user": {
      "fullName": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "+84901234567"
    }
  },
  "message": "User Nguyễn Văn A đã đăng nhập thành công!"
}
```

#### Cách 2: Đăng nhập không mật khẩu bằng SMS OTP
- **Gửi OTP đăng nhập**: `POST /api/auth/login/otp/send`
  ```json
  { "phone": "0901234567" }
  ```
- **Xác thực OTP đăng nhập**: `POST /api/auth/login/otp/verify`
  ```json
  {
    "phone": "0901234567",
    "otp": "123456"
  }
  ```

---

### 2.3. Khôi phục mật khẩu (Forgot & Reset Password)

#### Bước 1: Yêu cầu OTP khôi phục
- **Endpoint**: `POST /api/auth/password/forgot`
- **Request Body**:
```json
{
  "identifier": "0901234567" // Hoặc email
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "identifier": "+84 90*** ***67",
    "cooldown": 60,
    "channel": "sms"
  },
  "message": "Nếu thông tin tài khoản hợp lệ, mã OTP khôi phục mật khẩu đã được gửi."
}
```

#### Bước 2: Đặt lại mật khẩu mới
- **Endpoint**: `POST /api/auth/password/reset`
- **Request Body**:
```json
{
  "identifier": "0901234567",
  "otp": "123456",
  "newPassword": "NewStrongPassword123@"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công. Toàn bộ phiên đăng nhập cũ đã được đăng xuất."
}
```

---

### 2.4. Gửi lại mã OTP (Resend OTP)
- **Endpoint**: `POST /api/auth/otp/resend`
- **Request Body**:
```json
{
  "identifier": "0901234567",
  "purpose": "register" // "register" | "login" | "reset_password" | "verify_phone"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "identifier": "+84 90*** ***67",
    "cooldown": 60,
    "ttl": 300
  },
  "message": "Mã OTP mới đã được gửi thành công."
}
```

---

### 2.5. Cập nhật Số điện thoại hồ sơ cá nhân (Protected)

- **Gửi OTP xác thực số mới**: `PUT /api/user/phone/send-otp`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ "phone": "0912345678" }`
- **Xác thực và lưu số mới**: `PUT /api/user/phone/verify`
  - Header: `Authorization: Bearer <accessToken>`
  - Body: `{ "phone": "0912345678", "otp": "123456" }`
