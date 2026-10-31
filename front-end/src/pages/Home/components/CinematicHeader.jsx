import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ArrowUpRight,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Search,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useFavoriteStore } from "@/store/favorite.store";
import { getCartService } from "@/services/cart.service";
import {
  getCartItemsService,
  updateCartItemService,
  deleteCartItemService,
} from "@/services/cartItem.service";
import { suggestProductsService } from "@/services/product.service";
import trackingService from "@/services/tracking.service";
import { formatCurrency } from "@/utils/format";

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("example.com")) return "";
  if (url.includes("webfashon-reactjs.onrender.com")) {
    return url.replace(
      /https?:\/\/webfashon-reactjs\.onrender\.com/,
      "http://localhost:5000"
    );
  }
  return url;
};

const normalizeCartItems = (backendItems = []) => {
  if (!Array.isArray(backendItems)) return [];
  return backendItems.map((item) => {
    if (item.name && item.new_price !== undefined) return item;

    const product = item.product_id || {};
    const variant = item.variant_id || {};

    const rawImages = Array.isArray(product.displayProduct)
      ? product.displayProduct.map(normalizeImageUrl).filter(Boolean)
      : product.displayProduct
      ? [normalizeImageUrl(product.displayProduct)].filter(Boolean)
      : [];
    const fallbackImage =
      normalizeImageUrl(product.image) ||
      normalizeImageUrl(variant.image_url) ||
      "";
    const image = rawImages[0] || fallbackImage;

    const variantLabel = [variant.color, variant.size]
      .filter(Boolean)
      .join(" / ");

    return {
      _id: item._id,
      id: item._id,
      product_id: product._id || product.id,
      variant_id: variant._id || variant.id,
      name: product.name || "Thiết kế Atelier",
      slug: product.slug || "",
      price: item.price || product.new_price || product.price || 0,
      new_price: item.price || product.new_price || product.price || 0,
      quantity: Number(item.quantity) || 1,
      variant: variantLabel,
      image,
      imageUrl: image,
      stock: variant.stock ?? product.stock ?? 99,
    };
  });
};

const extractCartId = (cartRes) => {
  if (!cartRes || !cartRes.success) return null;
  const data = cartRes.data;
  if (Array.isArray(data)) return data[0]?._id || null;
  return data?._id || null;
};

const MENU_ITEMS = [
  {
    num: "01",
    label: "TRANG CHỦ",
    path: "/",
    desc: "Không gian trải nghiệm điện ảnh chủ đạo",
  },
  {
    num: "02",
    label: "TẤT CẢ THIẾT KẾ",
    path: "/products",
    desc: "Khám phá toàn bộ danh mục may đo đương đại",
  },
  {
    num: "03",
    label: "MỤC YÊU THÍCH",
    path: "/favorites",
    desc: "Bộ sưu tập các thiết kế cá nhân bạn đã lưu",
  },
  {
    num: "04",
    label: "KHO ƯU ĐÃI VOUCHER",
    path: "/vouchers",
    desc: "Đặc quyền mua sắm & mã giảm giá may đo",
  },
  {
    num: "05",
    label: "VÍ VOUCHER CỦA TÔI",
    path: "/my-coupons",
    desc: "Quản lý và kích hoạt voucher cá nhân",
  },
  {
    num: "06",
    label: "LỊCH SỬ ĐƠN HÀNG",
    path: "/orders",
    desc: "Theo dõi tiến độ chế tác và vận chuyển",
  },
  {
    num: "07",
    label: "HỒ SƠ TÀI KHOẢN",
    path: "/profile",
    desc: "Quản lý thông tin cá nhân và sổ địa chỉ",
  },
  {
    num: "08",
    label: "GIỎ HÀNG ATELIER",
    path: "/cart",
    desc: "Biên nhận thiết kế và tiến hành đặt hàng",
  },
];

