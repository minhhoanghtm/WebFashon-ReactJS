import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutList,
  Package,
  ShoppingCart,
  MessageCircle,
  Users,
  Tag,
  Zap,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Settings,
  X,
  Store,
  FlaskConical,
} from 'lucide-react';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';

const navGroups = [
  {
    title: 'Kinh doanh',
    items: [
      { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
      { icon: LayoutList, label: 'Danh mục', path: '/admin/categories' },
      { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
      { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
    ],
  },
  {
    title: 'Khách hàng & Hỗ trợ',
    items: [
      { icon: MessageCircle, label: 'Chat hỗ trợ', path: '/admin/chats', isChat: true },
      { icon: Users, label: 'Người dùng', path: '/admin/customers' },
    ],
  },
  {
    title: 'Marketing & Ưu đãi',
    items: [
      { icon: Tag, label: 'Khuyến mãi (Voucher)', path: '/admin/coupons' },
      { icon: Zap, label: 'Chiến dịch Sale', path: '/admin/campaigns' },
      { icon: FlaskConical, label: 'A/B Testing AI', path: '/admin/ab-testing' },
      { icon: ImageIcon, label: 'Quản lý Banner', path: '/admin/banners' },
    ],
  },
  {
    title: 'Nội dung & Hệ thống',
    items: [
      { icon: BookOpen, label: 'Quản lý Lookbook', path: '/admin/lookbooks' },
      { icon: FileText, label: 'Trang CMS', path: '/admin/pages' },
      { icon: Settings, label: 'Cài đặt hệ thống', path: '/admin/settings' },
    ],
  },
];

export const Sidebar = ({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  unreadCount = 0,
}) => {
  const { pathname } = useLocation();
  const { settings } = useWebsiteSettings();
  const general = settings?.general || {};
  const siteName = general?.siteName || '404Studio';
  const logoUrl = general?.logoUrl || '';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all duration-200 ease-in-out md:static
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header / Brand Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80">
          <Link
            to="/admin"
            className="flex items-center gap-3 overflow-hidden text-left"
            onClick={onCloseMobile}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-8 w-8 object-contain rounded-lg"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#05251C] text-[#F5DD20] font-black font-display text-xs shadow-xs">
                404
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white truncate font-display">
                  {siteName}
                </span>
                <span className="text-[10px] font-bold text-[#05251C] dark:text-[#F5DD20] uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>

          {/* Close button for Mobile Drawer */}
          <button
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {group.title}
                </h4>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }
                    `}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#05251C] dark:bg-[#F5DD20]" />
                    )}

                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-[#05251C] dark:text-[#F5DD20]'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`}
                    />

                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {/* Unread badge for Chats */}
                    {item.isChat && unreadCount > 0 && (
                      <span
                        className={`ml-auto flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-2xs ${
                          collapsed
                            ? 'absolute top-1.5 right-1.5 h-2 w-2'
                            : 'h-4.5 min-w-[18px] px-1'
                        }`}
                      >
                        {!collapsed && (unreadCount > 99 ? '99+' : unreadCount)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: Quick Storefront link */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Xem cửa hàng thời trang"
            className={`flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              collapsed ? 'justify-center p-2' : ''
            }`}
          >
            <Store className="h-4 w-4 text-[#05251C] dark:text-[#F5DD20] shrink-0" />
            {!collapsed && <span className="truncate">Cửa hàng trực tuyến ↗</span>}
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
