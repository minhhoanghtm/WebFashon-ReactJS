# KIẾN TRÚC GIỮ HÀNG TỒN KHO REDIS 5 PHÚT (REDIS INVENTORY RESERVATION ARCHITECTURE)
## REACT-WebFashion — 404 Studio

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Thời gian giữ hàng cố định chính xác 300 giây (5 phút):** Được tính bằng `createdAt + 300000ms`, quản lý trực tiếp bằng timestamp và Redis TTL. Không tự động gia hạn khi reload trang, đổi tab, mất mạng hay gọi lại API.
2. **Quản lý tập trung tại Redis:** Số lượng sản phẩm đang giữ (`reservedStock`) và hạn hết giờ (`expiresAt`) được lưu trữ và truy xuất từ Redis namespace `webfashion:`.
3. **Tuyệt đối không bán vượt tồn kho (Zero Overselling Guarantee):**
   $$\text{Stock}_{\text{khả dụng}} = \max(0, \text{Stock}_{\text{vật lý (DB)}} - \text{Stock}_{\text{đang giữ (Redis)}})$$
   Mọi API (Product Detail, Listing, Cart, Checkout, AI Assistant, Recommendations) đều tính toán tồn kho theo công thức này.
4. **Kiểm tra giỏ hàng nguyên tử (All-or-Nothing Multi-Item Check):** Đảm bảo kiểm tra toàn bộ SKU trong đơn hàng bằng Redis Lua Script. Nếu bất kỳ SKU nào không đủ hàng, toàn bộ yêu cầu checkout bị từ chối; không giữ một phần đơn hàng.
5. **Hủy tức thời & Tự động giải phóng:** Hủy checkout trả lại tồn kho ngay lập tức. Sau 300 giây, hệ thống tự động giải phóng thông qua cơ chế 3 tầng (Redis TTL, Lazy on-read check, Background Reconciler Worker).
6. **Độ bền dữ liệu hai tầng (Dual-Layer Durability & Crash Recovery):** MongoDB lưu trữ sổ cái bền vững (`InventoryReservation`). Khi máy chủ Node.js hoặc Redis khởi động lại, hàm `reconcileReservationsFromDB()` tự động nạp lại các phiên còn hiệu lực và đánh dấu `EXPIRED` các phiên đã quá hạn.

---

## 2. THIẾT KẾ KHÔNG GIAN KHÓA REDIS (REDIS KEY TOPOLOGY)

Tất cả các khóa tuân thủ namespace cô lập riêng cho dự án WebFashion:

```
┌──────────────────────────────────────────────┬────────────────┬───────────────────────────┐
│ Redis Key                                    │ Kiểu dữ liệu   │ Ý nghĩa & Vòng đời        │
├──────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│ webfashion:reservation:{reservationId}       │ String (JSON)  │ Chi tiết session giữ hàng │
│                                              │                │ TTL = 300s (ACTIVE)       │
├──────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│ webfashion:stock:reserved:{sku}              │ String (Int)   │ Tổng số lượng SKU đang    │
│                                              │                │ bị giữ bởi các checkout   │
├──────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│ webfashion:stock:reservations:{sku}          │ Set            │ Danh sách reservationId   │
│                                              │                │ đang chiếm giữ SKU này    │
├──────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│ webfashion:reservation:expirations           │ Sorted Set     │ ZSET quản lý hết hạn      │
│                                              │ (ZSET)         │ Score = expiresAt (epoch) │
├──────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│ webfashion:checkout:idempotency:{id}         │ String         │ Chống double click/retry  │
│                                              │                │ TTL = 86400s              │
└──────────────────────────────────────────────┴────────────────┴───────────────────────────┘
```

### Cấu trúc Payload của Reservation:
```json
{
  "reservationId": "res_1793704150399_0a2ea23d",
  "userId": "6ae9c02cf2da31a9f1179ba3",
  "checkoutSessionId": "cs_res_1793704150399_0a2ea23d",
  "items": [
    {
      "productId": "6a3f46317302ffeba0d3949e",
      "variantId": "6a3f4f397302ffeba0d3950e",
      "sku": "variant_6a3f4f397302ffeba0d3950e",
      "name": "Đầm Maxi Hoa Nhí Đi Biển",
      "color": "Hoa Nhí Vàng",
      "size": "M",
      "quantity": 3,
      "unitPrice": 350000,
      "image": "https://..."
    }
  ],
  "totalAmount": 1050000,
  "status": "ACTIVE",
  "createdAt": 1793704150399,
  "expiresAt": 1793704450399,
  "idempotencyKey": "idem_..."
}
```

---

## 3. LUA SCRIPTS NGUYÊN TỬ (ATOMIC LUA TRANSACTIONS)

