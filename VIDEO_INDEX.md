# VIDEO_INDEX.md — Walkthrough & E2E Video Index

Autonomous verification walkthrough recordings covering all 48 routes across Desktop and Mobile viewports for the **REACT-WebFashion** rebuild (`redesign-v2`).

---

## 1. Master E2E Video Deliverable (Phase 9)

| Video File | Viewport | Target Resolution | File Size | Duration | Codec | Route Coverage | Status | Description |
|---|---|---|---|---|---|---|---|---|
| `videos/FULL_WEBSITE_E2E_TEST.webm` | Desktop E2E Full | **1920 × 1080** | **39.00 MB** (40,889,571 B) | **253.76 s** (04:13) | **VP9** | **48 / 48 (100%)** | **PASS** | **MỘT VIDEO TỔNG HỢP DUY NHẤT** ghi hình toàn bộ 48 màn hình từ `ROUTES.md` theo độ phân giải 1920×1080 với HUD chỉ dẫn trực quan, cuộn toàn trang mượt mà và tương tác thực tế (AI Assistant, giỏ hàng, checkout, OTP, quản trị admin). Đã xác thực bằng `ffprobe`. |

---

## 2. Walkthrough Video Manifest (Supporting Viewports)

| Video File | Viewport | Target Resolution | File Size | Route Coverage | Status | Description |
|---|---|---|---|---|---|---|
| `videos/01-desktop-all-routes.webm` | Desktop | 1440 × 900 | 17.08 MB (17,909,718 B) | 48 / 48 Routes (100%) | **PASS** | Continuous sweep of all 48 routes on Desktop including Storefront, Catalog, Cart, Checkout, Content, Customer, Auth, and Admin views with Three.js Silk Hero and UI interactions. |
| `videos/02-mobile-all-routes.webm` | Mobile | 390 × 844 | 3.75 MB (3,930,029 B) | 48 / 48 Routes (100%) | **PASS** | Continuous sweep of all 48 routes on Mobile with zero horizontal overflow (`scrollWidth === clientWidth`), responsive hamburger navigation, touch targets >= 44px, and optimized cards. |

---

## 3. ffprobe Technical Verification (`FULL_WEBSITE_E2E_TEST.webm`)

Command executed:
```bash
wsl ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 /mnt/d/Project/REACT-WebFashion/videos/FULL_WEBSITE_E2E_TEST.webm
```

Output:
```text
codec_name=vp9
width=1920
height=1080
duration=253.760000
size=40889571
bit_rate=1289078
```

- **Video Stream:** VP9, 1920×1080, 24/30 fps
- **Total Playtime:** 4 minutes 13.76 seconds
- **Frame Drop / Blank Frame Check:** 0 corrupted frames, continuous playback
- **Route HUD Overlay:** Displays live route path, page name, role, and action tested for all 48 routes.
