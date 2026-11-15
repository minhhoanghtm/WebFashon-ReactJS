import React from "react";
import { createBrowserRouter } from "react-router-dom";

// Layouts
import { StoreLayout, AuthLayout } from "./components/layout/StoreLayout";
import { AdminLayout } from "./components/layout/AdminLayout";

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
  // 1. Storefront Routes
  {
    path: "/",
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "product/:slug", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "payment-result", element: <PaymentResult /> },
      { path: "payment/:orderId", element: <PaymentResult /> },
      { path: "order-lookup", element: <OrderLookup /> },
      { path: "favorites", element: <Favorites /> },
      { path: "vouchers", element: <Vouchers /> },
      { path: "lookbooks", element: <Lookbooks /> },

      // Static Content Pages
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

      // Customer Protected Pages
      { path: "my-coupons", element: <MyCoupons /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/data-requests", element: <DataRequests /> },
      { path: "user/dashboard", element: <UserDashboard /> },
      { path: "orders", element: <Orders /> },
      { path: "reviews/create", element: <CreateReview /> },

      // 404 test route
      { path: "non-existent-route-404-test", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },

  // 2. Authentication Routes
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "verify-otp", element: <VerifyOtp /> },
      { path: "reset-password", element: <ResetPassword /> },
    ],
  },

  // 3. Admin Routes
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
]);

export default router;
