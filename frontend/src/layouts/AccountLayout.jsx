import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { SilkVeilTransition } from "../components/shared/SilkVeilTransition";
import { useAuthStore } from "../stores/authStore";
import {
  LayoutDashboard,
  Package,
  User,
  Ticket,
  Heart,
  Shield,
  Star,
  LogOut,
  Crown,
  ChevronRight,
} from "lucide-react";

export function AccountLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    { path: "/user/dashboard", label: "Tổng Quan Hội Viên", icon: LayoutDashboard },
    { path: "/orders", label: "Đơn Hàng Của Tôi", icon: Package },
    { path: "/profile", label: "Hồ Sơ & Địa Chỉ", icon: User },
    { path: "/my-coupons", label: "Ví Voucher Độc Quyền", icon: Ticket },
    { path: "/favorites", label: "Danh Sách Yêu Thích", icon: Heart },
    { path: "/reviews/create", label: "Đánh Giá Thiết Kế", icon: Star },
    { path: "/profile/data-requests", label: "Quyền Riêng Tư GDPR", icon: Shield },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip" data-template="account-workspace">
      <Header />

      {/* Member VIP Hero Header */}
      <section className="bg-[#121215] border-b border-[rgba(244,240,232,0.1)] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#e65100] overflow-hidden bg-[#161619] flex items-center justify-center text-lg font-bold">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.fullName ? user.fullName[0] : "A"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold tracking-wider text-[#f4f0e8]">
                  {user?.fullName || "Quý Khách Hàng"}
                </h1>
                <span className="px-2 py-0.5 bg-[#e65100]/20 border border-[#e65100]/40 text-[#ff6d00] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 font-bold">
                  <Crown size={11} /> VIP DIAMOND
                </span>
              </div>
              <p className="text-xs text-[#9a989f] font-mono mt-0.5">
                {user?.email || "member@atelier-archive.vn"} • THÀNH VIÊN ĐẶC QUYỀN ATELIER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 bg-[#161619] border border-white/10 text-right">
              <span className="text-[#9a989f] block text-[10px]">ĐIỂM TÍCH LŨY</span>
              <span className="text-[#ff6d00] font-bold text-sm">2,450 PTS</span>
            </div>
            <div className="px-3 py-1.5 bg-[#161619] border border-white/10 text-right">
              <span className="text-[#9a989f] block text-[10px]">HẠNG ĐẶC QUYỀN</span>
              <span className="text-emerald-400 font-bold text-sm">FREESHIP TRỌN ĐỜI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Account Workspace */}
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-1 bg-[#121215] border border-[rgba(244,240,232,0.1)] p-4 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9a989f] px-3 py-2 border-b border-white/5 mb-2">
              Danh Mục Tài Khoản
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-display tracking-wider uppercase transition-colors ${
                    isActive
                      ? "bg-[#e65100] text-white font-bold"
                      : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={12} className={isActive ? "text-white" : "text-[#6b6973]"} />
                </Link>
              );
            })}

            <div className="pt-3 border-t border-white/10 mt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-display tracking-wider uppercase text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={15} />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </aside>

          {/* Account Content Region */}
          <div className="lg:col-span-3 min-w-0">
            <SilkVeilTransition>
              <React.Suspense
                fallback={
                  <div className="min-h-[40vh] flex items-center justify-center p-8 bg-[#121215] border border-white/10">
                    <div className="w-8 h-8 border-2 border-[#e65100] border-t-transparent animate-spin" />
                  </div>
                }
              >
                <Outlet />
              </React.Suspense>
            </SilkVeilTransition>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
export default AccountLayout;
