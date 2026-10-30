import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  ExternalLink,
  Bell,
  MessageCircle,
  User,
  Key,
  LogOut,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';

const routeNames = {
  '/admin': 'Tổng quan',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/products': 'Quản lý sản phẩm',
  '/admin/orders': 'Quản lý đơn hàng',
  '/admin/chats': 'Chat hỗ trợ',
  '/admin/customers': 'Quản lý người dùng',
  '/admin/coupons': 'Khuyến mãi (Voucher)',
  '/admin/campaigns': 'Chiến dịch Sale',
  '/admin/banners': 'Quản lý Banner',
  '/admin/lookbooks': 'Quản lý Lookbook',
  '/admin/pages': 'Quản lý trang CMS',
  '/admin/settings': 'Cài đặt hệ thống',
};

export const AdminHeader = ({
  onToggleSidebar,
  onToggleMobileSidebar,
  collapsed,
  unreadChatsCount = 0,
  theme,
  onToggleTheme,
  onOpenProfileModal,
  onOpenPasswordModal,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const currentRouteName = routeNames[pathname] || 'Quản trị';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const adminName = user?.fullName || user?.name || user?.userName || user?.email || 'Quản trị viên';
  const avatarUrl = user?.avatar_url || user?.avatar || '';
  const firstLetter = adminName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left: Mobile trigger, Desktop toggle, Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Mở menu quản trị"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Breadcrumb / Page Context */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link
            to="/admin"
            className="hover:text-[#05251C] dark:hover:text-[#F5DD20] transition-colors"
          >
            Admin
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {currentRouteName}
          </span>
        </div>
      </div>

      {/* Right Actions: View Store, Chat alerts, Theme switch, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View Storefront */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition"
        >
          <span>Xem cửa hàng</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>

        {/* Chat notification indicator */}
        <Link
          to="/admin/chats"
          aria-label="Tin nhắn hỗ trợ"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Chat hỗ trợ khách hàng"
        >
          <MessageCircle className="h-4.5 w-4.5" />
          {unreadChatsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
            </span>
          )}
        </Link>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Chuyển chế độ giao diện"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-slate-600" />
          )}
        </button>

        {/* User Account Popover */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-label="Tài khoản quản trị"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={adminName}
                className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] border border-[#05251C]/20 dark:border-[#F5DD20]/30 font-bold text-xs">
                {firstLetter}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[120px]">
                {adminName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {adminName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {user?.email || 'admin@404studio.vn'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  <Shield className="h-3 w-3" />
                  <span>{user?.role === 'admin' ? 'Super Admin' : 'Staff'}</span>
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenPasswordModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <Key className="h-4 w-4 text-slate-400" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

              <div className="p-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
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
};

export default AdminHeader;