### 3.1. `LUA_RESERVE` (Kiểm tra & Giữ hàng All-or-Nothing)
- **Keys:** `KEYS[1] = webfashion:reservation:{id}`, `KEYS[2] = webfashion:reservation:expirations`
- **Hoạt động:**
  1. Duyệt qua toàn bộ danh sách items, lấy `currentReserved` từ `webfashion:stock:reserved:{sku}`.
  2. So sánh `dbStock - currentReserved < requestedQty`. Nếu bất kỳ item nào không đủ, thoát ngay lập tức và trả về mã lỗi `INSUFFICIENT_STOCK`, `available`, `sku`. Không giữ bất kỳ món nào.
  3. Khi tất cả hợp lệ: Tăng `INCRBY webfashion:stock:reserved:{sku}`, thêm vào `webfashion:stock:reservations:{sku}`.
  4. Lưu payload bằng `SET ... EX 300` và thêm vào ZSET `webfashion:reservation:expirations`.

### 3.2. `LUA_RELEASE` (Giải phóng hàng - Hủy hoặc Hết hạn)
- **Hoạt động:**
  1. Đọc payload từ Redis. Nếu session không ở trạng thái `ACTIVE`, trả về `ALREADY_RELEASED` (chống double release).
  2. Với mỗi item, giảm `webfashion:stock:reserved:{sku}` đúng bằng `quantity`. Nếu kết quả $\le 0$, xóa key.
  3. Xóa khỏi `webfashion:stock:reservations:{sku}` và ZSET `webfashion:reservation:expirations`.
  4. Cập nhật trạng thái session sang `USER_CANCELLED` hoặc `EXPIRED`.

### 3.3. `LUA_COMMIT` (Chốt đơn hàng khi tạo Order thành công)
- **Hoạt động:**
  1. Kiểm tra session có `status == ACTIVE`.
  2. Giảm số lượng trong `webfashion:stock:reserved:{sku}` tương ứng (vì lúc này tồn kho vật lý trong MongoDB đã bị trừ bởi `deductStock`).
  3. Xóa session khỏi ZSET hết hạn.
  4. Đánh dấu `COMPLETED` với TTL 24h để phục vụ đối soát, ngăn tái sử dụng.

---

## 4. BẢO ĐẢM TÍNH NHẤT QUÁN REDIS VÀ MONGODB (CONSISTENCY & DURABILITY)

| Tình huống | Cơ chế xử lý |
| :--- | :--- |
| **Server Crash / Redis Restart** | Khởi động lại gọi `reconcileReservationsFromDB()`: quét `InventoryReservation` tìm bản ghi `ACTIVE`. Nếu `now >= expiresAt`, chuyển thành `EXPIRED`. Nếu còn hạn, nạp lại vào Redis keys và ZSET với TTL còn lại. |
| **Tạo đơn hàng COD** | Trong transaction MongoDB: trừ kho vật lý `deductStock()`, tạo `Order`, sau đó gọi `commitReservation()`. Nếu transaction DB thất bại, Redis reservation vẫn an toàn, không mất dữ liệu. |
| **Thanh toán Online (MoMo/VNPAY)** | Webhook kiểm tra `order.status`. Nếu đơn hàng đã hủy hoặc reservation hết hạn trước khi tiền vào, hệ thống không tự ý trừ kho hay hoàn thành đơn, mà ghi nhận giao dịch ngoại lệ để xử lý hoàn tiền an toàn. |
| **Double Click Checkout** | Sử dụng `idempotencyKey` lưu trữ trong Redis và MongoDB; nếu cùng một key được gửi lại, hệ thống trả về phiên giữ hàng hiện hữu mà không cộng dồn số lượng. |

---

## 5. THIẾT KẾ GIAO DIỆN ĐẾM NGƯỢC (CHECKOUT COUNTDOWN UI)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ⏰ Thời gian giữ hàng còn lại: 04:59             [HỦY GIỮ HÀNG]       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Hiển thị thời gian thực:** Đồng bộ theo `expiresAt` từ máy chủ:
   $$\text{Remaining} = \max\left(0, \left\lfloor \frac{\text{expiresAt} - \text{Date.now()}}{1000} \right\rfloor\right)$$
2. **Cảnh báo $\le 60$ giây:** Banner chuyển viền đỏ/cam, biểu tượng đồng hồ nhấp nháy, hiển thị dòng chữ:
   > *"⚠️ Sắp hết hạn! Thời gian giữ hàng còn lại: 00:58"*
3. **Xử lý khi về 00:00 (Hết hạn):**
   - Vô hiệu hóa nút *"Đặt hàng"*.
   - Hiển thị modal SweetAlert2 với thông báo:
     > *"Thời gian giữ hàng 5 phút đã hết. Sản phẩm của bạn đã được trả về kho. Vui lòng kiểm tra lại giỏ hàng để tiếp tục thanh toán."*
   - Tự động gọi API giải phóng kho và điều hướng người dùng về `/cart`.
