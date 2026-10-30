# RESOURCE OWNERSHIP & ISOLATION SPECIFICATION
## Dự án: REACT-WebFashion (404 Studio)
## Môi trường: Multi-tier Isolated Environments (Local Dedicated Staging vs Shared Development)

---

## 1. REPOSITORY & FILESYSTEM BOUNDARY

- **Git Root Path**: `D:\Project\REACT-WebFashion`
- **Active Git Branch**: `feature/vector-ai-shopping-intelligence`
- **Allowed Subdirectories**:
  - `REACT-WebFashion/back-end` (Node.js/Express, BullMQ, Mongoose)
  - `REACT-WebFashion/front-end` (React 19, Vite, Tailwind CSS, TanStack Query)
  - `REACT-WebFashion/docs/tracking` (Documentation and audits)
  - `REACT-WebFashion/nginx` (Staging proxy configs)
  - `REACT-WebFashion/docker-compose.staging.yml`
- **Strictly Prohibited Operations**:
  - Writing or deleting files outside `D:\Project\REACT-WebFashion`.
  - Global process termination (`taskkill /IM node.exe /F` across the machine).
  - Modifying global Git configurations or global OS environment variables.
  - Running Docker prune or stopping containers belonging to external projects (`simmes-v3`, `postgres_openai_it`, `nhom01_ai_vector_it_pg`, `local_timescaledb`, etc.).

---

## 2. BẢNG QUẢN LÝ QUYỀN SỞ HỮU TÀI NGUYÊN (RESOURCE OWNERSHIP TABLE)

| Resource Name | Resource Type | Project Ownership | Environment | Allowed Operations | Isolation Evidence | Cleanup Policy |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **`webfashion-mongo-staging`** | MongoDB 7.0 Container (Port `27018`) | **100% REACT-WebFashion** | Local Isolated Staging | Đọc, Ghi, Seed, Index, Benchmark, E2E Tests, Reset Collection | Container `db3b1ce93a4c` chạy qua `docker-compose.staging.yml`. Database: `webfashion_staging`. Không chia sẻ với bất kỳ ứng dụng nào khác. | Dọn dẹp dữ liệu test bằng filter `e2e_*`, `test_*` hoặc reset collection của `webfashion_staging`. Không ảnh hưởng bên ngoài. |
| **`webfashion-redis-staging`** | Redis 7 Alpine Container (Port `6381`) | **100% REACT-WebFashion** | Local Isolated Staging | Đọc, Ghi, Restart, Draining, Flush, Benchmark tải cao | Container `b0b575bf927e` chạy qua `docker-compose.staging.yml`. Port 6381 tách biệt 100% với Redis 6379 chung. | Được phép `FLUSHDB` trên Redis 6381 vì thuộc quyền sở hữu riêng của dự án. |
| **`redis_local`** | Redis 7 Alpine Container (Port `6379`) | **SHARED** (Máy local dùng chung) | Host Local Dev | Chỉ đọc hoặc ghi với Key Prefix nghiêm ngặt (`webfashion:*`, `exp:*`, `bull:trackingQueue:*`) | Container `824d1bd39503` có thể được dùng chung bởi các project khác trên máy (`simmes-v3`, v.v.). | **TUYỆT ĐỐI CẤM** `FLUSHALL`, `FLUSHDB`, hoặc xóa keys theo wildcard `*`. Chỉ xóa key có prefix cụ thể của dự án. |
| **MongoDB Atlas Cluster** | Cloud Managed DB (`dpfy7rs.mongodb.net`) | **REACT-WebFashion Dev/Baseline** | Cloud Remote Dev | Đọc, Cập nhật trạng thái cấu hình thử nghiệm, KHÔNG chạy test phá hủy | 30 collections đều mang tên schema của WebFashion (`users`, `products`, `orders`, `userevents`, `user_interest_profiles`, v.v.). Database mặc định là `test` do URI không gán tên DB. | Không drop collection, không xóa customer accounts. Test ghi dữ liệu chuyển hướng sang `webfashion_staging`. |
| **Node.js API Server** | Express App (Port `5000` / `5050`) | **100% REACT-WebFashion** | Local / Staging | Khởi động, Dừng, Reload trong tiến trình cha-con có PID rõ ràng | PID quản lý trực tiếp qua process table của sub-agent. Không kill process Node lạ của máy. | Dừng tiến trình khi kết thúc turn kiểm thử. |
| **Frontend Web App** | Vite / Nginx (Port `5173` / `8088`) | **100% REACT-WebFashion** | Local / Staging | Build, Preview, E2E automation | Port 5173 (Dev) hoặc 8088 (Nginx staging). | Không can thiệp port web khác trên máy. |

---

## 3. NGUYÊN TẮC CÔ LẬP KIỂM THỬ (TEST ISOLATION STRATEGY)

Để đảm bảo an toàn $100\%$ và tuân thủ chỉ thị của Architect:
1. **Toàn bộ Integration Test, Benchmark tải cao và Browser E2E có hành vi ghi dữ liệu BẮT BUỘC thực thi trên:**
   - **MongoDB:** `mongodb://staging_admin:staging_secret@127.0.0.1:27018/webfashion_staging?authSource=admin`
   - **Redis:** `redis://127.0.0.1:6381`
2. **Hệ thống Development mặc định (Port 5000 / 6379):**
   - Áp dụng tiền tố cô lập `bull:trackingQueue:*`, `tracking:*`, `exp:*`, `sess:*`.
   - Cơ chế Graceful fallback đảm bảo không bao giờ gọi lệnh xóa toàn bộ Redis cache.
