import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Package,
  Ticket,
} from "lucide-react";
import { toast } from "react-toastify";
import trackingService from "@/services/tracking.service";
import trackingApi from "@/api/trackingApi";
import { suggestProductsService } from "@/services/product.service";
import { getCartService } from "@/services/cart.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useFavoriteStore } from "@/store/favorite.store";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { formatCurrency } from "@/utils/format";

const NAV_LINKS = [
  { name: "Trang chủ", path: "/" },
  { name: "Bộ sưu tập", path: "/products" },
  { name: "Lookbook", path: "/lookbooks" },
  { name: "Ưu đãi", path: "/vouchers" },
  { name: "Về Atelier", path: "/about" },
];

const Header = ({ searchTerm, onSearchTermChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, loading: settingsLoading } = useWebsiteSettings();
  const { isAuthenticated, user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const favoriteItems = useFavoriteStore((state) => state.items);
  const { isScrolled, scrollDirection } = useScrollDirection({ threshold: 16 });

  const [internalKeyword, setInternalKeyword] = useState("");
  const keyword = searchTerm !== undefined ? searchTerm : internalKeyword;
  const setKeyword = (val) => {
    if (onSearchTermChange) onSearchTermChange(val);
    setInternalKeyword(val);
  };

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [apiCartCount, setApiCartCount] = useState(0);
  const [cartPulse, setCartPulse] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("webfashion_theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const searchWrapperRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartButtonRef = useRef(null);

  const brandName =
    !settingsLoading && settings?.general?.siteName
      ? settings.general.siteName
      : "WEBFASHION";
  const logoUrl =
    !settingsLoading && settings?.general?.logoUrl
      ? settings.general.logoUrl
      : null;

  const userRole = user?.role || user?.data?.role || "";
  const displayName =
    user?.fullName ||
    user?.data?.fullName ||
    user?.name ||
    user?.username ||
    "Khách hàng";

  const storeCartCount = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    : 0;
  const totalCartCount = storeCartCount > 0 ? storeCartCount : apiCartCount;
  const favoriteCount = Array.isArray(favoriteItems) ? favoriteItems.length : 0;

  const isHeaderHidden =
    isScrolled && scrollDirection === "down" && !mobileMenuOpen && !userMenuOpen;

  // Apply Dark Mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("webfashion_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("webfashion_theme", "light");
    }
  }, [isDark]);

  // Fetch initial cart count from API when authenticated
  useEffect(() => {
    let mounted = true;
    const fetchCartCount = async () => {
      await Promise.resolve();
      if (!isAuthenticated) {
        if (mounted) setApiCartCount(0);
        return;
      }
      try {
        const res = await getCartService();
        const items = res?.items || res?.data?.items || [];
        if (mounted && Array.isArray(items)) {
          const sum = items.reduce(
            (acc, item) => acc + (Number(item.quantity) || 1),
            0
          );
          setApiCartCount(sum);
        }
      } catch {
        // Silent fallback to store count
      }
    };
    fetchCartCount();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, location.pathname]);

  // Listen to custom "flyToCart" & "cartUpdated" events
  useEffect(() => {
    const handleFlyToCart = () => {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    };
    window.addEventListener("flyToCart", handleFlyToCart);
    window.addEventListener("cartUpdated", handleFlyToCart);
    return () => {
      window.removeEventListener("flyToCart", handleFlyToCart);
      window.removeEventListener("cartUpdated", handleFlyToCart);
    };
  }, []);

  // Debounced product search suggestions + tracking
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        setSuggestions([]);
        return;
      }
      trackingService.trackSearchDebounced(trimmed, 800);
      try {
        const res = await suggestProductsService(trimmed);
        const list = Array.isArray(res) ? res : res?.data ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setSuggestions(list.slice(0, 6));
          setShowSuggest(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Load user search history on focus
  const loadSearchHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await trackingApi.getSearchHistory();
      if (res?.data && Array.isArray(res.data)) {
        setSearchHistory(res.data.slice(0, 5));
      }
    } catch {
      // ignore
    }
  };

  const handleClearHistory = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await trackingApi.clearSearchHistory();
      setSearchHistory([]);
    } catch {
      // ignore
    }
  };

  // Close popovers on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setShowSuggest(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowSuggest(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    setShowSuggest(false);
    setMobileMenuOpen(false);
    if (trimmed) {
      trackingService.trackSearchImmediate(trimmed);
      navigate(`/products?search=${encodeURIComponent(trimmed)}&page=1`);
    } else {
      navigate("/products");
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.success("Đã đăng xuất khỏi tài khoản.");
    navigate("/login");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-transform duration-300 ${
          isHeaderHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Top Micro Editorial Bar */}
        <div className="border-b border-border/60 bg-secondary/60 px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <span>Monochrome Luxury Atelier · Việt Nam</span>
            <span className="hidden sm:inline">
              Miễn phí giao hàng toàn quốc cho đơn từ 1.000.000₫
            </span>
          </div>
        </div>

        {/* Main Navigation Row */}
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          {/* Left: Mobile Menu Button + Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="touch-target inline-flex items-center justify-center border border-transparent text-foreground transition-colors hover:bg-secondary lg:hidden"
              aria-label="Mở danh mục điều hướng"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>

            <Link
              to="/"
              onClick={() => {
                setKeyword("");
                setMobileMenuOpen(false);
              }}
              className="group flex items-center gap-3 py-1"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-semibold tracking-[0.14em] uppercase text-foreground sm:text-[26px]">
                  {brandName}
                </span>
                <span className="-mt-1 text-[9px] font-medium tracking-[0.32em] uppercase text-muted-foreground">
                  Atelier Edition
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Architectural Nav */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex lg:items-center lg:gap-8"
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-xs font-medium tracking-[0.16em] uppercase transition-colors ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[1.5px] bg-foreground"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search, Theme Toggle, Favorites, Cart, User */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Search with Live Suggestions */}
            <div ref={searchWrapperRef} className="relative hidden md:block">
              <form
                role="search"
                onSubmit={handleSearchSubmit}
                className="relative flex items-center"
              >
                <Search
                  size={15}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute left-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={keyword}
                  onFocus={() => {
                    setShowSuggest(true);
                    loadSearchHistory();
                  }}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm thiết kế..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-11 w-48 border border-border bg-secondary/50 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:w-64 focus:border-foreground focus:bg-card focus:outline-none lg:w-56 lg:focus:w-72"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setSuggestions([]);
                    }}
                    className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Xóa từ khóa"
                  >
                    <X size={13} />
                  </button>
                )}
              </form>

              {/* Suggestions & Search History Popover */}
              {showSuggest &&
                (suggestions.length > 0 ||
                  (!keyword.trim() && searchHistory.length > 0)) && (
                  <div className="absolute right-0 mt-1.5 w-80 border border-border bg-card p-3 shadow-xl">
                    {!keyword.trim() && searchHistory.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5 text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
                          <span>Tìm kiếm gần đây</span>
                          <button
                            type="button"
                            onClick={handleClearHistory}
                            className="hover:text-foreground"
                          >
                            Xóa lịch sử
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {searchHistory.map((item, idx) => {
                            const queryText =
                              typeof item === "string"
                                ? item
                                : item?.keyword || item?.query || "";
                            if (!queryText) return null;
                            return (
                              <li key={idx}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setKeyword(queryText);
                                    setShowSuggest(false);
                                    trackingService.trackSearchImmediate(queryText);
                                    navigate(
                                      `/products?search=${encodeURIComponent(
                                        queryText
                                      )}&page=1`
                                    );
                                  }}
                                  className="flex w-full items-center gap-2.5 px-2 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                                >
                                  <Clock
                                    size={13}
                                    className="text-muted-foreground"
                                  />
                                  <span className="truncate">{queryText}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {suggestions.length > 0 && (
                      <div>
                        <div className="mb-2 border-b border-border pb-1.5 text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground">
                          Gợi ý sản phẩm
                        </div>
                        <ul className="divide-y divide-border/60">
                          {suggestions.map((prod) => {
                            const pid = prod._id || prod.id;
                            const slug = prod.slug;
                            const thumb =
                              prod.displayProduct?.[0] ||
                              prod.image ||
                              prod.images?.[0] ||
                              "";
                            const price = prod.price ?? prod.new_price ?? 0;
                            return (
                              <li key={pid || slug}>
                                <Link
                                  to={slug ? `/product/${slug}` : "/products"}
                                  onClick={() => setShowSuggest(false)}
                                  className="flex items-center gap-3 py-2 transition-colors hover:bg-secondary/60"
                                >
                                  <div className="h-11 w-9 shrink-0 overflow-hidden bg-secondary">
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={prod.name || "Sản phẩm"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-foreground">
                                      {prod.name}
                                    </p>
                                    {price > 0 && (
                                      <p className="text-[11px] text-muted-foreground">
                                        {formatCurrency(price)}
                                      </p>
                                    )}
                                  </div>
                                  <ArrowUpRight
                                    size={14}
                                    className="shrink-0 text-muted-foreground"
                                  />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="touch-target inline-flex items-center justify-center text-foreground transition-colors hover:bg-secondary"
              aria-label={
                isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
              }
              title={isDark ? "Chế độ sáng" : "Chế độ tối"}
            >
              {isDark ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </button>

            {/* Favorites Link */}
            <Link
              to="/favorites"
              className="touch-target relative inline-flex items-center justify-center text-foreground transition-colors hover:bg-secondary"
              aria-label={`Danh sách yêu thích (${favoriteCount} sản phẩm)`}
            >
              <Heart size={19} strokeWidth={1.5} />
              {favoriteCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Link */}
            <Link
              ref={cartButtonRef}
              to="/cart"
              className={`touch-target relative inline-flex items-center justify-center text-foreground transition-transform hover:bg-secondary ${
                cartPulse ? "scale-110" : "scale-100"
              }`}
              aria-label={`Giỏ hàng (${totalCartCount} sản phẩm)`}
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {totalCartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {totalCartCount}
                </span>
              )}
            </Link>

            {/* User Account Menu (Pure Tailwind, Zero Ant Design) */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="touch-target inline-flex items-center gap-2 border border-border bg-secondary/60 px-3 text-xs font-medium text-foreground transition-colors hover:border-foreground"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Tài khoản cá nhân"
                >
                  <span className="flex h-6 w-6 items-center justify-center bg-primary text-[11px] font-semibold text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[110px] truncate sm:inline-block">
                    {displayName}
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 w-56 border border-border bg-card py-2 shadow-xl"
                  >
                    <div className="border-b border-border px-4 py-2.5">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {displayName}
                      </p>
                      <p className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                        {userRole === "admin" ? "Quản trị viên Atelier" : "Thành viên Atelier"}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                      >
                        <User size={14} strokeWidth={1.5} />
                        <span>Hồ sơ cá nhân</span>
                      </Link>
                      <Link
                        to="/orders"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                      >
                        <Package size={14} strokeWidth={1.5} />
                        <span>Đơn hàng của tôi</span>
                      </Link>
                      <Link
                        to="/my-coupons"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-foreground transition-colors hover:bg-secondary"
                      >
                        <Ticket size={14} strokeWidth={1.5} />
                        <span>Ví Voucher</span>
                      </Link>
                      {userRole === "admin" && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 border-t border-border/60 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          <ShieldCheck size={14} strokeWidth={1.5} />
                          <span>Quản trị hệ thống (Admin)</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs text-destructive transition-colors hover:bg-secondary"
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="touch-target inline-flex items-center gap-2 bg-primary px-4 text-xs font-medium tracking-[0.14em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
              >
                <User size={14} strokeWidth={1.5} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="border-t border-border/60 px-4 py-2 md:hidden">
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="relative flex items-center"
          >
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm trang phục, bộ sưu tập..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-11 w-full border border-border bg-secondary/50 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:bg-card focus:outline-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="touch-target absolute right-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Mobile Art-Directed Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 left-0 z-10 flex w-full max-w-xs flex-col justify-between border-r border-border bg-background p-6 shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="font-serif text-xl font-semibold tracking-[0.14em] uppercase text-foreground">
                    {brandName}
                  </span>
                  <p className="text-[9px] tracking-[0.28em] uppercase text-muted-foreground">
                    Monochrome Atelier
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="touch-target inline-flex items-center justify-center text-foreground hover:bg-secondary"
                  aria-label="Đóng menu"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col divide-y divide-border/60">
                {NAV_LINKS.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`touch-target flex items-center justify-between py-3.5 text-xs tracking-[0.16em] uppercase transition-colors ${
                        isActive
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{link.name}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Account & Theme Controls */}
            <div className="space-y-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="touch-target flex w-full items-center justify-between border border-border px-4 text-xs tracking-[0.12em] uppercase text-foreground hover:bg-secondary"
              >
                <span>Giao diện: {isDark ? "Tối (Noir)" : "Sáng (Bone)"}</span>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-1 text-xs text-muted-foreground">
                    Xin chào,{" "}
                    <strong className="font-medium text-foreground">
                      {displayName}
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="touch-target flex items-center justify-center border border-border text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="touch-target flex items-center justify-center border border-border text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      Đơn hàng
                    </Link>
                  </div>
                  {userRole === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="touch-target flex w-full items-center justify-center border border-border text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      Quản trị Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="touch-target flex w-full items-center justify-center border border-destructive/40 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="touch-target flex w-full items-center justify-center bg-primary text-xs font-medium tracking-[0.16em] uppercase text-primary-foreground"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
