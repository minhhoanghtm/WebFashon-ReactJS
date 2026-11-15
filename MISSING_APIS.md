# DANH SÁCH API CẦN CHO UI MÀ BACKEND CHƯA HỖ TRỢ HOẶC CẦN BỔ SUNG (MOCK)
**Dự án:** WebFashion Rebuild & Redesign V2  
**Quy tắc:** Tuyệt đối không tự sửa backend; Sử dụng mock tạm thời ở frontend và ghi nhận đề xuất tại đây.

---

### 1. API Đăng ký nhận bản tin thời trang (Newsletter Subscription)
- **Màn hình sử dụng:** Footer (`AtelierFooter`), Trang chủ (`Home - Newsletter Section`)
- **Phương thức (Method):** `POST`
- **Endpoint đề xuất:** `/api/newsletter/subscribe`
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "source": "footer_dispatch"
  }
  ```
- **Response đề xuất:**
  ```json
  {
    "success": true,
    "message": "Đăng ký nhận bản tin Atelier thành công. Vui lòng kiểm tra email xác nhận."
  }
  ```
- **Xử lý tạm thời ở Frontend:** Kiểm tra định dạng email regex hợp lệ, hiển thị Toast thông báo thành công và lưu trạng thái vào localStorage để tránh nhắc lại.

---

### 2. API Đặt lịch thử đồ tại Atelier (Atelier Private Fitting Appointment)
- **Màn hình sử dụng:** Trang Dịch vụ & Hướng dẫn (`/guide`), Trang giới thiệu (`/about`)
- **Phương thức (Method):** `POST`
- **Endpoint đề xuất:** `/api/appointments/fitting`
- **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "phone": "0912345678",
    "preferredDate": "2026-11-20T10:00:00Z",
    "notes": "Muốn thử áo khoác Blazer Cashmere và đồ dạ tiệc"
  }
  ```
- **Response đề xuất:**
  ```json
  {
    "success": true,
    "message": "Đã ghi nhận lịch hẹn thử đồ riêng tư. Chuyên viên Atelier sẽ liên hệ xác nhận trong 2 giờ làm việc."
  }
  ```
- **Xử lý tạm thời ở Frontend:** Mock Promise trả về sau 400ms và thông báo SweetAlert2/Toast thành công.

---

### 3. API Phản hồi nhanh về trải nghiệm mua sắm (Micro Feedback)
- **Màn hình sử dụng:** Chi tiết đơn hàng sau khi hoàn tất (`/order`, `/payment-result`)
- **Phương thức (Method):** `POST`
- **Endpoint đề xuất:** `/api/feedback/quick`
- **Request Body:**
  ```json
  {
    "orderId": "ORD-123456",
    "score": 5,
    "tags": ["Giao hàng nhanh", "Đóng gói đẹp", "Vải ưng ý"]
  }
  ```
- **Response đề xuất:**
  ```json
  {
    "success": true,
    "message": "Cảm ơn bạn đã đóng góp ý kiến hoàn thiện trải nghiệm dịch vụ."
  }
  ```
- **Xử lý tạm thời ở Frontend:** Ghi nhận và lưu tạm thời phía client.
