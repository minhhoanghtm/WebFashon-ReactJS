# V2 routes and API map

All routes are defined in `front-end/src/v2/router.jsx`. Existing API/client, service, store and utility modules are retained; no backend or `.env` file is changed.

| Route family | Final routes | Data/API used |
| --- | --- | --- |
| Store | `/`, `/products`, `/product/:slug`, `/favorites`, `/lookbooks`, `/vouchers` | products, categories, favorites, lookbooks, vouchers, campaigns/banners |
| Purchase | `/cart`, `/checkout`, `/payment-result`, `/payment/:orderId`, `/order-lookup` | cart/cart-items, vouchers/apply, order, payments, shipping |
| Content | `/policy`, `/privacy`, `/terms`, `/shipping`, `/returns-refunds`, `/payment-policy`, `/cookies`, `/contact-legal`, `/faq`, `/guide`, `/about`, `/blog` | pages/:slug (with useful local fallback if unavailable) |
| Identity | `/login`, `/register`, `/verify-otp`, `/reset-password` | auth/login, auth/register, auth/send-otp, auth/verify-otp, auth/forgot-password, auth/reset-password |
| Customer | `/my-coupons`, `/profile`, `/profile/data-requests`, `/user/dashboard`, `/orders`, `/reviews/create` | vouchers/my, user/me/profile, privacy, order/my-orders, reviews |
| Admin | `/admin`, `/admin/categories`, `/admin/products`, `/admin/orders`, `/admin/chats`, `/admin/customers`, `/admin/coupons`, `/admin/campaigns`, `/admin/banners`, `/admin/lookbooks`, `/admin/ab-testing`, `/admin/user-activity`, `/admin/pages`, `/admin/settings` | dashboard/orders/admin, categories, products, chat, users, vouchers, campaigns, banners, lookbooks, pages, settings |
| Fallback | `*` | none |

Guards remain behavioral rather than visual: protected pages redirect to `/login`; admin routes require `user.role === "admin"`.
