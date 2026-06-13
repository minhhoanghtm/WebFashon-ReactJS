import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutList,
  Package,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: LayoutList, label: "Quản lý danh mục", path: "/admin/categories" },
  { icon: Package, label: "Quản lý sản phẩm", path: "/admin/products" },
  { icon: ShoppingCart, label: "Quản lý đơn hàng", path: "/admin/orders" },
  { icon: Users, label: "Quản lý người dùng", path: "/admin/customers" },
  { icon: Tag, label: "Khuyến mãi", path: "/admin/coupons" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-gray-200 bg-white text-gray-900
        transition-all duration-300 ease-in-out z-40 shrink-0
        ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 overflow-hidden">
        {collapsed ? (
          <img src={logo} alt="logo" className="h-8 w-8 object-contain" />
        ) : (
          <img
            src={logo}
            alt="WebFashion logo"
            className="h-15 w-auto object-contain"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-2 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined} // tooltip khi collapsed
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition
                ${collapsed ? "justify-center" : ""}
                ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {/* ẩn label khi collapsed */}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Nút toggle — nằm ở cạnh phải, giữa chiều dọc */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center
          rounded-full border border-gray-200 bg-white text-gray-500
          shadow-sm hover:text-indigo-600 transition"
        aria-label={collapsed ? "Mở sidebar" : "Thu sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
