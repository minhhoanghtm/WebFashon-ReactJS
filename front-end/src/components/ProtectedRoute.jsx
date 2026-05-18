import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute component để bảo vệ các trang yêu cầu quyền truy cập
 * @param {React.Component} element - Component cần bảo vệ
 * @param {boolean} isPublic - Có phải trang công khai không (mặc định: false)
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập
 * @returns {React.Component}
 */
const ProtectedRoute = ({ element, isPublic = false, allowedRoles = [] }) => {
  const { isLoggedIn, user } = useAuth();
  const userRole = user?.data?.role;

  // Trang công khai - cho phép truy cập khi chưa đăng nhập
  if (isPublic) {
    return element;
  }

  // Chưa đăng nhập - redirect tới login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Có danh sách role được phép - kiểm tra quyền
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
