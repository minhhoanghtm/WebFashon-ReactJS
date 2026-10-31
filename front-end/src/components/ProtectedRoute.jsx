import React from "react";
import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const ProtectedRoute = ({ element, isPublic = false, allowedRoles = [] }) => {
  const { isAuthenticated: isLoggedIn, user, isLoading } = useAuthStore();
  const userRole = user?.role || user?.data?.role || "";

  if (isPublic) {
    return element;
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 text-foreground"
        aria-busy="true"
        aria-live="polite"
      >
        <LoaderCircle size={28} strokeWidth={1.5} className="animate-spin text-foreground" />
        <p className="mt-4 text-[11px] font-semibold tracking-[0.22em] uppercase text-muted-foreground">
          Đang đồng bộ phiên đăng nhập...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
