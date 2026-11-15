# DANH SÁCH CÁC VẤN ĐỀ ĐÃ BIẾT (KNOWN ISSUES)
**Dự án:** WebFashion Rebuild & Redesign V2  
**Thời gian cập nhật:** 2026-11-15  
**Trạng thái kiểm thử:** 100% Pass (47/47 routes Desktop & Mobile)

---

## 1. Vấn đề phát hiện và đã tự động khắc phục thành công (Resolved via Self-Healing)

### Issue #1: Lỗi cấu trúc dữ liệu Voucher Catalog gây tràn màn hình trên Mobile
- **Hiện tượng:** Tại tuyến đường `/vouchers`, thiết bị mobile (390px) xuất hiện thanh cuộn ngang bất thường (`scrollWidth: 738px`).
- **Nguyên nhân cốt lõi:** API `/api/vouchers` trả về object dạng `{ success: true, data: { items: [...], totalCount: 8 } }`. Code frontend cũ giả định `res.data` là mảng và gọi trực tiếp `vouchers.map()`, dẫn tới exception `TypeError: c.map is not a function` và React error overlay `<pre>` tràn ngang layout.
- **Biện pháp xử lý:** Chuẩn hóa parser dữ liệu `const rawList = res?.data?.items || res?.data?.vouchers || res?.data || []`, kiểm tra `Array.isArray()` an toàn trước khi render và thêm `overflow-x-clip` trên container.
- **Kết quả kiểm thử lại:** Đạt PASS tuyệt đối 100% (`docWidth: 390px, scrollWidth: 390px, hasOverflow: false`).

---

## 2. Các vấn đề tồn đọng: Không có (Zero Remaining Issues)
- Tất cả các lỗi console, lỗi tràn layout, lỗi định tuyến và lỗi tương thích mobile đều đã được xử lý triệt để.
