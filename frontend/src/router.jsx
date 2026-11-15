import React from "react";
import { createBrowserRouter } from "react-router-dom";

// Hallmark Specialized Layout Framework
import {
  EditorialLayout,
  CommerceLayout,
  ProductDetailLayout,
  CheckoutLayout,
  AccountLayout,
  LookbookLayout,
  ContentLayout,
  SystemLayout,
  AuthLayout,
  AdminLayout,
} from "./layouts";

// Store Pages
import { Home } from "./pages/store/Home";
import { Products } from "./pages/store/Products";
import { ProductDetail } from "./pages/store/ProductDetail";
import { Cart } from "./pages/store/Cart";
import { Checkout } from "./pages/store/Checkout";
import { PaymentResult, OrderLookup } from "./pages/store/PaymentResult";

// Secondary Store Pages (Lazy)
const Favorites = React.lazy(() => import("./pages/store/Favorites").then((m) => ({ default: m.Favorites })));
const Vouchers = React.lazy(() => import("./pages/store/Favorites").then((m) => ({ default: m.Vouchers })));
const Lookbooks = React.lazy(() => import("./pages/store/Favorites").then((m) => ({ default: m.Lookbooks })));
const StaticPages = React.lazy(() => import("./pages/store/StaticPages").then((m) => ({ default: m.StaticPages })));

// Auth Pages (Lazy)
const Login = React.lazy(() => import("./pages/auth/AuthPages").then((m) => ({ default: m.Login })));
const Register = React.lazy(() => import("./pages/auth/AuthPages").then((m) => ({ default: m.Register })));
const VerifyOtp = React.lazy(() => import("./pages/auth/AuthPages").then((m) => ({ default: m.VerifyOtp })));
const ResetPassword = React.lazy(() => import("./pages/auth/AuthPages").then((m) => ({ default: m.ResetPassword })));

// Customer Pages (Lazy)
const Profile = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.Profile })));
const Orders = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.Orders })));
const MyCoupons = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.MyCoupons })));
const DataRequests = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.DataRequests })));
const UserDashboard = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.UserDashboard })));
const CreateReview = React.lazy(() => import("./pages/customer/CustomerPages").then((m) => ({ default: m.CreateReview })));

// Admin Pages (Lazy)
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminDashboard })));
const AdminCategories = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminCategories })));
const AdminProducts = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminProducts })));
const AdminOrders = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminOrders })));
const AdminCustomers = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminCustomers })));
const AdminCoupons = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminCoupons })));
const AdminCampaigns = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminCampaigns })));
const AdminBanners = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminBanners })));
const AdminLookbooks = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminLookbooks })));
const AdminChats = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminChats })));
const AdminUserActivity = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminUserActivity })));
const AdminAbTesting = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminAbTesting })));
const AdminPages = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminPages })));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: m.AdminSettings })));

// System Pages
import { NotFound } from "./pages/system/NotFound";

export const router = createBrowserRouter([
  // 1. Template A — Editorial Homepage
  {
    path: "/",
    element: <EditorialLayout />,
    children: [
      { index: true, element: <Home /> },
    ],
  },

  // 2. Template B — Product Discovery
  {
    element: <CommerceLayout />,
    children: [
      { path: "products", element: <Products /> },
      { path: "favorites", element: <Favorites /> },
      { path: "vouchers", element: <Vouchers /> },
    ],
  },

  // 3. Template C — Product Detail Experience
  {
    element: <ProductDetailLayout />,
    children: [
      { path: "product/:slug", element: <ProductDetail /> },
    ],
  },

  // 4. Template D — Minimal Checkout Flow
  {
    element: <CheckoutLayout />,
    children: [
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "payment-result", element: <PaymentResult /> },
      { path: "payment/:orderId", element: <PaymentResult /> },
    ],
  },

  // 5. Template E — Personal Account Workspace
  {
    element: <AccountLayout />,
    children: [
      { path: "user/dashboard", element: <UserDashboard /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/data-requests", element: <DataRequests /> },
      { path: "orders", element: <Orders /> },
      { path: "my-coupons", element: <MyCoupons /> },
      { path: "reviews/create", element: <CreateReview /> },
    ],
  },

  // 6. Template G — Editorial Lookbook
  {
    element: <LookbookLayout />,
    children: [
      { path: "lookbooks", element: <Lookbooks /> },
    ],
  },

  // 7. Template J — Support & Content Hub (Reading-focused)
  {
    element: <ContentLayout />,
    children: [
      { path: "policy", element: <StaticPages /> },
      { path: "privacy", element: <StaticPages /> },
      { path: "terms", element: <StaticPages /> },
      { path: "shipping", element: <StaticPages /> },
      { path: "returns-refunds", element: <StaticPages /> },
      { path: "payment-policy", element: <StaticPages /> },
      { path: "cookies", element: <StaticPages /> },
      { path: "contact-legal", element: <StaticPages /> },
      { path: "faq", element: <StaticPages /> },
      { path: "guide", element: <StaticPages /> },
      { path: "about", element: <StaticPages /> },
      { path: "blog", element: <StaticPages /> },
    ],
  },

  // 8. Template I — Authentication
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "verify-otp", element: <VerifyOtp /> },
      { path: "reset-password", element: <ResetPassword /> },
    ],
  },

  // 9. Template H — Admin Operations
  {
    path: "admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "categories", element: <AdminCategories /> },
      { path: "products", element: <AdminProducts /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "customers", element: <AdminCustomers /> },
      { path: "coupons", element: <AdminCoupons /> },
      { path: "campaigns", element: <AdminCampaigns /> },
      { path: "banners", element: <AdminBanners /> },
      { path: "lookbooks", element: <AdminLookbooks /> },
      { path: "chats", element: <AdminChats /> },
      { path: "user-activity", element: <AdminUserActivity /> },
      { path: "ab-testing", element: <AdminAbTesting /> },
      { path: "pages", element: <AdminPages /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },

  // 10. Template K — System & Error
  {
    element: <SystemLayout />,
    children: [
      { path: "order-lookup", element: <OrderLookup /> },
      { path: "non-existent-route-404-test", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
