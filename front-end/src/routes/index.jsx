import Home from "../pages/Home";
import AdminUserManagement from "../pages/AdminUserManagement";
import StaffProductManagement from "../pages/StaffProductManagement";
import UserAccountManagement from "../pages/UserAccountManagement";
import ProductDetail from "../pages/ProductDetail";
import ProductSearch from "../pages/ProductSearch";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";
import DashboardUser from "@/pages/DashboardUser/DashboardUser";
import DashboardAdmin from "@/pages/DashboardAdmin/DashboardAdmin";
import Checkout from "@/pages/Checkout";
import Cart from "@/pages/Cart";

export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "user/dashboard",
    element: <DashboardUser />,
  },
  {
    path: "admin/dashboard",
    element: <DashboardAdmin />,
  },
  {
    path: "/login",
    element: <Login />,
    layout: false,
  },
  {
    path: "/register",
    element: <Register />,
    layout: false,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    layout: false,
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />,
    layout: false,
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />,
    layout: false,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    layout: false,
  },
  {
    path: "/admin/accounts",
    element: <AdminUserManagement />,
  },
  {
    path: "/account/profile",
    element: <UserAccountManagement />,
  },
  {
    path: "/orders",
    element: <UserAccountManagement />,
  },
  {
    path: "/staff/products",
    element: <StaffProductManagement />,
  },
  {
    path: "/products",
    element: <ProductSearch />,
  },
  {
    path: "/products/:id",
    element: <ProductDetail />,
  },
  {
    path: "/checkout",
    element: <Checkout />,
  },
  {
    path: "/cart",
    element: <Cart />,
  },
];
