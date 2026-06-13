import React from 'react';
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
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Profile from '../pages/profile';
import Order from '../pages/Order';
import Review from '../pages/Review';
import NotFound from '../pages/not-found';
import VoucherHunting from '../pages/VoucherHunting';
import MyCoupons from '../pages/MyCoupons';
import CatalogManagement from '@/pages/admin/CatalogManagement';
import ProductManagement from '@/pages/admin/ProductManagement';
import OrderManagement from '@/pages/admin/OrderManagement';
import UserManagement from '@/pages/admin/UserManagement';
import CouponManagement from '@/pages/admin/CouponManagement';
import Dashboard from '@/pages/admin/Dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'products', element: <ProductSearch /> },
      { path: 'product/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'profile', element: <Profile /> },
      { path: 'vouchers', element: <VoucherHunting /> },
      { path: 'my-coupons', element: <MyCoupons /> },
      {
        path: 'user/dashboard',
        element: (
          <div className="p-6 bg-white rounded-xl border border-gray-200">
            User dashboard is being rebuilt.
          </div>
        ),
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
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'categories', element: <CatalogManagement /> },
      { path: 'products', element: <ProductManagement /> },
      { path: 'orders', element: <OrderManagement /> },
      { path: 'customers', element: <UserManagement /> },
      { path: 'coupons', element: <CouponManagement /> },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
