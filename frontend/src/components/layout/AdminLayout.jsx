import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  Ticket,
  Flame,
  Image,
  BookOpen,
  MessageSquare,
  Activity,
  Split,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

const ADMIN_NAV = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Sản Phẩm", icon: Package },
  { path: "/admin/categories", label: "Danh Mục", icon: Layers },
  { path: "/admin/orders", label: "Đơn Hàng", icon: ShoppingCart },
  { path: "/admin/customers", label: "Khách Hàng", icon: Users },
  { path: "/admin/coupons", label: "Mã Giảm Giá", icon: Ticket },
  { path: "/admin/campaigns", label: "Chiến Dịch", icon: Flame },
  { path: "/admin/banners", label: "Banners", icon: Image },
  { path: "/admin/lookbooks", label: "Lookbooks", icon: BookOpen },
  { path: "/admin/chats", label: "Tin Nhắn CSKH", icon: MessageSquare },
  { path: "/admin/user-activity", label: "Giám Sát Hành Vi", icon: Activity },
  { path: "/admin/ab-testing", label: "Thử Nghiệm A/B", icon: Split },
  { path: "/admin/pages", label: "Trang Tĩnh", icon: FileText },
  { path: "/admin/settings", label: "Cài Đặt Hệ Thống", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#0c0c0e] text-[#f4f0e8] overflow-x-clip">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#121215] border-r border-[rgba(244,240,232,0.1)] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Close for Mobile */}
          <div className="h-18 px-6 flex items-center justify-between border-b border-[rgba(244,240,232,0.1)]">
            <Link to="/admin" className="flex items-center gap-2 font-display text-sm font-bold tracking-widest text-[#f4f0e8]">
              <span className="w-2.5 h-2.5 bg-[#e65100]" />
              <span>ATELIER CONSOLE</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-[#9a989f] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium tracking-wide transition-colors ${
                    isActive
                      ? "bg-[#e65100] text-white font-semibold"
                      : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer in Sidebar */}
        <div className="p-4 border-t border-[rgba(244,240,232,0.1)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#f4f0e8] truncate max-w-[140px]">
              {user?.fullName || "Quản Trị Viên"}
            </span>
            <span className="text-[10px] font-mono text-[#9a989f] uppercase tracking-wider">
              {user?.role || "ADMIN"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-400 hover:text-red-300 transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Admin Content Region */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#121215]/95 backdrop-blur-md border-b border-[rgba(244,240,232,0.1)] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-[#f4f0e8] border border-[rgba(244,240,232,0.15)]"
            >
              <Menu size={18} />
            </button>
            <div className="text-xs font-mono text-[#9a989f]">
              MÔI TRƯỜNG: <span className="text-emerald-400 font-bold">LIVE STAGING</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-[#9a989f] hover:text-[#f4f0e8] transition-colors"
            >
              <span>Xem Cửa Hàng</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
