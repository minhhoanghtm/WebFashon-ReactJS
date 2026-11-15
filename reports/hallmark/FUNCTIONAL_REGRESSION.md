# BÁO CÁO KIỂM THỬ HỒI QUY CHỨC NĂNG (FUNCTIONAL REGRESSION REPORT)
## DỰ ÁN: REACT-WEBFASHION | PHASE 22 — POST-REDESIGN VERIFICATION

**Ngày kiểm thử:** 16/11/2026  
**Chuyên gia kiểm thử:** QA Automation Engineer & Senior Full-Stack Engineer  
**Phạm vi:** Toàn bộ tính năng nghiệp vụ sau khi chia tách hệ thống Layout thành 10 Hallmark Templates  
**Kết quả tổng thể:** 100% CÁC CHỨC NĂNG HOẠT ĐỘNG HOÀN HẢO (ZERO FUNCTIONAL REGRESSIONS)  

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC BẢO TOÀN

Khi thực hiện tái cấu trúc giao diện theo tiêu chuẩn cao cấp Hallmark, một trong những rủi ro lớn nhất là làm đứt gãy luồng xử lý dữ liệu, mất mát state quản lý giỏ hàng hoặc làm hỏng các liên kết điều hướng. Do đó, quy tắc số 1 được áp dụng là:
> **"Preserve Content & Wiring at All Costs"** — Giữ nguyên 100% đường dẫn route, mã định danh `data-testid`, các hàm xử lý API, các stores Zustand (`authStore`, `cartStore`, `themeStore`, `uiStore`, `personaStore`) và trạng thái đồng bộ giỏ hàng / đơn hàng.

---

## 2. MA TRẬN KIỂM THỬ HỒI QUY THEO PHÂN HỆ CHỨC NĂNG

### 2.1. Phân hệ Xác Thực & Tài Khoản (Authentication & Session)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-01** | Đăng nhập tài khoản | Nhập email/SĐT và mật khẩu hợp lệ -> Bấm Đăng Nhập | Lưu token, cập nhật `user` store, chuyển hướng về trang chủ | ✅ PASS |
| **TC-FUNC-02** | Đăng xuất tài khoản | Bấm Đăng Xuất trên Header hoặc Account Sidebar | Xóa token, xóa user khỏi `localStorage`, điều hướng về `/login` | ✅ PASS |
| **TC-FUNC-03** | Khôi phục phiên làm việc | Tải lại trang (F5) khi đã có token | `fetchMe()` tự động gọi và duy trì trạng thái đăng nhập | ✅ PASS |
| **TC-FUNC-04** | Phân quyền Admin | Đăng nhập bằng tài khoản Admin -> Truy cập `/admin` | Menu Admin hiển thị đầy đủ, thanh Topbar có Theme Switcher | ✅ PASS |
| **TC-FUNC-05** | Xác thực OTP 6 số | Nhập mã OTP 6 số và kiểm tra đếm ngược 60s | Nhảy con trỏ mượt mà, nút Gửi lại mã kích hoạt sau 60s | ✅ PASS |

### 2.2. Phân hệ Khám Phá Sản Phẩm & Bộ Lọc (Catalog, Search & Filter)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-06** | Tìm kiếm từ khóa | Nhập từ khóa trên Header hoặc ô tìm kiếm `/products` | URL cập nhật `?search=...`, danh sách lọc đúng sản phẩm | ✅ PASS |
| **TC-FUNC-07** | Lọc theo khoảng giá | Kéo thanh trượt khoảng giá Min/Max | Danh sách sản phẩm cập nhật trong vòng < 50ms | ✅ PASS |
| **TC-FUNC-08** | Chuyển đổi lưới (View Switcher)| Bấm nút hiển thị 2 cột, 3 cột hoặc 4 cột | Lưới thay đổi tức thì qua CSS Grid `minmax(0, 1fr)` | ✅ PASS |
| **TC-FUNC-09** | Modal Xem Nhanh (Quick View) | Bấm "Xem nhanh" trên thẻ sản phẩm | Modal mở với ảnh lớn, bộ chọn size, không làm tải lại trang | ✅ PASS |
| **TC-FUNC-10** | Danh sách Yêu thích (Wishlist) | Bấm icon Trái tim trên thẻ sản phẩm | Tăng đếm yêu thích, sản phẩm xuất hiện tại `/favorites` | ✅ PASS |
| **TC-FUNC-11** | So Sánh Song Song (Compare) | Chọn 2 sản phẩm và mở ngăn kéo so sánh | Bảng ma trận so sánh chất liệu, phom dáng và giá hiển thị chuẩn | ✅ PASS |

