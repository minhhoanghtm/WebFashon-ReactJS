import React, { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { ShoppingCart, Search, X, Heart, Menu, User, Sparkles, LogOut } from 'lucide-react';
import { Dropdown } from 'antd';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import { useFavoriteStore } from '../store/favorite.store';
import Footer from '../components/Footer';
import CustomerChatWidget from '../components/CustomerChatWidget';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';
import { useScrollDirection } from '../hooks/useScrollDirection';
import PageTransition from '../components/motion/PageTransition';
import CustomCursor from '../components/motion/CustomCursor';
import WaterRippleOverlay from '../components/motion/WaterRippleOverlay';
import ScrollSectionTransitions from '../components/motion/ScrollSectionTransitions';
import AnnouncementMarquee from '../components/common/AnnouncementMarquee';
import EventWelcomePopup from '../components/common/EventWelcomePopup';
import useTracking from '../hooks/useTracking';

const MotionSpan = motion.span;

const MainLayout = () => {
  useTracking({ autoTrackPageView: true });
  const { settings, loading } = useWebsiteSettings();
  const { isAuthenticated, logout, user } = useAuthStore();
  const { items } = useCartStore();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const [searchParams] = useSearchParams();
  const [homeSearchTerm, setHomeSearchTerm] = useState(() => searchParams.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainContentRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const { isScrolled, scrollDirection } = useScrollDirection({ threshold: 16 });
  const isHeaderHidden = isScrolled && scrollDirection === 'down' && !isMobileMenuOpen;

  const currentOutlet = useOutlet({ homeSearchTerm });

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

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

  const getTransitionType = (pathname) => {
    if (pathname.startsWith('/checkout') || pathname.startsWith('/cart') || pathname.startsWith('/payment-result')) return 'minimal';
    if (pathname.startsWith('/product/')) return 'product-detail';
    if (pathname.startsWith('/lookbook')) return 'editorial';
    return 'default';
  };

  const handleExitComplete = () => {
    if (navType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="storefront-shell flex min-h-screen flex-col bg-[#FBF9F5] text-[#05251C] font-sans selection:bg-[#F5DD20] selection:text-[#05251C]">
      <CustomCursor />
      <WaterRippleOverlay />
      {/* Dynamic 2D Announcement Marquee & Event Welcome Popup */}
      <AnnouncementMarquee />
      <EventWelcomePopup />

      {/* Main Header with Smart Adaptive Scroll Direction & Depth */}
      <header
        className={`storefront-header sticky top-0 z-50 border-b transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isHeaderHidden ? '-translate-y-full shadow-none' : 'translate-y-0'
        } ${
          isScrolled
            ? 'border-[#05251C]/10 bg-white/95 backdrop-blur-md shadow-[0_4px_25px_rgba(5,37,28,0.04)]'
            : 'border-[#05251C]/6 bg-[#FBF9F5]/90 backdrop-blur-sm shadow-none'
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1440px] w-full items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6 lg:px-10 ${
            isScrolled ? 'py-2.5' : 'py-3'
          }`}
        >
          {/* Left: Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-none text-neutral-800 hover:bg-neutral-100 transition-colors"
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
                <span className="text-xl md:text-2xl font-black tracking-tight text-[#05251C] font-display">
                  {brandName}
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.28em] text-[#05251C]/60 uppercase -mt-0.5">
                  Atelier Edition
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links with Animated Underline */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-[11px] font-bold uppercase tracking-[0.1em] transition-colors py-2 relative ${
                    isActive
                      ? 'text-neutral-950 font-bold'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <MotionSpan
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#073D2A] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
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
                className="pointer-events-none absolute left-3.5 text-[#05251C]/40"
                aria-hidden="true"
              />
              <input
                type="text"
                value={homeSearchTerm}
                onChange={(e) => setHomeSearchTerm(e.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
                className="h-9 w-full rounded-none border border-[#05251C]/10 bg-[#F2EFE9] py-1.5 pl-9 pr-8 text-xs font-medium text-[#05251C] placeholder:text-[#05251C]/40 outline-none transition focus:border-[#073D2A] focus:bg-white focus:ring-2 focus:ring-[#073D2A]/15"
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
              className="relative flex items-center justify-center w-9 h-9 rounded-none text-[#05251C] hover:text-[#073D2A] hover:bg-[#F2EFE9] transition-colors"
              aria-label="Danh sách yêu thích"
            >
              <Heart size={20} />
              {favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#073D2A] text-[10px] font-bold text-[#FBF9F5] shadow-xs">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-none text-[#05251C] hover:text-[#073D2A] hover:bg-[#F2EFE9] transition-colors"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#073D2A] text-[10px] font-bold text-[#FBF9F5] shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Auth / Profile */}
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <button
                  type="button"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#F2EFE9] hover:bg-[#E5E0D8] transition-colors cursor-pointer border border-[#05251C]/10"
                >
                  <div className="w-6 h-6 rounded-full bg-[#073D2A] text-[#FBF9F5] flex items-center justify-center text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-[#05251C] max-w-[100px] truncate">
                    {displayName}
                  </span>
                </button>
              </Dropdown>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-none bg-[#073D2A] px-4 py-2 text-xs font-bold text-[#FBF9F5] hover:bg-[#0E5A3E] transition-all shadow-sm active:scale-95"
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
            className="h-10 w-full rounded-none border border-neutral-200/80 bg-neutral-100/80 py-2 pl-9 pr-9 text-xs font-medium text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white"
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
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-[#FBF9F5] shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#05251C]/10">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-[#05251C] tracking-tight">{brandName}</span>
                  <span className="text-[9px] font-extrabold tracking-[0.25em] text-[#05251C]/60 uppercase">Atelier Edition</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#05251C] hover:bg-[#F2EFE9] transition-colors"
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
                    className="flex items-center justify-between px-2 py-3.5 border-b border-[#05251C]/8 text-[12px] font-bold uppercase tracking-[0.1em] text-[#05251C] hover:bg-[#F2EFE9] transition"
                  >
                    <span>{link.name}</span>
                    <span className="text-[#05251C]/40 text-xs">&rarr;</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-[#05251C]/10 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-xs font-medium text-neutral-500 px-3">
                    Xin chào, <strong className="text-[#05251C]">{displayName}</strong>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-[#05251C] hover:bg-[#F2EFE9] rounded-xl"
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-[#05251C] hover:bg-[#F2EFE9] rounded-xl"
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
                  className="flex items-center justify-center w-full py-3 rounded-none bg-[#073D2A] text-[#FBF9F5] text-sm font-bold shadow-md hover:bg-[#0E5A3E] transition"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Route Transitions */}
      <main ref={mainContentRef} className="flex-1 flex flex-col">
        <ScrollSectionTransitions containerRef={mainContentRef} routeKey={location.pathname} />
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={handleExitComplete}
        >
          <PageTransition
            key={location.pathname}
            type={getTransitionType(location.pathname)}
          >
            {currentOutlet}
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
      {(!user || (user?.role !== "admin" && user?.data?.role !== "admin")) && <CustomerChatWidget />}
    </div>
  );
};

export default MainLayout;
