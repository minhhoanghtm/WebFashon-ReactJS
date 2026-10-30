import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';

import Home from '../pages/Home';
import About from '../pages/About';
import ProductSearch from '../pages/ProductSearch';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ResetPassword from '../pages/ResetPassword';
import VerifyOTP from '../pages/VerifyOTP';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import PaymentResult from '../pages/PaymentResult';
import Profile from '../pages/profile';
import Order from '../pages/Order';
import Review from '../pages/Review';
import NotFound from '../pages/not-found';
import VoucherHunting from '../pages/VoucherHunting';
import MyCoupons from '../pages/MyCoupons';
import Favorites from '../pages/Favorites';
import Policy from '../pages/Policy';
import FAQ from '../pages/FAQ';
import Guide from '../pages/Guide';
import Landing from '../pages/Landing';
import Blog from '../pages/Blog';
import LookbookList from '../pages/LookbookList';
import LookbookDetail from '../pages/LookbookDetail';
import CampaignDetail from '../pages/CampaignDetail';
import ProtectedRoute from '@/components/ProtectedRoute';

// Admin tooling is only needed behind a protected route. Loading it on the
// storefront was also pulling ECharts into the initial JavaScript graph.
const CatalogManagement = lazy(() => import('@/pages/admin/CatalogManagement'));
const ProductManagement = lazy(() => import('@/pages/admin/ProductManagement'));
const OrderManagement = lazy(() => import('@/pages/admin/OrderManagement'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const CouponManagement = lazy(() => import('@/pages/admin/CouponManagement'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminChatManagement = lazy(() => import('@/pages/admin/AdminChatManagement'));
const WebsiteSettingsManagement = lazy(() => import('@/pages/admin/WebsiteSettingsManagement'));
const BannerManagement = lazy(() => import('@/pages/admin/BannerManagement'));
const PageManagement = lazy(() => import('@/pages/admin/PageManagement'));
const LookbookManagement = lazy(() => import('@/pages/admin/LookbookManagement'));
const CampaignManagement = lazy(() => import('@/pages/admin/CampaignManagement'));
const ABTestingManagement = lazy(() => import('@/pages/admin/ABTestingManagement'));

const AdminRoute = ({ Component }) => (
  <Suspense fallback={null}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'policy', element: <Policy /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'guide', element: <Guide /> },
      { path: 'landing', element: <Landing /> },
      { path: 'blog', element: <Blog /> },
      { path: 'products', element: <ProductSearch /> },
      { path: 'product/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'payment-result', element: <PaymentResult /> },
      { path: 'profile', element: <Profile /> },
      { path: 'vouchers', element: <VoucherHunting /> },
      { path: 'campaigns/:slug', element: <CampaignDetail /> },
      { path: 'my-coupons', element: <MyCoupons /> },
      { path: 'favorites', element: <Favorites /> },
      {
        path: 'lookbooks',
        element: <LookbookList />,
      },
      {
        path: 'lookbooks/:slug',
        element: <LookbookDetail />,
      },
      {
        path: 'user/dashboard',
        element: <Profile />,
      },
      { path: 'orders', element: <Order /> },
      { path: 'reviews/create', element: <Review /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'verify-otp', element: <VerifyOTP /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} element={<AdminLayout />} />,
    children: [
      { index: true, element: <AdminRoute Component={Dashboard} /> },
      { path: 'categories', element: <AdminRoute Component={CatalogManagement} /> },
      { path: 'products', element: <AdminRoute Component={ProductManagement} /> },
      { path: 'orders', element: <AdminRoute Component={OrderManagement} /> },
      { path: 'chats', element: <AdminRoute Component={AdminChatManagement} /> },
      { path: 'customers', element: <AdminRoute Component={UserManagement} /> },
      { path: 'coupons', element: <AdminRoute Component={CouponManagement} /> },
      { path: 'campaigns', element: <AdminRoute Component={CampaignManagement} /> },
      { path: 'banners', element: <AdminRoute Component={BannerManagement} /> },
      { path: 'lookbooks', element: <AdminRoute Component={LookbookManagement} /> },
      { path: 'ab-testing', element: <AdminRoute Component={ABTestingManagement} /> },
      { path: 'pages', element: <AdminRoute Component={PageManagement} /> },
      { path: 'settings', element: <AdminRoute Component={WebsiteSettingsManagement} /> },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