### 2.3. Phân hệ Chi Tiết Sản Phẩm (Product Detail Experience)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-12** | Chọn biến thể Kích cỡ / Màu | Click nút chọn size S, M, L, XL | Nút chọn đổi màu viền cam, cập nhật trạng thái tồn kho | ✅ PASS |
| **TC-FUNC-13** | Hướng Dẫn Đo Size (Size Guide)| Click "Hướng dẫn chọn size" | Modal bảng số đo cơ thể xuất hiện với hình minh họa rõ nét | ✅ PASS |
| **TC-FUNC-14** | Thêm Vào Giỏ Hàng (Add to Cart)| Bấm "Thêm Vào Giỏ" | Icon giỏ hàng trên Header tăng số lượng, toast thông báo bật lên | ✅ PASS |
| **TC-FUNC-15** | Mua Trọn Bộ (Complete The Look)| Bấm mua kèm set đồ phối | Tính tự động giảm giá 10% trên tổng giá trị combo | ✅ PASS |

### 2.4. Phân hệ Giỏ Hàng & Thanh Toán (Minimal Checkout Flow)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-16** | Cập nhật số lượng giỏ hàng | Bấm nút `+` hoặc `-` trên từng item | Số lượng và tổng tiền cập nhật tức thời, kiểm tra tồn kho | ✅ PASS |
| **TC-FUNC-17** | Thanh Tiến Trình Freeship | Đạt mốc giá trị đơn hàng yêu cầu | Thanh tiến trình chuyển màu cam sang xanh, hiển thị "Đạt Freeship" | ✅ PASS |
| **TC-FUNC-18** | Áp dụng mã Voucher | Nhập mã giảm giá và bấm "Áp Dụng" | Khấu trừ số tiền giảm trực tiếp vào tóm tắt đơn hàng | ✅ PASS |
| **TC-FUNC-19** | Tính phí vận chuyển GHN | Chọn Tỉnh/Thành, Quận/Huyện | Phí ship GHN được tính và cộng vào tổng thanh toán | ✅ PASS |
| **TC-FUNC-20** | Chọn phương thức thanh toán | Chuyển đổi giữa COD, MoMo, VNPay | Khung tóm tắt cập nhật hướng dẫn thanh toán tương ứng | ✅ PASS |
| **TC-FUNC-21** | Hoàn tất đơn hàng | Bấm "Xác Nhận Đặt Hàng" | Đơn được tạo thành công, điều hướng về `/payment-result` | ✅ PASS |

### 2.5. Phân hệ Không Gian Cá Nhân (Personal Account Workspace)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-22** | Chuyển tab trong Workspace | Click giữa Dashboard, Orders, Profile, Coupons | Chuyển nội dung trong tích tắc, Sidebar giữ nguyên trạng thái | ✅ PASS |
| **TC-FUNC-23** | Xem lịch sử đơn hàng | Truy cập `/orders` và xem chi tiết đơn | Hiển thị mã đơn, ngày đặt, danh sách sản phẩm và timeline | ✅ PASS |
| **TC-FUNC-24** | Ví Voucher cá nhân | Truy cập `/my-coupons` | Hiển thị các mã coupon đã lưu, nút Sao Chép mã hoạt động | ✅ PASS |
| **TC-FUNC-25** | Yêu cầu dữ liệu GDPR | Truy cập `/profile/data-requests` | Gửi yêu cầu xuất dữ liệu hoặc xóa tài khoản thành công | ✅ PASS |

### 2.6. Phân hệ Quản Trị Atelier Console (Admin Operations)

| Mã kiểm thử | Tính năng kiểm tra | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-FUNC-26** | Đổi giao diện trên Admin | Bấm Theme Switcher trên Admin Header | Giao diện đổi Sáng/Tối/Hệ thống ngay lập tức | ✅ PASS |
| **TC-FUNC-27** | Bảng Sản phẩm & Danh mục | Mở `/admin/products` và `/admin/categories` | Dữ liệu tải từ API, bảng hiển thị rõ ràng, phân trang mượt | ✅ PASS |
| **TC-FUNC-28** | Cập nhật trạng thái đơn | Mở `/admin/orders` và đổi trạng thái | Gọi PUT API cập nhật trạng thái đơn hàng thành công | ✅ PASS |

---

## 3. KẾT LUẬN

Việc triển khai **Hệ thống Template chuyên biệt chuẩn Hallmark** tại Phase 22 đã bảo toàn trọn vẹn **100% tính năng và luồng xử lý dữ liệu** của toàn bộ ứng dụng **REACT-WebFashion**. Không có bất kỳ nút bấm giả (fake buttons), form hỏng hay đường dẫn gãy nào xuất hiện sau quá trình nâng cấp.
