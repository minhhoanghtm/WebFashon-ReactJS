# Nhật Ký Quyết Định Kỹ Thuật (Decisions Log)

Tài liệu này ghi lại toàn bộ quyết định kỹ thuật tự chủ, lý do lựa chọn và giải pháp an toàn trong quá trình thực hiện nhiệm vụ rà soát toàn bộ API, loại bỏ hardcode/mock, kiểm thử và chuẩn hóa hệ thống.

---

## 2. Thiết Kế Hệ Thống Xác Thực SMS OTP & Nâng Cấp Auth (2026-11-01)
- **Quyết định nhánh:** Tạo nhánh `feat/sms-otp` từ `feat/api-coverage-20261031`.
- **Kiến trúc SMS Provider:**
  - Thiết kế interface chuẩn `sendSms(phone, text, meta)` với Provider Pattern (`sms.service.js`).
  - Hỗ trợ 2 provider: `esms` (eSMS REST API chính thức, hỗ trợ Sandbox) và `console` (in mã OTP ra console cho môi trường dev/test khi `NODE_ENV !== 'production'`).
  - Fallback an toàn: Khi SMS provider gặp sự cố mạng hoặc hết số dư, hệ thống tự động fallback gửi OTP qua email của người dùng (Nodemailer / BullMQ) nếu người dùng đã có email.
  - Bảo mật ghi log: Tuyệt đối không log khóa API, mã OTP thực tế hoặc số điện thoại đầy đủ ở môi trường production. Số điện thoại được che một phần (vd: `+8490***5678`).
- **Chuẩn hóa số điện thoại:**
  - Định dạng chuẩn lưu trữ: E.164 cho Việt Nam (`+84xxxxxxxxx`).
  - Chấp nhận đầu vào: `0xxxxxxxxx`, `84xxxxxxxxx`, `+84xxxxxxxxx`.
  - Validate theo quy chuẩn đầu số di động Việt Nam (03x, 05x, 07x, 08x, 09x).
- **Quản lý OTP bảo mật:**
  - Sinh OTP: 6 chữ số ngẫu nhiên an toàn bằng `crypto.randomInt(100000, 1000000)`, không dùng `Math.random`.
  - Lưu trữ: Băm HMAC-SHA256 kết hợp OTP secret, lưu trên Redis (hỗ trợ fallback Mongo/Memory) với TTL 5 phút.
  - Mỗi số điện thoại/email + purpose (`register`, `login`, `reset_password`, `verify_phone`) chỉ tồn tại tối đa 1 OTP hiệu lực.
  - Giới hạn: Tối đa 5 lần nhập sai/OTP (sau đó hủy OTP), cooldown gửi lại 60 giây, tối đa 5 OTP/giờ/số điện thoại, tối đa 20 OTP/giờ/IP.
  - So sánh mã bằng `crypto.timingSafeEqual` chống tấn công timing attack.
  - Chống liệt kê tài khoản (Anti-account enumeration): API quên mật khẩu trả cùng thông điệp chung thành công dù số điện thoại/email có tồn tại hay không.
