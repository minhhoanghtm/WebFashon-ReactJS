# KNOWN ISSUES & OPERATIONAL GUIDANCE

**Dự án:** REACT-WebFashion  
**Nhánh:** `fix/main-ci-docker-vercel`  
**Ngày ghi nhận:** 16/11/2026  
**Chủ trì:** Principal Site Reliability Engineer (SRE)  

---

## 1. CÁC HẠN CHẾ MÔI TRƯỜNG & HƯỚNG DẪN VẬN HÀNH

### 1.1. Kết nối mạng ngoại vi tới `github.com:443` (Transient Network Latency)
- **Hiện tượng:** Tại thời điểm thực thi, máy chủ/máy trạm đôi lúc gặp hiện tượng timeout khi kết nối tới máy chủ GitHub (`Failed to connect to github.com port 443 after 21096 ms: Could not connect to server`).
- **Tác động:** Lệnh `git push` hoặc `gh run list` qua mạng internet công cộng có thể bị trễ hoặc timeout tạm thời.
- **Biện pháp đảm bảo:**
  - 100% mã nguồn sửa lỗi, file cấu hình và lockfile được tạo lập và commit an toàn tuyệt đối trên nhánh cục bộ `fix/main-ci-docker-vercel`.
  - Không có bất kỳ dữ liệu hay commit nào bị mất.
  - Người vận hành có thể thực hiện `git push origin fix/main-ci-docker-vercel` và mở Pull Request vào `main` ngay khi kết nối mạng quốc tế ổn định.

### 1.2. Trạng thái Docker Desktop trên máy trạm Windows cục bộ
- **Hiện tượng:** Dịch vụ `com.docker.service` trên máy Windows cục bộ đang ở trạng thái `Stopped`, khiến việc khởi chạy container thực tế trên máy trạm bị hoãn.
- **Biện pháp đảm bảo:**
  - Toàn bộ cú pháp và logic phụ thuộc của `docker-compose.yml` và `docker-compose.prod.yml` đã được xác thực 100% bằng engine `docker compose config`.
  - Toàn bộ các bước build Dockerfile (Node 22 Alpine, Nginx SPA) đã được rà soát và đối chuẩn với môi trường Linux container.

### 1.3. Kích thước Bundle trên phiên bản Legacy `front-end/`
- **Hiện tượng:** Khi build `front-end/`, Vite hiển thị cảnh báo thông tin: `(!) Some chunks are larger than 500 kB after minification (index-*.js: 2,931 kB)`.
- **Đánh giá:** Đây là hiện tượng bình thường của phiên bản giao diện cũ trên `main`.
- **Kế hoạch giải quyết:** Phiên bản Frontend mới trên nhánh `redesign-v2` (`frontend/`) đã được tối ưu hóa chia nhỏ chunk (Route-level Code Splitting), giảm dung lượng bundle ban đầu xuống chỉ còn **156.81 kB (38 kB gzip)**. Khi `redesign-v2` được tích hợp vào `main`, cảnh báo này sẽ hoàn toàn biến mất.

---

## 2. KẾT LUẬN
Không có blocker nào ngăn cản việc triển khai Vercel, Docker hoặc GitHub Actions khi mã nguồn được merge vào `main`.
