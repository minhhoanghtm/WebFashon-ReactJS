# Hướng Dẫn Kiến Trúc Modular Monolith (Web Fashion Backend)

Tài liệu này giải thích chi tiết cấu trúc thư mục mới của hệ thống backend sau khi được tái cấu trúc sang mô hình **Modular Monolith** kết hợp **Layered Architecture** bên trong mỗi module.

---

## 🏗️ Tổng Quan Kiến Trúc
Hệ thống sử dụng mô hình **Modular Monolith** (Đơn khối dạng module), trong đó:
1. **Module hóa theo tính năng (Feature-based Modularization)**: Mỗi miền nghiệp vụ (domain) như `auth`, `users`, `products`, `orders` là một thực thể độc lập nằm trong thư mục `src/modules/[module_name]`.
2. **Kiến trúc phân lớp bên trong module (Layered Inside Module)**: Mỗi module tự quản lý luồng dữ liệu của mình thông qua các tầng: **Route -> Controller -> Service -> Repository -> Model**.
3. **Tính cô lập (Isolation)**: Các module hạn chế tối đa việc truy vấn trực tiếp DB của module khác, thay vào đó gọi thông qua Service của module đó hoặc sử dụng các cơ chế dùng chung (common).

---

## 📁 Cấu Trúc Thư Mục Chi Tiết

```
back-end/src/
├── configs/                  # Cấu hình kết nối hệ thống bên ngoài
│   ├── db.js                 # Cấu hình và kết nối MongoDB (Mongoose)
│   └── redis.js              # Cấu hình và kết nối Redis (dùng cho BullMQ/Cache)
│
├── common/                   # Thư viện, tiện ích dùng chung toàn hệ thống
│   ├── constants/            # Định nghĩa các hằng số, mã lỗi, HTTP status codes
│   ├── utils/                # Các hàm tiện ích thuần túy (xóa dấu, chuẩn hóa email, tạo slug)
│   ├── helpers/              # Các hàm bổ trợ nghiệp vụ (tạo mã OTP, xử lý logic nhỏ)
│   ├── exceptions/           # Định nghĩa các lớp lỗi tùy chỉnh (ví dụ: AppError)
│   ├── responses/            # Định nghĩa định dạng phản hồi chuẩn cho API JSON
│   └── logger/               # Hệ thống ghi log (Winston/Morgan nếu mở rộng)
│
├── providers/                # Các dịch vụ bên thứ ba (External Integrations)
│   ├── email.provider.js     # Tích hợp dịch vụ gửi Email (Nodemailer)
│   ├── momo.provider.js      # Tích hợp cổng thanh toán MoMo
│   ├── stripe.provider.js    # Tích hợp cổng thanh toán Stripe
│   └── zalopay.provider.js   # Tích hợp cổng thanh toán ZaloPay
│
├── middlewares/              # Các Express Middlewares dùng chung toàn cầu
│   ├── auth.middleware.js    # Xác thực JWT Token và phân quyền (adminOnly)
│   └── error.middleware.js   # Bộ xử lý lỗi trung tâm, định dạng lỗi trả về Client
│
├── modules/                  # Chứa toàn bộ các miền nghiệp vụ của ứng dụng
│   ├── auth/                 # Module xác thực & đăng ký tài khoản
│   ├── users/                # Module quản lý thông tin người dùng
│   ├── products/             # Module quản lý sản phẩm & biến thể sản phẩm (Variants)
│   ├── categories/           # Module quản lý danh mục sản phẩm
│   ├── carts/                # Module quản lý giỏ hàng & sản phẩm trong giỏ (Cart Items)
│   ├── orders/               # Module quản lý đơn hàng & chi tiết đơn hàng (Order Items)
│   ├── reviews/              # Module quản lý đánh giá & phản hồi sản phẩm
│   ├── payments/             # Module xử lý cổng thanh toán & phản hồi giao dịch (Callbacks)
│   └── uploads/              # Module xử lý tải lên tệp tin hình ảnh (Multer)
│
├── queues/                   # Hàng đợi xử lý tác vụ bất đồng bộ (BullMQ + Redis)
│   ├── index.js              # Khởi tạo và đăng ký các Queue (ví dụ: emailQueue)
│   └── workers/              # Chứa các Worker xử lý công việc ngầm dưới nền
│       └── email.worker.js   # Worker lắng nghe tác vụ gửi email ngầm từ queue
│
├── sockets/                  # Tầng kết nối thời gian thực WebSockets (Socket.IO)
│   ├── index.js              # Cài đặt server Socket.IO và bọc kết nối HTTP
│   └── events.js             # Định nghĩa các sự kiện kết nối & hàm thông báo đơn hàng
│
├── routes/                   # Đăng ký định tuyến toàn hệ thống
│   └── index.js              # Cổng router trung tâm gom tất cả các module routes lại
│
├── app.js                    # Khởi tạo ứng dụng Express & cấu hình Middleware toàn cục
└── server.js                 # Điểm khởi chạy (Entry Point) của server HTTP, Sockets và Workers
```