- **Tương thích ngược (Backwards Compatibility):**
  - Giữ nguyên các API cũ (`/auth/signUp`, `/auth/signIn`, `/auth/sendOTP`, `/auth/verify-otp`, `/auth/resetPassword`).
  - Mở rộng `/auth/signIn` chấp nhận cả email hoặc số điện thoại.
  - Bổ sung các endpoint mới chuẩn REST: `/auth/register/send-otp`, `/auth/register/verify`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/login/otp/send`, `/auth/login/otp/verify`, `/auth/otp/resend`.
  - Cập nhật User Model: thêm trường `phone` với `default: null, sparse: true, unique: true, index: true`. Trường `email` trở thành optional sparse khi đăng ký bằng số điện thoại.

## 1. Khởi tạo & An toàn (2026-10-31)
- **Quyết định:** Tạo nhánh mới `feat/api-coverage-20261031` từ nhánh `feature/vector-ai-shopping-intelligence`.
- **Lý do:** Tuân thủ quy định nhánh mới `feat/api-coverage-YYYYMMDD`, không tác động lên `main`/`master` hay nhánh gốc.
- **Bảo toàn file có sẵn:**
  - `back-end/src/configs/redis.js`: Giữ nguyên tuyệt đối, không sửa, không add.
  - Các script benchmark/test có sẵn trong `back-end/src/scripts/`: Giữ nguyên.
  - Các file sửa đổi dở dang trước khi chạy lệnh: rà soát tích hợp đúng chức năng, không stash làm mất code của người dùng.
- **Quy tắc Git:** Chỉ dùng `git add <path-to-file>`, tuyệt đối không dùng `git add .` hoặc `git add -A`.

---

## 2. Thiết Kế Hệ Thống Xác Thực SMS OTP & Nâng Cấp Auth (2026-11-01)
- **Quyết định nhánh:** Tạo nhánh `feat/sms-otp` từ `feat/api-coverage-20261031`.
- **Kiến trúc SMS Provider:**
  - Thiết kế interface chuẩn `sendSms(phone, text, meta)` với Provider Pattern (`sms.service.js`).
  - Hỗ trợ 2 provider: `esms` (eSMS REST API chính thức, hỗ trợ Sandbox) và `console` (in mã OTP ra console cho môi trường dev/test khi `NODE_ENV !== 'production'`).
  - Fallback an toàn: Khi SMS provider gặp sự cố mạng hoặc hết số dư, hệ thống tự động fallback gửi OTP qua email của người dùng (Nodemailer / BullMQ) nếu người dùng đã có email.
  - Bảo mật ghi log: Tuyệt đối không log khóa API, mã OTP thực tế hoặc số điện thoại đầy đủ ở môi trường production. Số điện thoại được che một phần (vd: `+8490***5678`).
- **Chuẩn hóa số điện thoại:**
  - Định dạng chuẩn lưu trữ: E.164 cho Việt Nam (`+84xxxxxxxxx`).
  - Chấp nhận đầu vào: `0xxxxxxxxx`, `84xxxxxxxxx`, `+84xxxxxxxxx`.
  - Validate theo quy chuẩn đầu số di động Việt Nam (03x, 05x, 07x, 08x, 09x).
- **Quản lý OTP bảo mật:**
  - Sinh OTP: 6 chữ số ngẫu nhiên an toàn bằng `crypto.randomInt(100000, 1000000)`, không dùng `Math.random`.
  - Lưu trữ: Băm HMAC-SHA256 kết hợp OTP secret, lưu trên Redis (hỗ trợ fallback Mongo/Memory) với TTL 5 phút.
  - Mỗi số điện thoại/email + purpose (`register`, `login`, `reset_password`, `verify_phone`) chỉ tồn tại tối đa 1 OTP hiệu lực.
  - Giới hạn: Tối đa 5 lần nhập sai/OTP (sau đó hủy OTP), cooldown gửi lại 60 giây, tối đa 5 OTP/giờ/số điện thoại, tối đa 20 OTP/giờ/IP.
  - So sánh mã bằng `crypto.timingSafeEqual` chống tấn công timing attack.
  - Chống liệt kê tài khoản (Anti-account enumeration): API quên mật khẩu trả cùng thông điệp chung thành công dù số điện thoại/email có tồn tại hay không.
- **Tương thích ngược (Backwards Compatibility):**
  - Giữ nguyên các API cũ (`/auth/signUp`, `/auth/signIn`, `/auth/sendOTP`, `/auth/verify-otp`, `/auth/resetPassword`).
  - Mở rộng `/auth/signIn` chấp nhận cả email hoặc số điện thoại.
  - Bổ sung các endpoint mới chuẩn REST: `/auth/register/send-otp`, `/auth/register/verify`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/login/otp/send`, `/auth/login/otp/verify`, `/auth/otp/resend`.
  - Cập nhật User Model: thêm trường `phone` với `default: null, sparse: true, unique: true, index: true`. Trường `email` trở thành optional sparse khi đăng ký bằng số điện thoại.

