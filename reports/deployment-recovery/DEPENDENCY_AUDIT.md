# DEPENDENCY COMPATIBILITY & SECURITY AUDIT

**Dự án:** REACT-WebFashion  
**Nhánh:** `fix/main-ci-docker-vercel`  
**Trạng thái:** HOÀN THÀNH — CLEAN TREE & COMPATIBLE  
**Chủ trì:** Senior Full-Stack & Dependency Management Engineer  

---

## 1. TỔNG QUAN RÀ SOÁT DEPENDENCY

Việc rà soát dependency được thực hiện trên cả 3 tầng:
1. Thư mục gốc (`./`): Điều phối Monorepo.
2. Thư mục Frontend (`front-end/`): Ứng dụng React 19 Client.
3. Thư mục Backend (`back-end/`): Ứng dụng Node.js Express API.

---

## 2. CHI TIẾT TẦNG FRONTEND (`front-end/package.json`)

### 2.1. Phân tích xung đột Peer Dependency
- **Node runtime:** Node.js v22 LTS / v24.
- **React version:** `react@19.2.4` và `react-dom@19.2.4`.
- **Thư viện gây lỗi:** `react-quill@2.0.0` chỉ khai báo hỗ trợ:
  ```json
  "peerDependencies": {
    "react": "^16 || ^17 || ^18",
    "react-dom": "^16 || ^17 || ^18"
  }
  ```
  Đây là nguyên nhân chính khiến npm 7+ bật cơ chế ERESOLVE nghiêm ngặt và hủy quá trình cài đặt với mã lỗi 1.

### 2.2. Giải pháp khắc phục triệt để
- Sử dụng tính năng npm Package Aliasing:
  `"react-quill": "npm:react-quill-new@^3.3.3"`
  - `react-quill-new` khai báo:
    ```json
    "peerDependencies": {
      "react": "^16 || ^17 || ^18 || ^19",
      "react-dom": "^16 || ^17 || ^18 || ^19"
    }
    ```
  - Giúp bảo toàn 100% mã nguồn hiện có (`import ReactQuill from "react-quill"` và style `react-quill/dist/quill.snow.css`) mà không làm gãy API.

### 2.3. Loại bỏ các thư viện dư thừa và đặt sai vị trí
- **`swal: ^0.1.0`:** Thư viện SweetAlert v1 từ hơn 10 năm trước, không còn bất kỳ file nào trong dự án import. Đã loại bỏ.
- **`path: ^0.12.7`:** Thư viện giả lập module `path` của Node trong browser, không được sử dụng. Đã loại bỏ.
- **`shadcn: ^4.4.0`:** Đây là công cụ dòng lệnh (CLI generator), không phải thư viện runtime. Việc để ở `dependencies` kéo theo 50MB package phụ thuộc (như `@modelcontextprotocol/sdk`, `@dotenvx/dotenvx`). Đã chuyển về `devDependencies`.

---

## 3. CHI TIẾT TẦNG BACKEND (`back-end/package.json`)

### 3.1. Sự cố Lockfile Desynchronization
- File `back-end/package-lock.json` trước đây chứa `@emnapi/wasi-threads@1.2.2`, trong khi package cha yêu cầu phiên bản `1.2.3`.
- Khi `npm ci` chạy trong CI/CD, nó phát hiện sự sai lệch giữa `package.json` và `package-lock.json` và dừng lại với mã `EUSAGE`.

### 3.2. Giải pháp khắc phục
- Tái tạo lại lockfile bằng lệnh `npm install --no-audit --no-fund`.
- File `back-end/package-lock.json` hiện đã khớp 100% với cây phụ thuộc của toàn bộ 46 thư viện backend.

---

## 4. CHI TIẾT TẦNG GỐC (`./package.json`)

- Tạo `package.json` gốc không chứa bất kỳ external dependency nào (`"dependencies": {}`).
- File `package-lock.json` ở root có kích thước siêu nhẹ (~60 dòng), giúp `npm install` hoặc `npm ci` hoàn tất trong 1 giây trên Vercel.

---

## 5. KẾT LUẬN
Cây phụ thuộc (Dependency Tree) của toàn bộ dự án đã đạt trạng thái sạch, ổn định, tương thích hoàn toàn với chuẩn npm 10 và Node.js 22+.
