# Nhật Ký Quyết Định Kỹ Thuật (Decisions Log)

Tài liệu này ghi lại toàn bộ quyết định kỹ thuật tự chủ, lý do lựa chọn và giải pháp an toàn trong quá trình thực hiện nhiệm vụ rà soát toàn bộ API, loại bỏ hardcode/mock, kiểm thử và chuẩn hóa hệ thống.

---

## 1. Khởi tạo & An toàn (2026-10-31)
- **Quyết định:** Tạo nhánh mới `feat/api-coverage-20261031` từ nhánh `feature/vector-ai-shopping-intelligence`.
- **Lý do:** Tuân thủ quy định nhánh mới `feat/api-coverage-YYYYMMDD`, không tác động lên `main`/`master` hay nhánh gốc.
- **Bảo toàn file có sẵn:**
  - `back-end/src/configs/redis.js`: Giữ nguyên tuyệt đối, không sửa, không add.
  - Các script benchmark/test có sẵn trong `back-end/src/scripts/`: Giữ nguyên.
  - Các file sửa đổi dở dang trước khi chạy lệnh: rà soát tích hợp đúng chức năng, không stash làm mất code của người dùng.
- **Quy tắc Git:** Chỉ dùng `git add <path-to-file>`, tuyệt đối không dùng `git add .` hoặc `git add -A`.

---
