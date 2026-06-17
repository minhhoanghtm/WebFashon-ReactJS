import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

/**
 * ProtectedRoute component để bảo vệ các trang yêu cầu quyền truy cập
 * @param {React.Component} element - Component cần bảo vệ
 * @param {boolean} isPublic - Có phải trang công khai không (mặc định: false)
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập
 * @returns {React.Component}
 */
const ProtectedRoute = ({ element, isPublic = false, allowedRoles = [] }) => {
  const { isAuthenticated: isLoggedIn, user, isLoading } = useAuthStore();
  const userRole = user?.role || user?.data?.role || "";

  // Trang công khai - cho phép truy cập khi chưa đăng nhập
  if (isPublic) {
    return element;
  }

  // Đang tải/xác thực phiên đăng nhập
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-xs text-slate-400 font-semibold tracking-wider uppercase">Đang đồng bộ phiên đăng nhập...</p>
      </div>
    );
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
