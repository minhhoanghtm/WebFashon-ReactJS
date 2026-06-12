import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutList,
  Package,
  ShoppingCart,
  Tag,
  Users,
  LogOut,
  User,
  Lock,
  ChevronDown,
  X,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "react-toastify";

const navItems = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/admin" },
  { icon: LayoutList, label: "Quản lý danh mục", path: "/admin/categories" },
  { icon: Package, label: "Quản lý sản phẩm", path: "/admin/products" },
  { icon: ShoppingCart, label: "Quản lý đơn hàng", path: "/admin/orders" },
  { icon: Users, label: "Quản lý người dùng", path: "/admin/customers" },
  { icon: Tag, label: "Khuyến mãi", path: "/admin/coupons" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    navigate("/login");
  };

  // Get initials for profile avatar
  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const getUserName = () => {
    return user?.fullName || user?.name || "Tài khoản của tôi";
  };

  return (
    <aside
      className={`relative flex h-screen flex-col border-r transition-all duration-300 ease-in-out z-40
        bg-slate-900 border-slate-800 text-white
        ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Header / Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed ? (
          <span className="text-xl font-bold tracking-wider text-white">ADMIN</span>
        ) : (
          <span className="text-lg font-bold text-blue-500 mx-auto">A</span>
        )}
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition"
          aria-label={collapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition duration-200
                ${collapsed ? "justify-center" : ""}
                ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Dropdown Area */}
      <div className="p-3 border-t border-slate-800 relative" ref={dropdownRef}>
        {/* Dropdown Menu Popup */}
        {dropdownOpen && (
          <div
            className={`absolute bottom-16 left-3 right-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 transition-all duration-200 origin-bottom ${
              collapsed ? "w-48 left-16" : ""
            }`}
          >
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>Cập nhật thông tin</span>
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/profile"); // Assuming change password is in profile
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Đổi mật khẩu</span>
            </button>
            <div className="border-t border-slate-700 my-1"></div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        {/* User Card */}
        {collapsed ? (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-inner"
          >
            {getInitials()}
          </button>
        ) : (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-inner">
                {getInitials()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-white">
                  {getUserName()}
                </span>
                <span className="text-xs text-slate-400 truncate">Quản trị viên</span>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
