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
import { Favorites, Vouchers, Lookbooks } from "./pages/store/Favorites";
import { StaticPages } from "./pages/store/StaticPages";

// Auth Pages
import { Login, Register, VerifyOtp, ResetPassword } from "./pages/auth/AuthPages";

// Customer Pages
import {
  Profile,
  Orders,
  MyCoupons,
  DataRequests,
  UserDashboard,
  CreateReview,
} from "./pages/customer/CustomerPages";

// Admin Pages
import {
  AdminDashboard,
  AdminCategories,
  AdminProducts,
  AdminOrders,
  AdminCustomers,
  AdminCoupons,
  AdminCampaigns,
  AdminBanners,
  AdminLookbooks,
  AdminChats,
  AdminUserActivity,
  AdminAbTesting,
  AdminPages,
  AdminSettings,
} from "./pages/admin/AdminPages";

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
