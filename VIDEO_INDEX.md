# VIDEO_INDEX.md — Walkthrough Video Index

Autonomous verification walkthrough recordings covering all 48 routes across Desktop and Mobile viewports for the **REACT-WebFashion** rebuild (`redesign-v2`).

---

## 1. Recorded Video Manifest

| Video File | Viewport | Target Resolution | File Size | Route Coverage | Status | Description |
|---|---|---|---|---|---|---|
| `videos/01-desktop-all-routes.webm` | Desktop | 1440 × 900 | 17.08 MB (17,909,718 B) | 48 / 48 Routes (100%) | **PASS** | Continuous sweep of all 48 routes on Desktop including Storefront, Catalog, Cart, Checkout, Content, Customer, Auth, and Admin views with Three.js Silk Hero and UI interactions. |
| `videos/02-mobile-all-routes.webm` | Mobile | 390 × 844 | 3.75 MB (3,930,029 B) | 48 / 48 Routes (100%) | **PASS** | Continuous sweep of all 48 routes on Mobile with zero horizontal overflow (`scrollWidth === clientWidth`), responsive hamburger navigation, touch targets >= 44px, and optimized cards. |

---

## 2. Route Sweep Sequence Recorded

Both recordings follow the exact chronological sequence across all 48 routes:

1. **Storefront & Commerce Flow:**
   - `/` — Homepage (Archive/Signal Silk 3D Hero, Featured Collections, Bento Grid, AI Assistant Entry)
   - `/products` — Full Catalog with Search, Sorting, and Category Facets
   - `/product/ao-khoac-bomber-unisex` — Product Detail View with Image Gallery, Variant Picker, Size Selector, Add to Cart
   - `/cart` — Shopping Bag with Quantity Modifiers, Subtotal Calculation, Free Shipping Progress Bar
   - `/checkout` — Checkout Flow with Address Form, Shipping Method, and Payment Gateways (COD, VNPAY, MoMo)
   - `/payment-result` — Payment Success / Order Confirmation Landing
   - `/order-lookup` — Public Order Tracking by Order Code & Phone Number
   - `/favorites` — Wishlist with Instant Add-to-Bag
   - `/vouchers` — Public Discount Coupons & Promo Voucher Catalog
   - `/lookbooks` — Curated Editorial Seasonal Lookbooks

2. **Content & Brand Slugs (12 Routes):**
   - `/about`, `/careers`, `/stores`, `/press`, `/sustainability`
   - `/shipping-policy`, `/returns-exchange`, `/size-guide`, `/faqs`
   - `/privacy-policy`, `/terms-of-service`, `/cookie-preferences`

3. **Authentication Flows (4 Routes):**
   - `/login`, `/register`, `/verify-otp`, `/reset-password`

4. **Customer Account Portal (6 Routes):**
   - `/account/profile`, `/account/orders`, `/account/coupons`, `/account/data-requests`, `/account/dashboard`, `/account/reviews/new`

5. **Admin Management Suite (14 Routes):**
   - `/admin`, `/admin/categories`, `/admin/products`, `/admin/orders`, `/admin/customers`
   - `/admin/coupons`, `/admin/campaigns`, `/admin/banners`, `/admin/lookbooks`, `/admin/chats`
   - `/admin/user-activity`, `/admin/ab-testing`, `/admin/pages`, `/admin/settings`

6. **System & Error Handling (2 Routes):**
   - `/404` — Dedicated Not Found page
   - `/random-unmatched-slug` — Wildcard Catch-all redirecting to 404

---

## 3. Playwright Recording Environment

- **Execution Engine:** Playwright Automation via Microsoft Edge Engine
- **Test Runner:** `scripts/run-full-suite-v2.mjs`
- **Video Codec:** WebM (VP8 video stream)
- **Zero Horizontal Overflow:** Verified on all 48 routes (`document.documentElement.scrollWidth <= window.innerWidth`)
- **Console Errors Recorded:** 0
- **Total Test Assertions Passed:** 96 / 96 (48 Desktop + 48 Mobile)
