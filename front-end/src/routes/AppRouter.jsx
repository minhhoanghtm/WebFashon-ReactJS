import React, { Suspense, lazy, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import CookieConsentBanner from "@/components/privacy/CookieConsentBanner";
import PrivacyPreferencesModal from "@/components/privacy/PrivacyPreferencesModal";
import Home from "@/pages/Home";
import ProductSearch from "@/pages/ProductSearch";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import PaymentResult from "@/pages/PaymentResult";
import Payment from "@/pages/Payment";
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
import Policy from "@/pages/Policy";
import Privacy from "@/pages/Privacy";
import DataRequests from "@/pages/DataRequests";
import Terms from "@/pages/Terms";
import Shipping from "@/pages/Shipping";
import ReturnsRefunds from "@/pages/ReturnsRefunds";
import PaymentPolicy from "@/pages/PaymentPolicy";
import Cookies from "@/pages/Cookies";
import ContactLegal from "@/pages/ContactLegal";
import FAQ from "@/pages/FAQ";
import Guide from "@/pages/Guide";
import LookbookList from "@/pages/LookbookList";
import OrderLookup from "@/pages/OrderLookup";
import NotFound from "@/pages/not-found";
import VoucherRouteGuard from "@/components/VoucherRouteGuard";
import ReviewRouteGuard from "@/components/ReviewRouteGuard";
import { KPISkeleton, TableSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { consentService } from "@/services/consent.service";

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
const UserActivityMonitoring = lazy(() =>
  import("@/pages/admin/UserActivityMonitoring")
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

const RootAppLayout = () => {
  useEffect(() => {
    consentService.initializePolicyVersion();
  }, []);

  return <>
    <Outlet />
    <CookieConsentBanner />
    <PrivacyPreferencesModal />
  </>;
};

const router = createBrowserRouter([
  {
    element: <RootAppLayout />,
    children: [
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
      { path: "payment/:orderId", element: <ProtectedRoute element={<Payment />} /> },
      { path: "order-lookup", element: <OrderLookup /> },
      { path: "favorites", element: <Favorites /> },
      {
        path: "vouchers",
        element: (
          <VoucherRouteGuard>
            <VoucherHunting />
          </VoucherRouteGuard>
        ),
      },
      { path: "lookbooks", element: <LookbookList /> },
      { path: "policy", element: <Policy /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      { path: "shipping", element: <Shipping /> },
      { path: "returns-refunds", element: <ReturnsRefunds /> },
      { path: "payment-policy", element: <PaymentPolicy /> },
      { path: "cookies", element: <Cookies /> },
      { path: "contact-legal", element: <ContactLegal /> },
      { path: "faq", element: <FAQ /> },
      { path: "guide", element: <Guide /> },
      { path: "about", element: <Policy /> },
      { path: "blog", element: <LookbookList /> },
      {
        path: "my-coupons",
        element: (
          <ProtectedRoute
            element={
              <VoucherRouteGuard>
                <MyCoupons />
              </VoucherRouteGuard>
            }
          />
        ),
      },
      {
        path: "profile",
        element: <ProtectedRoute element={<Profile />} />,
      },
      { path: "profile/data-requests", element: <ProtectedRoute element={<DataRequests />} /> },
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
        element: (
          <ProtectedRoute
            element={
              <ReviewRouteGuard>
                <Review />
              </ReviewRouteGuard>
            }
          />
        ),
      },
      { path: "*", element: <NotFound /> },
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
      { path: "user-activity", element: withSuspense(UserActivityMonitoring) },
      { path: "pages", element: withSuspense(PageManagement) },
      { path: "settings", element: withSuspense(WebsiteSettingsManagement) },
    ],
  },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
