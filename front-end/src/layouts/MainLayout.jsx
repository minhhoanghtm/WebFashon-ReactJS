import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, X, Heart, Menu, User, Sparkles, BookOpen, Tag, Compass, LogOut } from 'lucide-react';
import { Dropdown } from 'antd';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import { useFavoriteStore } from '../store/favorite.store';
import Footer from '../components/Footer';
import CustomerChatWidget from '../components/CustomerChatWidget';
import ScrollToTop from '../components/ScrollToTop';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';

const MainLayout = () => {
  const { settings, loading } = useWebsiteSettings();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { items } = useCartStore();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const [searchParams] = useSearchParams();
  const [homeSearchTerm, setHomeSearchTerm] = useState(() => searchParams.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  useEffect(() => {
    setHomeSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const cartCount = items.reduce((total, item) => total + (item.quantity || 0), 0);
  const favoriteCount = favoriteItems.length;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (homeSearchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(homeSearchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const brandName = (!loading && settings?.general?.siteName) ? settings.general.siteName : '404 STUDIO';
  const logoUrl = (!loading && settings?.general?.logoUrl) ? settings.general.logoUrl : null;

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Lookbook', path: '/lookbooks' },
    { name: 'Ưu đãi Voucher', path: '/vouchers' },
    { name: 'Về chúng tôi', path: '/about' },
  ];

  const userRole = user?.role || user?.data?.role || '';
  const displayName = user?.fullName || user?.data?.fullName || user?.name || user?.username || 'Tài khoản';

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link to="/profile">Hồ sơ cá nhân</Link>,
    },
    {
      key: 'orders',
      label: <Link to="/orders">Đơn hàng của tôi</Link>,
    },
    ...(userRole === 'admin'
      ? [
          {
            key: 'admin',
            label: <Link to="/admin">Trang quản trị (Admin)</Link>,
          },
        ]
      : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <span onClick={handleLogout} className="flex items-center gap-2">
          <LogOut size={14} />
          Đăng xuất
        </span>
      ),
    },
  ];

  return (
    <div className="storefront-shell flex min-h-screen flex-col bg-[var(--wf-paper)] text-[var(--wf-ink)] font-sans selection:bg-amber-100 selection:text-amber-900">
      <ScrollToTop />

      {/* Top Banner Ticker */}
      <div className="bg-[#18181B] text-[#E4E4E7] text-[11px] font-medium tracking-widest uppercase py-2 px-4 text-center select-none flex items-center justify-center gap-2">
        <Sparkles size={12} className="text-amber-400" />
        <span>Giao hàng miễn phí toàn quốc cho đơn hàng từ 500.000₫ · Hỗ trợ đổi trả trong 7 ngày</span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          {/* Left: Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-neutral-800 hover:bg-neutral-100 transition-colors"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={22} />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : null}
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black tracking-tight text-neutral-900 font-heading">
                  {brandName}
                </span>
                <span className="text-[9px] font-bold tracking-[0.25em] text-amber-700 uppercase -mt-1">
                  Fashion store
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[13px] font-semibold tracking-wide transition-colors py-1 relative ${
                    isActive
                      ? 'text-neutral-950 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-950'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search, Favorite, Cart & Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search Input */}
            <form
              className="relative hidden md:flex items-center w-52 lg:w-64"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 text-neutral-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={homeSearchTerm}
                onChange={(e) => setHomeSearchTerm(e.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
                className="h-9 w-full rounded-full border border-neutral-200/80 bg-neutral-100/70 py-1.5 pl-9 pr-8 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200/50"
              />
              {homeSearchTerm && (
                <button
                  type="button"
                  onClick={() => setHomeSearchTerm('')}
                  className="absolute right-2.5 rounded-full p-0.5 text-neutral-400 hover:text-neutral-700"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Favorite Button */}
            <Link
              to="/favorites"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              aria-label="Danh sách yêu thích"
            >
              <Heart size={20} />
              {favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#18181B] text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Auth / Profile */}
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <button
                  type="button"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 transition-colors cursor-pointer border border-neutral-200/60"
                >
                  <div className="w-6 h-6 rounded-full bg-[#18181B] text-white flex items-center justify-center text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-neutral-800 max-w-[100px] truncate">
                    {displayName}
                  </span>
                </button>
              </Dropdown>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all shadow-sm active:scale-95"
              >
                <User size={13} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="px-4 pb-3 md:hidden">
          <form
            className="relative flex items-center w-full"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={homeSearchTerm}
              onChange={(e) => setHomeSearchTerm(e.target.value)}
              placeholder="Tìm kiếm trang phục, phụ kiện..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-10 w-full rounded-full border border-neutral-200/80 bg-neutral-100/80 py-2 pl-9 pr-9 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white"
            />
            {homeSearchTerm && (
              <button
                type="button"
                onClick={() => setHomeSearchTerm('')}
                className="absolute right-3 rounded-full p-1 text-neutral-400 hover:text-neutral-700"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-neutral-900 tracking-tight">{brandName}</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-amber-700 uppercase">Fashion store</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
                  aria-label="Đóng menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition"
                  >
                    <span>{link.name}</span>
                    <span className="text-neutral-300 text-xs">&rarr;</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-neutral-100 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-xs font-medium text-neutral-500 px-3">
                    Xin chào, <strong className="text-neutral-900">{displayName}</strong>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 rounded-xl"
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 rounded-xl"
                  >
                    Đơn hàng của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-3 rounded-xl bg-[#18181B] text-white text-sm font-bold shadow-md hover:bg-neutral-800 transition"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet context={{ homeSearchTerm }} />
      </main>

      {/* Footer */}
      <Footer />
      {(!user || (user?.role !== "admin" && user?.data?.role !== "admin")) && <CustomerChatWidget />}
    </div>
  );
};

export default MainLayout;

