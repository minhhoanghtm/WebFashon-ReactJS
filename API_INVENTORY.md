# API_INVENTORY.md — Backend API Inventory & Contract

Danh mục toàn bộ các endpoint REST API của backend REACT-WebFashion, hợp đồng dữ liệu, phân quyền và trạng thái tích hợp.

| Method | Endpoint | Authentication | Role | Request | Response | FE consumer | Status |
|---|---|---|---|---|---|---|---|
| GET | `/api/health` | None | Public | None | `{ status: "OK", services: { mongodb, redis } }` | App initial check | Existing |
| POST | `/api/auth/login` | None | Public | `{ email, passWord }` | `{ success: true, data: { user, accessToken } }` | `Login.jsx` | Existing |
| POST | `/api/auth/register` | None | Public | `{ email, passWord, fullName, phone }` | `{ success: true, message: string }` | `Register.jsx` | Existing |
| POST | `/api/auth/register/send-otp` | None | Public | `{ email/phone, purpose }` | `{ success: true, message: string }` | `Register.jsx` | Existing |
| POST | `/api/auth/verify-otp` | None | Public | `{ email/phone, otp, purpose }` | `{ success: true, data: { token } }` | `VerifyOtp.jsx` | Existing |
| POST | `/api/auth/password/forgot` | None | Public | `{ email/phone }` | `{ success: true, message: string }` | `ResetPassword.jsx` | Existing |
| POST | `/api/auth/password/reset` | None | Public | `{ email/phone, otp, newPassword }` | `{ success: true, message: string }` | `ResetPassword.jsx` | Existing |
| POST | `/api/auth/refresh` | Cookie / Bearer | Public/User | `{ refreshToken? }` | `{ success: true, data: { accessToken } }` | `authStore.js` / Axios interceptor | Existing |
| POST | `/api/auth/logout` | Bearer | User | None | `{ success: true, message: string }` | `StoreLayout.jsx`, `AdminLayout.jsx` | Existing |
| GET | `/api/user/me` | Bearer | User/Admin | None | `{ success: true, data: UserProfile }` | `useAuth.js`, `Profile.jsx` | Existing |
| PUT | `/api/user/profile` | Bearer | User | `{ fullName, phone, avatar_url }` | `{ success: true, data: UserProfile }` | `Profile.jsx` | Existing |
| POST | `/api/user/addresses` | Bearer | User | `{ fullName, phone, provinceCode, districtCode, wardCode, addressDetail, isDefault }` | `{ success: true, data: Address[] }` | `AddressBook.jsx`, `Checkout.jsx` | Existing |
| GET | `/api/categories` | None | Public | None | `{ success: true, data: Category[] }` | `Home.jsx`, `Products.jsx`, `AdminCategories.jsx` | Existing |
| GET | `/api/categories/:id` | None | Public | None | `{ success: true, data: Category }` | `Products.jsx` | Existing |
| POST | `/api/categories` | Bearer | Admin | `{ name, slug, image }` | `{ success: true, data: Category }` | `AdminCategories.jsx` | Existing |
| PUT | `/api/categories/:id` | Bearer | Admin | `{ name, slug, image }` | `{ success: true, data: Category }` | `AdminCategories.jsx` | Existing |
| DELETE | `/api/categories/:id` | Bearer | Admin | None | `{ success: true, message: string }` | `AdminCategories.jsx` | Existing |
| GET | `/api/products` | None | Public | Query: `limit, page, category, sort, minPrice, maxPrice` | `{ success: true, data: Product[], total?, totalPages? }` | `Home.jsx`, `Products.jsx`, `AdminProducts.jsx` | Existing |
| GET | `/api/products/search` | None | Public | Query: `q, limit, page` | `{ success: true, data: Product[] }` | `SearchModal.jsx`, `Products.jsx` | Existing |
| GET | `/api/products/:slug` | None | Public | Param: `slug` | `{ success: true, data: ProductDetail }` | `ProductDetail.jsx` | Existing |
| GET | `/api/products/:id/availability` | None | Public | Param: `id` | `{ success: true, available: boolean, stock: number }` | `ProductDetail.jsx` | Existing |
| POST | `/api/products` | Bearer | Admin | Product payload with variants | `{ success: true, data: Product }` | `AdminProducts.jsx` | Existing |
| PUT | `/api/products/:id` | Bearer | Admin | Product payload updates | `{ success: true, data: Product }` | `AdminProducts.jsx` | Existing |
| DELETE | `/api/products/:id` | Bearer | Admin | Param: `id` | `{ success: true, message: string }` | `AdminProducts.jsx` | Existing |
| GET | `/api/product_variants/:product_id` | None | Public | Param: `product_id` | `{ success: true, data: Variant[] }` | `ProductDetail.jsx` | Existing |
| GET | `/api/cart` | Bearer | User (no Admin) | None | `{ success: true, data: Cart }` | `Cart.jsx`, `HeaderCartIndicator.jsx` | Existing |
| POST | `/api/cart_items` | Bearer | User (no Admin) | `{ product_id, variant_id, quantity }` | `{ success: true, data: CartItem }` | `ProductDetail.jsx`, `Cart.jsx` | Existing |
| PUT | `/api/cart_items/:id` | Bearer | User (no Admin) | `{ quantity }` | `{ success: true, data: CartItem }` | `Cart.jsx` | Existing |
| DELETE | `/api/cart_items/:id` | Bearer | User (no Admin) | None | `{ success: true, message: string }` | `Cart.jsx` | Existing |
| POST | `/api/order` | Bearer / Optional | User / Guest | Order payload (items, shippingAddress, paymentMethod, voucherCode) | `{ success: true, data: Order }` | `Checkout.jsx` | Existing |
| GET | `/api/order/my-orders` | Bearer | User | Query: `page, limit, status` | `{ success: true, data: Order[] }` | `Orders.jsx`, `UserDashboard.jsx` | Existing |
| GET | `/api/order/lookup` | None | Public | Query: `orderCode, phone` | `{ success: true, data: Order }` | `OrderLookup.jsx` | Existing |
| GET | `/api/order/:id` | Bearer / Optional | User / Owner | Param: `id` | `{ success: true, data: Order }` | `PaymentResult.jsx`, `OrderDetailModal.jsx` | Existing |
| GET | `/api/order/admin/all` | Bearer | Admin | Query: `page, limit, status, search` | `{ success: true, data: Order[], total }` | `AdminOrders.jsx` | Existing |
| PUT | `/api/order/:id/status` | Bearer | Admin | `{ status }` | `{ success: true, data: Order }` | `AdminOrders.jsx` | Existing |
| POST | `/api/payments/momo/create` | Bearer / Optional | User | `{ orderId, amount }` | `{ success: true, payUrl: string }` | `Checkout.jsx` | Existing |
| POST | `/api/payments/vnpay/create` | Bearer / Optional | User | `{ orderId, amount, bankCode }` | `{ success: true, payUrl: string }` | `Checkout.jsx` | Existing |
| GET | `/api/vouchers` | None | Public | None | `{ success: true, data: Voucher[] }` | `Vouchers.jsx`, `AdminCoupons.jsx` | Existing |
| GET | `/api/vouchers/my` | Bearer | User | None | `{ success: true, data: Voucher[] }` | `MyCoupons.jsx`, `Checkout.jsx` | Existing |
| POST | `/api/vouchers/save` | Bearer | User | `{ voucherId }` | `{ success: true, message: string }` | `Vouchers.jsx` | Existing |
| POST | `/api/vouchers/apply` | Bearer | User | `{ code, orderTotal }` | `{ success: true, data: { discountAmount } }` | `Checkout.jsx` | Existing |
| GET | `/api/banners` | None | Public | None | `{ success: true, data: Banner[] }` | `Home.jsx`, `AdminBanners.jsx` | Existing |
| GET | `/api/lookbooks` | None | Public | None | `{ success: true, data: Lookbook[] }` | `Lookbooks.jsx`, `AdminLookbooks.jsx` | Existing |
| GET | `/api/campaigns` | None | Public | None | `{ success: true, data: Campaign[] }` | `Home.jsx`, `AdminCampaigns.jsx` | Existing |
| GET | `/api/pages/:slug` | None | Public | Param: `slug` | `{ success: true, data: PageContent }` | Static pages (`Policy.jsx`, `Terms.jsx`, etc.) | Existing |
| GET | `/api/settings` | None | Public | None | `{ success: true, data: WebsiteSettings }` | `StoreLayout.jsx`, `AdminSettings.jsx` | Existing |
| PUT | `/api/settings` | Bearer | Admin | Settings payload | `{ success: true, data: WebsiteSettings }` | `AdminSettings.jsx` | Existing |
| POST | `/api/shipping/fee` | None | Public | `{ toDistrictId, toWardCode, weight }` | `{ success: true, data: { totalFee } }` | `Checkout.jsx` | Existing |
| POST | `/api/ai/chat` | Optional / Bearer | Public / User | `{ message, history }` | `{ success: true, reply: string, recommendations?: Product[] }` | `AiAssistantModal.jsx` | Existing |
| POST | `/api/ai/actions/:id/confirm` | Bearer | User | None | `{ success: true, result: any }` | `AiAssistantModal.jsx` | Existing |
| POST | `/api/privacy/consent` | None | Public | `{ status: "granted"|"denied", categories }` | `{ success: true }` | `CookieConsentBanner.jsx` | Existing |
| POST | `/api/events` | None | Public | Batch array of user journey events | `{ success: true, count: number }` | `analytics.js` | Existing |
