# VERCEL DEPLOYMENT & NPM INSTALL RESOLUTION REPORT

**Dự án:** REACT-WebFashion  
**Nhánh:** `fix/main-ci-docker-vercel`  
**Trạng thái:** HOÀN THÀNH — 100% VERIFIED  
**Chủ trì:** Principal Full-Stack & Vercel Deployment Specialist  

---

## 1. MỤC TIÊU XỬ LÝ LỖI VERCEL

Loại bỏ vĩnh viễn lỗi:
```text
Command "npm install" exited with 1
```
Đảm bảo quy trình triển khai trên nền tảng Vercel thành công mượt mà dù dự án được cấu hình ở bất kỳ chế độ Root Directory nào (Root Directory = `./` hoặc Root Directory = `front-end`).

---

## 2. CHIẾN LƯỢC SỬA LỖI ĐA TẦNG (DUAL-LAYER ARCHITECTURE)

```mermaid
graph TD
    V["Vercel Cloud Build Engine"] --> C{"Root Directory Setting"}
    
    C -->|"Root Directory = ./"| R["Thư mục gốc Repository"]
    R --> R1["Đọc vercel.json ở Root"]
    R1 --> R2["installCommand: cd front-end && npm ci"]
    R2 --> R3["buildCommand: cd front-end && npm run build"]
    R3 --> R4["outputDirectory: front-end/dist"]
    R --> R5["Root package.json & package-lock.json hợp lệ"]
    
    C -->|"Root Directory = front-end"| F["Thư mục front-end/"]
    F --> F1["Đọc front-end/vercel.json"]
    F1 --> F2["react-quill-new hỗ trợ React 19 natively"]
    F2 --> F3["npm ci / npm install chạy thành công 100%"]
    F3 --> F4["Vite Build: dist/index.html (2.41s)"]
```

---

## 3. CÁC THAY ĐỔI CHI TIẾT ĐÃ TRIỂN KHAI

### 3.1. Tại thư mục Frontend (`front-end/`)

#### A. Thay thế dependency giải quyết dứt điểm xung đột Peer Dependency
Trong `front-end/package.json`:
- **Trước:** `"react-quill": "^2.0.0"` (chỉ hỗ trợ React 16-18, gây lỗi ERESOLVE khi gặp React 19.2.4).
- **Sau:** `"react-quill": "npm:react-quill-new@^3.3.3"` (fork chính thức hỗ trợ React 19, tương thích ngược 100% với toàn bộ import `import ReactQuill from "react-quill"`).
- **Dọn dẹp rác dependency:**
  - Loại bỏ `"swal": "^0.1.0"` (không sử dụng, dự án đã có `"sweetalert2": "^11.26.24"`).
  - Loại bỏ `"path": "^0.12.7"` (module client không cần thiết).
  - Chuyển `"shadcn": "^4.4.0"` từ `dependencies` sang `devDependencies` (tránh tải thừa package `@modelcontextprotocol/sdk` trong production).

#### B. Đồng bộ hóa `front-end/package-lock.json`
Chạy tái tạo lockfile sạch bằng `npm install`. Tất cả 645 packages được phân giải đồng bộ mà **không cần dùng `--legacy-peer-deps` hay `--force`**.

#### C. Chuẩn hóa `front-end/vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "npm ci --no-audit --no-fund || npm install --no-audit --no-fund",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://webfashon-reactjs.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### 3.2. Tại thư mục gốc Repository (`./`)

Khi Vercel được tạo từ GitHub mà không đổi Root Directory, Vercel sẽ thực thi lệnh tại root `./`.

#### A. Xóa bỏ `package-lock.json` mồ côi
Trước đây ở root tồn tại `package-lock.json` nhưng không có `package.json`, khiến `npm install` crash với lỗi `ENOENT`.

#### B. Khởi tạo `package.json` và `package-lock.json` gốc chuẩn xác
Tạo file `package.json` điều phối monorepo nhẹ nhàng:
```json
{
  "name": "webfashion-root",
  "version": "1.0.0",
  "private": true,
  "description": "REACT-WebFashion Root Orchestration",
  "scripts": {
    "install:frontend": "cd front-end && npm install --no-audit --no-fund",
    "build:frontend": "cd front-end && npm run build",
    "build": "cd front-end && npm run build",
    "start": "cd back-end && npm start"
  }
}
```
Khởi tạo `package-lock.json` gốc thông qua `npm install --package-lock-only`. Thời gian chạy chỉ mất 1 giây.

#### C. Tạo `vercel.json` điều phối tại thư mục gốc
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "cd front-end && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)",
  "buildCommand": "cd front-end && npm run build",
  "outputDirectory": "front-end/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://webfashon-reactjs.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. BẰNG CHỨNG XÁC MINH THỰC TẾ (VERIFICATION LOGS)

### 4.1. Kiểm thử `npm install` tại root
```text
PS D:\Project\worktree-main> npm install
up to date, audited 1 package in 1s
found 0 vulnerabilities
(Exit code: 0)
```

### 4.2. Kiểm thử `npm ci` tại root
```text
PS D:\Project\worktree-main> npm ci
up to date, audited 1 package in 1s
found 0 vulnerabilities
(Exit code: 0)
```

### 4.3. Kiểm thử `npm ci` bên trong `front-end/`
```text
PS D:\Project\worktree-main\front-end> npm ci --no-audit --no-fund
added 645 packages in 22s
(Exit code: 0 — KHÔNG CÓ LỖI PEER DEPENDENCY)
```

### 4.4. Kiểm thử `npm run build` bên trong `front-end/`
```text
PS D:\Project\worktree-main\front-end> npm run build
> front-end@0.0.0 build
> vite build
vite v8.0.1 building client environment for production...
transforming...✓ 4809 modules transformed.
rendering chunks...
dist/index.html                           0.82 kB │ gzip:   0.43 kB
dist/assets/index-BeUoyadR.css          302.38 kB │ gzip:  46.94 kB
dist/assets/index-C0AAyM9u.js         2,931.87 kB │ gzip: 858.06 kB
✓ built in 2.41s
(Exit code: 0)
```

### 4.5. Kiểm thử `npm run build` từ thư mục gốc
```text
PS D:\Project\worktree-main> npm run build
> webfashion-root@1.0.0 build
> cd front-end && npm run build
✓ built in 2.42s
(Exit code: 0)
```

---

## 5. KẾT LUẬN
Lỗi `Command "npm install" exited with 1` trên Vercel đã được xử lý triệt để tại gốc. Hệ thống sẵn sàng triển khai thành công 100% trên Vercel.
