import Home from "../pages/Home";
import AdminUserManagement from "../pages/AdminUserManagement";
import ProductDetail from "../pages/ProductDetail";
import ProductSearch from "../pages/ProductSearch";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";
import DashboardUser from "@/pages/DashboardUser/DashboardUser";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Checkout from "@/pages/Checkout";
import Cart from "@/pages/Cart";
import Order from "@/pages/Order";
import Error from "@/pages/Error";
import Review from "@/pages/Review";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * Phân quyền truy cập:
 * - admin: Quản trị viên - có quyền truy cập tất cả
 * - staff: Nhân viên - có quyền quản lý sản phẩm
 * - user: Khách hàng - có quyền xem đơn hàng, tài khoản cá nhân
 */
export const routes = [
  // ==================== TRANG CÔNG KHAI ====================
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/products",
    element: <ProductSearch />,
  },
  {
    path: "/product/:slug",
    element: <ProductDetail />,
  },

  // ==================== AUTHENTICATION ====================
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
    path: "/verify-otp",
    element: <VerifyOTP />,
    layout: false,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    layout: false,
  },

  // ==================== ADMIN ====================
  {
    path: "/admin/accounts",
    element: (
      <ProtectedRoute
        element={<AdminUserManagement />}
        allowedRoles={["admin"]}
      />
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute
        element={<Dashboard />}
        allowedRoles={["admin", "staff"]} // Cả admin và staff đều có thể xem dashboard admin
      />
    ),
  },

 

  // ==================== USER ====================
  
  {
    path: "/orders",
    element: (
      <ProtectedRoute
        element={<Order />}
        allowedRoles={["user"]}
      />
    ),
  },
  {
    path: "/user/dashboard",
    element: (
      <ProtectedRoute
        element={<DashboardUser />}
        allowedRoles={["user"]}
      />
    ),
  },

  // ==================== CHECKOUT & CART ====================
  {
    path: "/checkout",
    element: (
      <ProtectedRoute
        element={<Checkout />}
        allowedRoles={["user"]}
      />
    ),
  },
  {
    path: "/cart",
    element: (
      <ProtectedRoute
        element={<Cart />}
        allowedRoles={["user"]}
      />
    ),
  },

  // ==================== REVIEW ====================
  {
    path: "/reviews/create",
    element: (
      <ProtectedRoute
        element={<Review />}
        allowedRoles={["user"]}
      />
    ),
  },

  // ==================== 404 ====================
  {
    path: "*",
    element: <Error />,
    layout: false,
  }
];
