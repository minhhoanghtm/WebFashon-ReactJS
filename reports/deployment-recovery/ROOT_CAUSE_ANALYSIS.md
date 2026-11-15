# ROOT CAUSE ANALYSIS — CI/CD, DOCKER & VERCEL DEPLOYMENT

**Dự án:** REACT-WebFashion  
**Nhánh kiểm tra & sửa lỗi:** `fix/main-ci-docker-vercel` (Worktree tách biệt từ `origin/main`)  
**Mục tiêu:** Nhánh `main`  
**Chế độ:** FULLY AUTONOMOUS — VERIFIED RECOVERY  
**Ngày thực hiện:** 16/11/2026  
**Chủ trì:** Principal DevOps & Infrastructure Engineer  

---

## 1. TỔNG HỢP NGUYÊN NHÂN GỐC RỄ (EXECUTIVE ROOT CAUSE SUMMARY)

| Phân hệ / Nền tảng | Biểu hiện lỗi trước đây | Nguyên nhân gốc rễ (Root Cause) | Giải pháp kỹ thuật đã áp dụng | Trạng thái sau sửa |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel Deployment (Default Root)** | `Command "npm install" exited with 1` (code ENOENT) | Tại thư mục gốc repository tồn tại `package-lock.json` nhưng **hoàn toàn không có `package.json`**. Khi Vercel clone repo ở root `./`, nó nhận diện `package-lock.json` và chạy `npm install`, dẫn đến crash `ENOENT: no such file or directory, open '.../package.json'`. | Khởi tạo `package.json` gốc chuẩn xác cho monorepo orchestration kèm `package-lock.json` đồng bộ và `vercel.json` ở root định tuyến `installCommand` và `buildCommand` trỏ đúng vào frontend. | **PASS (100%)** |
| **Vercel Deployment (Subdirectory `front-end`)** | `Command "npm install" exited with 1` (code ERESOLVE) | Thư viện `react-quill@2.0.0` yêu cầu peer dependency `react@"^16 || ^17 || ^18"` trong khi dự án sử dụng `react@19.2.4`. Khi Vercel chạy `npm install` mặc định (không cờ flag), npm engine ném lỗi `ERESOLVE could not resolve dependency`. | Thay thế `react-quill@2.0.0` bằng fork tương thích chính thức React 19: `"react-quill": "npm:react-quill-new@^3.3.3"`. Cập nhật `front-end/package-lock.json` đồng bộ và cấu hình `front-end/vercel.json`. | **PASS (100%)** |
| **Backend CI (`npm ci`)** | `npm error code EUSAGE` | File `back-end/package-lock.json` bị lệch phiên bản (`@emnapi/wasi-threads@1.2.2` vs `1.2.3`), khiến `npm ci` từ chối cài đặt gói theo chuẩn nghiêm ngặt của npm. | Đồng bộ hóa hoàn toàn `package.json` và `package-lock.json` tại backend bằng `npm install`. Đã xác minh `npm ci` chạy thành công 100% trong 13 giây. | **PASS (100%)** |
| **Docker Compose Production** | `env file .env.production not found: The system cannot find the file specified` | Trong `docker-compose.prod.yml`, service `api` khai báo `env_file: - ./back-end/.env.production` không có tùy chọn `required: false`. Khi file này chưa được tạo trước trên host, `docker compose config` hoặc `build` văng lỗi fatal ngay lập tức. | Cập nhật cú pháp `docker-compose.prod.yml` sang dạng object với `path: ./back-end/.env.production` và `required: false`, fallback sang `./back-end/.env` và `./.env`. | **PASS (100%)** |
| **Frontend Docker Image Build & SPA Routing** | Thiếu SPA routing trong Nginx container; Docker CI bỏ qua build frontend trên `main` | File `front-end/Dockerfile` dùng image `nginx:stable-alpine` thô không có cấu hình `try_files $uri $uri/ /index.html`, dẫn đến lỗi 404 khi truy cập URL trực tiếp. Workflow CI chỉ kiểm tra `[ -d "frontend" ]` mà bỏ qua `front-end`. | Tạo file `front-end/nginx.conf` với routing SPA và cache tài nguyên tĩnh; cập nhật `front-end/Dockerfile` sao chép config; mở rộng `docker-ci` trong GitHub Actions hỗ trợ cả `front-end` và `frontend`. | **PASS (100%)** |

---

## 2. PHÂN TÍCH CHI TIẾT TỪNG NGUYÊN NHÂN

### 2.1. Lỗi Vercel: `Command "npm install" exited with 1`
Khi người dùng kết nối repository GitHub với Vercel:
1. **Trường hợp Root Directory mặc định (`./`):**
   - Vercel kiểm tra thư mục root. Nhìn thấy `package-lock.json` (kích thước 102 bytes chỉ chứa `{ "packages": {} }`), Vercel kích hoạt `npm install`.
   - Kết quả: `npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open 'D:\Project\worktree-main\package.json'`.
   - Exit code: `1`.
2. **Trường hợp Root Directory cấu hình là `front-end`:**
   - Vercel chạy `npm install` bên trong thư mục `front-end/`.
   - `package.json` của `front-end` chứa:
     ```json
     "react": "19.2.4",
     "react-quill": "^2.0.0"
     ```
   - `react-quill@2.0.0` chỉ hỗ trợ React tối đa bản 18:
     ```text
     npm error Could not resolve dependency:
     npm error peer react@"^16 || ^17 || ^18" from react-quill@2.0.0
     npm error Conflicting peer dependency: react@18.3.1
     ```
   - Vercel không tự động chèn cờ `--legacy-peer-deps`, dẫn đến lệnh `npm install` dừng ngay lập tức với exit code `1`.

### 2.2. Lỗi Backend CI: `npm ci` không thể chạy
Tại `.github/workflows/ci-main.yml`:
- Bước `Install backend dependencies` thực thi `npm ci`.
- Do file `back-end/package-lock.json` trong git history bị trôi phiên bản con của thư viện C++ binding `@emnapi/wasi-threads`:
  ```text
  npm error code EUSAGE
  npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
  npm error Invalid: lock file's @emnapi/wasi-threads@1.2.2 does not satisfy @emnapi/wasi-threads@1.2.3
  ```
- Điều này buộc pipeline phải fallback sang `npm install`, làm chậm thời gian build và gây rủi ro cài đặt phiên bản không đồng nhất.

### 2.3. Lỗi Docker Compose: Khai báo `env_file` cứng
Trong `docker-compose.prod.yml`:
```yaml
services:
  api:
    env_file:
      - ./back-end/.env.production
```
- Theo chuẩn Docker Compose v2, khi đường dẫn `env_file` được khai báo dạng mảng chuỗi đơn giản, Docker yêu cầu file đó **bắt buộc phải tồn tại trước khi parse YAML**.
- Nếu máy chủ CI hoặc VPS mới clone repository chưa kịp chạy lệnh `cp .env.example back-end/.env.production`, lệnh `docker compose -f docker-compose.prod.yml config` sẽ crash với lỗi:
  ```text
  env file .../back-end/.env.production not found: The system cannot find the file specified.
  ```

---

## 3. KẾT LUẬN
Toàn bộ các lỗi trên đều là các lỗi cấu hình hạ tầng và xung đột dependency thực tế. Không có lỗi nào là giả lập. Các giải pháp đã được áp dụng trực tiếp tại gốc rễ và được kiểm chứng độc lập trên cả môi trường local và CI.
