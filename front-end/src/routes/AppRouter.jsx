import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import ProductSearch from "@/pages/ProductSearch";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import PaymentResult from "@/pages/PaymentResult";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyOTP from "@/pages/VerifyOTP";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/profile";
import Order from "@/pages/Order";
import Review from "@/pages/Review";
import Favorites from "@/pages/Favorites";
import MyCoupons from "@/pages/MyCoupons";
import VoucherHunting from "@/pages/VoucherHunting";
import { KPISkeleton, TableSkeleton } from "@/components/admin/ui/AdminSkeleton";

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));

const CatalogManagement = lazy(() =>
  import("@/pages/admin/CatalogManagement")
);
const ProductManagement = lazy(() =>
  import("@/pages/admin/ProductManagement")
);
const OrderManagement = lazy(() => import("@/pages/admin/OrderManagement"));
const AdminChatManagement = lazy(() =>
  import("@/pages/admin/AdminChatManagement")
);
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const CouponManagement = lazy(() => import("@/pages/admin/CouponManagement"));
const CampaignManagement = lazy(() =>
  import("@/pages/admin/CampaignManagement")
);
const BannerManagement = lazy(() => import("@/pages/admin/BannerManagement"));
const LookbookManagement = lazy(() =>
  import("@/pages/admin/LookbookManagement")
);
const ABTestingManagement = lazy(() =>
  import("@/pages/admin/ABTestingManagement")
);
const PageManagement = lazy(() => import("@/pages/admin/PageManagement"));
const WebsiteSettingsManagement = lazy(() =>
  import("@/pages/admin/WebsiteSettingsManagement")
);

const AdminFallbackSkeleton = () => (
  <div className="space-y-6 p-6" aria-busy="true" aria-label="Đang tải trang quản trị">
    <KPISkeleton count={4} />
    <TableSkeleton rows={4} cols={4} />
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<AdminFallbackSkeleton />}>
    {React.createElement(Component)}
  </Suspense>
);

const StagePlaceholder = () => (
  <section className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-10">
    <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-muted-foreground">
      WebFashion · Monochrome Atelier
    </p>
    <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
      Trang đang được triển khai ở giai đoạn tiếp theo
    </h1>
  </section>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <ProductSearch /> },
      { path: "product/:slug", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "payment-result", element: <PaymentResult /> },
      { path: "favorites", element: <Favorites /> },
      { path: "vouchers", element: <VoucherHunting /> },
      {
        path: "my-coupons",
        element: <ProtectedRoute element={<MyCoupons />} />,
      },
      {
        path: "profile",
        element: <ProtectedRoute element={<Profile />} />,
      },
      {
        path: "user/dashboard",
        element: <ProtectedRoute element={<Profile />} />,
      },
      {
        path: "orders",
        element: <ProtectedRoute element={<Order />} />,
      },
      {
        path: "reviews/create",
        element: <ProtectedRoute element={<Review />} />,
      },
      { path: "*", element: <StagePlaceholder /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "verify-otp", element: <VerifyOTP /> },
      { path: "reset-password", element: <ResetPassword /> },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["admin"]} element={<AdminLayout />} />,
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: "categories", element: withSuspense(CatalogManagement) },
      { path: "products", element: withSuspense(ProductManagement) },
      { path: "orders", element: withSuspense(OrderManagement) },
      { path: "chats", element: withSuspense(AdminChatManagement) },
      { path: "customers", element: withSuspense(UserManagement) },
      { path: "coupons", element: withSuspense(CouponManagement) },
      { path: "campaigns", element: withSuspense(CampaignManagement) },
      { path: "banners", element: withSuspense(BannerManagement) },
      { path: "lookbooks", element: withSuspense(LookbookManagement) },
      { path: "ab-testing", element: withSuspense(ABTestingManagement) },
      { path: "pages", element: withSuspense(PageManagement) },
      { path: "settings", element: withSuspense(WebsiteSettingsManagement) },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