---

## 🧩 Cấu Trúc Bên Trong Mỗi Module (`src/modules/[module_name]/`)

Mỗi module sẽ tự đóng gói các thành phần sau để tối đa hóa tính tái sử dụng và cô lập:

1. **`dto/` (Data Transfer Object)**: 
   - Lớp định nghĩa cấu trúc dữ liệu gửi nhận giữa client và server. Giúp lọc sạch payload trước khi đưa vào xử lý logic.
2. **`validations/`**:
   - Chứa các schema kiểm tra tính hợp lệ dữ liệu (sử dụng Joi, Zod hoặc bộ xác thực thủ công) trước khi controller nhận xử lý.
3. **`[module].controller.js` (Thin Controller)**:
   - **Nhiệm vụ duy nhất**: Nhận request từ Express, trích xuất dữ liệu (body, params, query), gọi sang tầng Service xử lý, nhận kết quả và trả về client dưới dạng JSON tiêu chuẩn.
   - **Quy tắc**: Không chứa bất kỳ logic nghiệp vụ nào, không truy cập trực tiếp Mongoose models. Mọi lỗi phát sinh được chuyển tiếp qua `next(error)`.
4. **`[module].service.js` (Business Logic)**:
   - **Nhiệm vụ**: Chứa toàn bộ nghiệp vụ (tính toán tiền, kiểm tra tồn kho, gửi tín hiệu realtime socket, lập lịch gửi mail hàng đợi).
   - **Quy tắc**: Triệu gọi các hàm từ Repository để thao tác dữ liệu. Không thao tác HTTP request/response ở đây.
5. **`[module].repository.js` (Data Access)**:
   - **Nhiệm vụ**: Đóng gói toàn bộ các câu lệnh truy vấn database (`find`, `create`, `update`, `delete`, `aggregate`) của Mongoose model tương ứng.
   - **Quy tắc**: Không chứa logic nghiệp vụ. Chỉ tập trung thực thi query hiệu quả và trả về dữ liệu.
6. **`[module].model.js` (Database Schema)**:
   - Khai báo Mongoose Schema tương ứng của module đó (ví dụ: `user.model.js` chứa schema `User`).
7. **`[module].route.js` (Router định tuyến)**:
   - Định nghĩa các endpoint URI và kết nối chúng với các hàm tương ứng của Controller, đồng thời áp dụng các middleware bảo vệ (như `protectedRoute`, `adminOnly`).

---

## 🔄 Luồng Đi Của Dữ Liệu (Data Flow)

Khi một request HTTP gửi từ Client (ReactJS Web / React Native Mobile) tới Backend:

```
[Client Request]
       │
       ▼
 [Middlewares]  (CORS, Parser, Cookie, JWT auth)
       │
       ▼
  [API Router]  (routes/index.js -> [module].route.js)
       │
       ▼
 [Controller]   (Trích xuất dữ liệu, định dạng JSON phản hồi)
       │
       ▼
   [Service]    (Xử lý logic nghiệp vụ, gọi socket/queue) ──► [BullMQ / Socket.IO]
       │
       ▼
 [Repository]   (Query DB sạch sẽ)
       │
       ▼
   [Database]   (MongoDB)
```

---

## 🚀 Lợi Ích Của Cấu Trúc Này
* **Rõ ràng trách nhiệm**: Người phát triển biết chính xác cần tìm code ở đâu dựa vào thư mục tính năng.
* **Dễ bảo trì**: Sửa đổi logic của module này không ảnh hưởng đến module khác nhờ tính cô lập.
* **Dễ kiểm thử (Testability)**: Các hàm Service tách biệt hoàn toàn khỏi Express request/response giúp viết Unit Test cực kỳ dễ dàng.
* **Mở rộng dễ dàng**: Khi một module phình to quá mức, ta hoàn toàn có thể tách riêng module đó ra thành một Microservice độc lập mà không cần viết lại toàn bộ dự án.
