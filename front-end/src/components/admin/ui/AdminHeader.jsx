import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  KeyRound,
  ChevronRight,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "react-toastify";

const routeTitleMap = {
  "/admin": { group: "Tổng quan", title: "Bảng điều khiển" },
  "/admin/products": { group: "Sản phẩm & Kho", title: "Quản lý sản phẩm" },
  "/admin/categories": { group: "Sản phẩm & Kho", title: "Danh mục sản phẩm" },
  "/admin/orders": { group: "Bán hàng & CSKH", title: "Quản lý đơn hàng" },
  "/admin/customers": {
    group: "Bán hàng & CSKH",
    title: "Khách hàng & Tài khoản",
  },
  "/admin/chats": {
    group: "Bán hàng & CSKH",
    title: "Hỗ trợ trực tuyến (Chat)",
  },
  "/admin/coupons": {
    group: "Marketing & Nội dung",
    title: "Mã giảm giá (Voucher)",
  },
  "/admin/campaigns": {
    group: "Marketing & Nội dung",
    title: "Chiến dịch Flash Sale",
  },
  "/admin/banners": {
    group: "Marketing & Nội dung",
    title: "Quản lý Banner",
  },
  "/admin/lookbooks": {
    group: "Marketing & Nội dung",
    title: "Quản lý Lookbook",
  },
  "/admin/ab-testing": {
    group: "Marketing & Nội dung",
    title: "A/B Testing (AI Gợi ý)",
  },
  "/admin/pages": { group: "Cấu hình", title: "Trang nội dung (CMS)" },
  "/admin/settings": { group: "Cấu hình", title: "Cài đặt hệ thống" },
};

export function AdminHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileSidebar,
  theme,
  onToggleTheme,
  onOpenProfileModal,
  onOpenPasswordModal,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentRoute = routeTitleMap[pathname] || {
    group: "Hệ thống",
    title: "Quản trị Atelier",
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("Đã đăng xuất khỏi phiên quản trị.");
    navigate("/login");
  };

  const displayName =
    user?.fullname || user?.fullName || user?.name || "Quản trị viên";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Mở thanh điều hướng quản trị"
          className="touch-target inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
          title={sidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
          className="touch-target hidden items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] lg:inline-flex"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs"
        >
          <Link
            to="/admin"
            className="hidden font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline"
          >
            Admin
          </Link>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-[var(--color-text-muted)] sm:inline"
            aria-hidden="true"
          />
          <span className="hidden text-[var(--color-text-muted)] md:inline">
            {currentRoute.group}
          </span>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-[var(--color-text-muted)] md:inline"
            aria-hidden="true"
          />
          <span className="font-semibold text-[var(--color-text)]">
            {currentRoute.title}
          </span>
        </nav>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Storefront Quick Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target hidden items-center gap-1.5 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] sm:inline-flex"
        >
          <span>Cửa hàng</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark"
              ? "Chuyển sang chế độ sáng"
              : "Chuyển sang chế độ tối"
          }
          title={
            theme === "dark"
              ? "Chuyển sang chế độ sáng"
              : "Chuyển sang chế độ tối"
          }
          className="touch-target inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)]"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>

        {/* Admin User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label="Tài khoản quản trị viên"
            className="touch-target inline-flex items-center gap-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-left transition-colors hover:border-[var(--color-text)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--color-text)] text-xs font-semibold text-[var(--color-bg)]">
              {displayInitial}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="max-w-[120px] truncate text-xs font-semibold text-[var(--color-text)]">
                {displayName}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Admin
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-60 border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-2xl"
            >
              <div className="border-b border-[var(--color-border)] px-4 py-2.5">
                <div className="truncate text-xs font-semibold text-[var(--color-text)]">
                  {displayName}
                </div>
                <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                  {user?.email || "admin@webfashion.vn"}
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenProfileModal?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
                >
                  <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Cập nhật hồ sơ</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenPasswordModal?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
                >
                  <KeyRound className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              <div className="border-t border-[var(--color-border)] pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
