import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  ClipboardList,
  Users,
  Ticket,
  Flame,
  Image,
  BookOpen,
  FileText,
  Settings,
  MessageSquare,
  FlaskConical,
  ExternalLink,
  X,
  Award,
} from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const navigationGroups = [
  {
    title: "Tổng quan",
    items: [{ name: "Bảng điều khiển", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Sản phẩm & Kho",
    items: [
      { name: "Sản phẩm", href: "/admin/products", icon: ShoppingBag },
      { name: "Danh mục", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    title: "Bán hàng & CSKH",
    items: [
      { name: "Đơn hàng", href: "/admin/orders", icon: ClipboardList },
      { name: "Khách hàng", href: "/admin/customers", icon: Users },
      {
        name: "Hỗ trợ Chat",
        href: "/admin/chats",
        icon: MessageSquare,
        hasBadge: true,
      },
    ],
  },
  {
    title: "Marketing & Nội dung",
    items: [
      { name: "Mã giảm giá", href: "/admin/coupons", icon: Ticket },
      { name: "Flash Sale", href: "/admin/campaigns", icon: Flame },
      { name: "Banner", href: "/admin/banners", icon: Image },
      { name: "Lookbook", href: "/admin/lookbooks", icon: BookOpen },
      { name: "A/B Testing (AI)", href: "/admin/ab-testing", icon: FlaskConical },
    ],
  },
  {
    title: "Cấu hình",
    items: [
      { name: "Trang tĩnh (CMS)", href: "/admin/pages", icon: FileText },
      { name: "Cài đặt hệ thống", href: "/admin/settings", icon: Settings },
    ],
  },
];

const Sidebar = ({
  isOpen,
  mobileOpen = false,
  onCloseMobile,
  unreadChatCount = 0,
}) => {
  const { settings, loading } = useWebsiteSettings();
  const brandName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : "WEBFASHION";

  const renderSidebarContent = (expanded) => (
    <div className="flex h-full flex-col justify-between bg-[var(--color-surface)] text-[var(--color-text)]">
      {/* Top Brand Identity */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <Link
            to="/admin"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="atelier-seal flex h-9 w-9 shrink-0 items-center justify-center border bg-[var(--color-bg)]">
              <Award className="h-4 w-4" strokeWidth={1.75} />
            </div>
            {expanded && (
              <div className="min-w-0 leading-tight">
                <span className="block truncate font-serif text-lg font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
                  {brandName}
                </span>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>

          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Đóng thanh điều hướng"
              className="touch-target inline-flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          aria-label="Điều hướng quản trị"
          className="max-h-[calc(100vh-8.5rem)] space-y-5 overflow-y-auto px-3 py-5"
        >
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {expanded ? (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  {group.title}
                </div>
              ) : (
                <div
                  className="mx-auto my-2 h-px w-6 bg-[var(--color-border)]"
                  aria-hidden="true"
                />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const showBadge = item.hasBadge && unreadChatCount > 0;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/admin"}
                    onClick={() => onCloseMobile?.()}
                    title={!expanded ? item.name : undefined}
                    className={({ isActive }) =>
                      `touch-target group relative flex items-center gap-3 border px-3 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-[var(--color-text)] bg-[var(--color-text)] font-semibold text-[var(--color-bg)]"
                          : "border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                      } ${!expanded ? "justify-center px-0" : ""}`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />

                    {expanded && (
                      <span className="flex-1 truncate text-left tracking-[0.04em]">
                        {item.name}
                      </span>
                    )}

                    {showBadge &&
                      (expanded ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[var(--color-danger)] px-1.5 text-[10px] font-bold text-white">
                          {unreadChatCount > 99 ? "99+" : unreadChatCount}
                        </span>
                      ) : (
                        <span
                          className="absolute top-2 right-2 h-2 w-2 bg-[var(--color-danger)]"
                          aria-label={`${unreadChatCount} tin nhắn chưa đọc`}
                        />
                      ))}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Storefront Link */}
      <div className="border-t border-[var(--color-border)] p-3">
        <Link
          to="/"
          className={`touch-target flex items-center gap-2.5 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] ${
            !expanded ? "justify-center px-0" : ""
          }`}
          title={!expanded ? "Về trang cửa hàng" : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {expanded && <span className="truncate">Về trang cửa hàng</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Thanh bên quản trị"
        className={`fixed top-0 left-0 z-40 hidden h-screen border-r border-[var(--color-border)] transition-all duration-300 lg:block ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {renderSidebarContent(isOpen)}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng quản trị"
        >
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed top-0 left-0 z-10 h-full w-72 border-r border-[var(--color-border)] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