export const CinematicHeader = ({
  searchTerm = "",
  onSearchTermChange,
  isHomePage = false,
}) => {
  const navigate = useNavigate();
  const { settings, loading } = useWebsiteSettings();
  const contactEmail = settings?.general?.email || "";
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore();
  const displayName =
    user?.fullName ||
    user?.data?.fullName ||
    user?.name ||
    user?.username ||
    "Tài khoản";

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("webfashion_theme");
      if (stored) return stored === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

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

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    toast.success("Đã đăng xuất khỏi tài khoản.");
    navigate("/login");
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const cartItems = useCartStore((state) => state.items);
  const setCartItems = useCartStore((state) => state.setCartItems);
  const favoriteItems = useFavoriteStore((state) => state.items);
  const favoriteCount = favoriteItems.length;

  // Sync cart data from API when drawer opens or on login change
  const refreshCartData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const cartRes = await getCartService();
      const cartId = extractCartId(cartRes);
      if (cartId) {
        const itemsRes = await getCartItemsService(cartId);
        if (itemsRes?.success && Array.isArray(itemsRes.data)) {
          setCartItems(normalizeCartItems(itemsRes.data));
        }
      }
    } catch {
      // Keep store items
    }
  }, [isLoggedIn, setCartItems]);

  useEffect(() => {
    if (isCartOpen) {
      refreshCartData();
    }
  }, [isCartOpen, refreshCartData]);

  const brandName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : "404 STUDIO";
  const logoUrl =
    !loading && settings?.general?.logoUrl ? settings.general.logoUrl : null;

  // Track scroll position to adjust header appearance on homepage
  useEffect(() => {
    if (!isHomePage) return undefined;
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.85;
      setScrolledPastHero(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Keyboard accessibility: ESC closes overlay & drawer
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isCartOpen) setIsCartOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
      }
    },
    [isMenuOpen, isCartOpen, isSearchOpen]
  );

  useEffect(() => {
    if (isMenuOpen || isCartOpen || isSearchOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isCartOpen, isSearchOpen, handleKeyDown]);

  // Match the storefront header's live suggestions and debounced search tracking.
  useEffect(() => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      trackingService.trackSearchDebounced(keyword, 800);
      try {
        const response = await suggestProductsService(keyword);
        const products = Array.isArray(response)
          ? response
          : response?.data ?? [];
        setSuggestions(Array.isArray(products) ? products.slice(0, 6) : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSuggestionSelect = (product) => {
    setIsSearchOpen(false);
    navigate(`/product/${product.slug || product._id || product.id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    );
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.price || item.new_price || 0);
      const qty = Number(item.quantity || 1);
      return sum + price * qty;
    }, 0);
  }, [cartItems]);

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemoveItem(itemId);
      return;
    }

    const itemToUpdate = cartItems.find(
      (i) => (i._id || i.id) === itemId
    );
    if (
      delta > 0 &&
      itemToUpdate?.stock !== undefined &&
      newQty > itemToUpdate.stock
    ) {
      toast.error(
        `Rất tiếc, số lượng trong kho chỉ còn ${itemToUpdate.stock} sản phẩm`
      );
      return;
    }

    setUpdatingItemId(itemId);
    try {
      if (isLoggedIn) {
        await updateCartItemService(itemId, { quantity: newQty });
      }
      setCartItems(
        cartItems.map((item) =>
          (item._id || item.id) === itemId
            ? { ...item, quantity: newQty }
            : item
        )
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể cập nhật số lượng. Vui lòng thử lại.";
      toast.error(msg);
      refreshCartData();
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    const itemToRemove = cartItems.find(
      (i) => (i._id || i.id) === itemId
    );
    setUpdatingItemId(itemId);
    try {
      if (isLoggedIn) {
        await deleteCartItemService(itemId);
      }
      if (itemToRemove) {
        trackingService.trackRemoveFromCart(
          {
            _id: itemToRemove.product_id || itemToRemove.id,
            name: itemToRemove.name,
            price: itemToRemove.price,
          },
          itemToRemove.quantity || 1
        );
      }
      setCartItems(
        cartItems.filter((item) => (item._id || item.id) !== itemId)
      );
      toast.success("Đã xóa thiết kế khỏi giỏ hàng");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể xóa sản phẩm. Vui lòng thử lại.";
      toast.error(msg);
      refreshCartData();
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Determine header background & color based on page type & scroll
  const isTransparent = isHomePage && !scrolledPastHero;

  return (
    <>
      {/* 1. Main Navigation Bar */}
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ease-out flex items-center ${
          isTransparent
            ? "bg-transparent text-white"
            : "bg-background/95 text-foreground border-b border-border shadow-xs backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Left: Minimal Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Mở menu điều hướng toàn màn hình"
            aria-expanded={isMenuOpen}
            className={`group flex min-h-[44px] min-w-[44px] items-center gap-2.5 text-xs font-semibold tracking-[0.26em] uppercase transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 ${
              isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
            }`}
          >
            <span className="relative flex h-3.5 w-4 flex-col justify-between overflow-hidden">
              <span
                className={`h-[1.5px] w-full transition-transform duration-300 group-hover:translate-x-0.5 ${
                  isTransparent ? "bg-white" : "bg-foreground"
                }`}
              />
              <span
                className={`h-[1.5px] w-3/4 transition-transform duration-300 group-hover:w-full ${
                  isTransparent ? "bg-white" : "bg-foreground"
                }`}
              />
              <span
                className={`h-[1.5px] w-full transition-transform duration-300 group-hover:translate-x-0.5 ${
                  isTransparent ? "bg-white" : "bg-foreground"
                }`}
              />
            </span>
            <span className="font-condensed text-sm tracking-[0.2em] sm:inline">
              MENU
            </span>
          </button>

          {/* Center: Brand Logo */}
          <Link
            to="/"
            className={`flex items-center gap-2 text-center group focus-visible:outline focus-visible:outline-2 ${
              isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
            }`}
            aria-label={`${brandName} - Trang chủ`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div className="flex flex-col items-center">
              <span className="font-condensed text-2xl font-bold tracking-[0.16em] uppercase sm:text-3xl">
                {brandName}
              </span>
              <span
                className={`text-[9px] font-medium tracking-[0.4em] uppercase ${
                  isTransparent ? "text-white/50" : "text-muted-foreground"
                }`}
              >
                ATELIER
              </span>
            </div>
          </Link>

          {/* Right: Search + Favorites + Theme Toggle + Cart */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
              aria-label="Mở tìm kiếm sản phẩm"
              aria-expanded={isSearchOpen}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 ${
                isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
              }`}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            {/* Favorites Icon with Badge */}
            <Link
              to="/favorites"
              aria-label={`Danh sách yêu thích, ${favoriteCount} thiết kế`}
              className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 ${
                isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
              }`}
            >
              <Heart size={18} strokeWidth={1.5} />
              {favoriteCount > 0 && (
                <span className="absolute top-2 right-1.5 flex h-4 min-w-[16px] items-center justify-center border border-current bg-background px-1 text-[9px] font-mono font-bold leading-none">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 ${
                isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
              }`}
            >
              {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Mở giỏ hàng, hiện có ${cartCount} sản phẩm`}
              aria-expanded={isCartOpen}
              className={`group flex min-h-[44px] min-w-[44px] items-center justify-end gap-2 text-xs font-semibold tracking-[0.22em] uppercase transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 ${
                isTransparent ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"
              }`}
            >
              <span className="hidden font-condensed text-sm tracking-[0.2em] sm:inline">
                GIỎ HÀNG
              </span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center border px-1 text-[11px] font-mono tabular-nums ${
                  isTransparent
                    ? "border-white/40 text-white group-hover:border-white"
                    : "border-border text-foreground group-hover:border-foreground"
                }`}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Live Search Dropdown */}
        {isSearchOpen && (
          <div className="absolute right-4 top-full mt-2 w-[calc(100%-2rem)] max-w-md border border-border bg-popover/95 p-3 shadow-2xl backdrop-blur-md sm:right-8 sm:w-96 lg:right-12">
            <form role="search" onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <Search size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange?.(event.target.value)}
                autoFocus
                placeholder="Tìm kiếm thiết kế Atelier..."
                aria-label="Tìm kiếm sản phẩm"
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-popover-foreground outline-none placeholder:text-muted-foreground font-sans"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Đóng tìm kiếm"
                className="p-2 text-muted-foreground transition-colors hover:text-popover-foreground"
              >
                <X size={17} />
              </button>
            </form>

            {suggestions.length > 0 && (
              <ul className="mt-2 divide-y divide-border border-t border-border">
                {suggestions.map((product) => {
                  const id = product._id || product.id || product.slug;
                  const thumbnail =
                    product.displayProduct?.[0] || product.image || product.images?.[0];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionSelect(product)}
                        className="flex w-full items-center gap-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="h-10 w-8 shrink-0 overflow-hidden bg-muted">
                          {thumbnail && (
                            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <span className="truncate text-xs tracking-wide text-foreground font-sans">
                          {product.name || "Sản phẩm"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </header>

      {/* 2. Fullscreen Menu Overlay */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng toàn màn hình"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#08090b] text-white p-4 sm:p-7 lg:p-9 animate-in fade-in duration-300"
        >
          {/* Top Bar: Brand & Close Button */}
          <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
            <div className="flex items-center gap-3">
              <span className="font-condensed text-xl font-bold tracking-[0.2em] text-white uppercase">
                {brandName}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
                / NAVIGATION
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Đóng menu"
              className="group flex min-h-[44px] min-w-[44px] items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className="font-condensed">ĐÓNG</span>
              <X size={15} className="transition-transform group-hover:rotate-90" />
            </button>
          </div>

          {/* Center: Navigation Links (Left) + Editorial Preview Canvas (Right) */}
          <div className="grid flex-1 items-center gap-6 py-3 sm:py-4 lg:grid-cols-12 lg:gap-10 overflow-y-auto no-scrollbar min-h-0">
            {/* Left: Nav list */}
            <nav
              aria-label="Các trang chính"
              className="flex flex-col space-y-1 sm:space-y-1.5 lg:space-y-1.5 lg:col-span-7"
            >
              {MENU_ITEMS.map((item, idx) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={() => setActiveMenuIndex(idx)}
                  className="group relative flex items-baseline gap-3 sm:gap-4 py-1 sm:py-1.5 text-left transition-transform duration-200 hover:translate-x-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/50"
                >
                  <span className="font-mono text-[11px] sm:text-xs tracking-widest text-white/35 transition-colors group-hover:text-white shrink-0">
                    {item.num}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-condensed text-xl sm:text-2xl md:text-3xl lg:text-[min(3.6vw,4.2svh)] font-bold tracking-tight text-white/85 transition-colors group-hover:text-white leading-none">
                      {item.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.14em] text-white/40 uppercase transition-colors group-hover:text-white/70 truncate mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="ml-auto opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 shrink-0 text-white/60"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>

            {/* Right: Editorial Preview Canvas (Desktop only) */}
            <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:items-end justify-center">
              <div className="relative aspect-[4/5] w-full max-w-xs xl:max-w-sm max-h-[50svh] overflow-hidden border border-white/10 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/80" />
                <div className="relative z-10 space-y-3">
                  <p className="text-[9px] font-mono tracking-[0.3em] text-white/50 uppercase">
                    ATELIER ARCHIVE · 2026
                  </p>
                  <h3 className="font-condensed text-2xl xl:text-3xl font-bold tracking-wider text-white uppercase">
                    {MENU_ITEMS[activeMenuIndex]?.label}
                  </h3>
                  <div className="mx-auto h-[1px] w-10 bg-white/30" />
                  <p className="text-xs text-white/60 leading-relaxed max-w-[200px] mx-auto font-sans">
                    {MENU_ITEMS[activeMenuIndex]?.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Tagline + Contact (Left) & Account block (Right) */}
          <div className="shrink-0 border-t border-white/10 pt-3 sm:pt-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Tagline & Optional Contact Email */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] tracking-[0.18em] text-white/50 uppercase">
              <div className="flex items-center gap-2">
                <span className="text-white/40">NOIR / BONE / SLATE</span>
                <span className="text-white/20">/</span>
                <span className="text-white/40">VIETNAM ATELIER</span>
              </div>
              {contactEmail && (
                <>
                  <span className="hidden sm:inline text-white/20">·</span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-white/40 hover:text-white transition-colors lowercase font-mono tracking-normal"
                  >
                    {contactEmail}
                  </a>
                </>
              )}
            </div>

            {/* Right: Account Block */}
            <div className="w-full sm:w-auto">
              {isLoggedIn ? (
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
                  <span className="font-mono text-xs tracking-wider text-white/60 truncate max-w-[150px] sm:max-w-[200px]">
                    {displayName}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    data-menu-action="logout-button"
                    className="inline-flex min-h-[44px] items-center justify-center border border-white/30 bg-transparent px-5 text-xs font-semibold tracking-[0.2em] text-white/80 uppercase transition-all hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white shrink-0"
                  >
                    ĐĂNG XUẤT
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  data-menu-action="login-button"
                  className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center border border-white/60 bg-white/5 px-6 text-xs font-semibold tracking-[0.22em] text-white uppercase transition-all hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  ĐĂNG NHẬP / ĐĂNG KÝ
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Cart Drawer (Slide-over from right) */}
      {isCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Giỏ hàng Atelier"
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-300"
        >
          <div className="relative flex h-full w-full max-w-md flex-col justify-between border-l border-white/10 bg-[#0c0d10] text-white p-6 sm:p-8 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <span className="font-condensed text-lg font-bold tracking-[0.2em] text-white uppercase">
                  GIỎ HÀNG ATELIER
                </span>
                <span className="font-mono text-xs text-white/40 tabular-nums">
                  ({cartCount})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Đóng giỏ hàng"
                className="group flex min-h-[44px] min-w-[44px] items-center justify-center border border-white/20 p-2 text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <X size={16} className="transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
              {cartItems.length === 0 ? (
                /* Empty state: Large text + Explore Button */
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
                    ATELIER · TRỐNG
                  </p>
                  <h3 className="mt-4 font-condensed text-4xl font-bold tracking-tight text-white uppercase sm:text-5xl">
                    GIỎ HÀNG ĐANG TRỐNG
                  </h3>
                  <p className="mt-4 max-w-xs text-xs text-white/50 leading-relaxed font-sans">
                    Chưa có thiết kế nào được chọn. Hãy khám phá những tạo tác may
                    đo mới nhất trong bộ sưu tập 2026.
                  </p>
                  <Link
                    to="/products"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-8 inline-flex min-h-[44px] items-center border border-white/40 px-6 py-3 text-xs font-semibold tracking-[0.24em] text-white uppercase transition-all hover:border-white hover:bg-white hover:text-black"
                  >
                    KHÁM PHÁ CỬA HÀNG
                  </Link>
                </div>
              ) : (
                /* Item list */
                <div className="space-y-4 divide-y divide-white/10">
                  {cartItems.map((item) => {
                    const itemImg =
                      item.image ||
                      item.imageUrl ||
                      item.thumbnail ||
                      item.images?.[0] ||
                      "";
                    const isBusy = updatingItemId === item._id;

                    return (
                      <div
                        key={item._id || item.id}
                        className="flex gap-4 pt-4 first:pt-0"
                      >
                        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-[9px] text-white/40 font-mono">
                              CANVAS
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <h4 className="font-condensed text-base font-bold tracking-wide uppercase text-white line-clamp-1">
                              {item.name}
                            </h4>
                            {item.variant && (
                              <p className="text-[11px] tracking-wider text-white/50 uppercase">
                                {item.variant}
                              </p>
                            )}
                            <p className="mt-1 font-mono text-xs font-semibold text-white/80">
                              {formatCurrency(item.price || item.new_price || 0)}
                            </p>
                            {item.stock !== undefined && item.stock <= 5 && (
                              <p className="text-[10px] text-amber-400/90 mt-0.5">
                                Chỉ còn {item.stock} sản phẩm
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-white/20">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item._id || item.id,
                                    item.quantity,
                                    -1
                                  )
                                }
                                aria-label="Giảm số lượng"
                                className="flex h-7 w-7 items-center justify-center text-white/70 transition-colors hover:text-white disabled:opacity-30"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="flex h-7 min-w-[28px] items-center justify-center font-mono text-xs font-semibold text-white">
                                {isBusy ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                type="button"
                                disabled={
                                  isBusy ||
                                  (item.stock !== undefined &&
                                    item.quantity >= item.stock)
                                }
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item._id || item.id,
                                    item.quantity,
                                    1
                                  )
                                }
                                aria-label="Tăng số lượng"
                                className="flex h-7 w-7 items-center justify-center text-white/70 transition-colors hover:text-white disabled:opacity-30"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleRemoveItem(item._id || item.id)
                              }
                              aria-label={`Xóa ${item.name} khỏi giỏ`}
                              className="text-white/40 transition-colors hover:text-red-400 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/10 pt-5 space-y-4">
                <div className="flex items-baseline justify-between text-xs tracking-[0.2em] text-white/60 uppercase">
                  <span>TẠM TÍNH</span>
                  <span className="font-mono text-base font-bold text-white">
                    {formatCurrency(cartSubtotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="inline-flex min-h-[46px] items-center justify-center border border-white/30 px-4 text-xs font-semibold tracking-[0.2em] text-white uppercase transition-colors hover:border-white hover:bg-white hover:text-black"
                  >
                    XEM GIỎ HÀNG
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="inline-flex min-h-[46px] items-center justify-center border border-white bg-white px-4 text-xs font-semibold tracking-[0.2em] text-black uppercase transition-opacity hover:opacity-90"
                  >
                    THANH TOÁN
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CinematicHeader;
