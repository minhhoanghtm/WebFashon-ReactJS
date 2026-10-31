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
} from "lucide-react";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
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

    const variantImage = normalizeImageUrl(variant.image_url);
    const productImage = normalizeImageUrl(
      rawImages[0] ||
        product.image ||
        product.imageUrl ||
        product.image_url ||
        ""
    );

    return {
      _id: item._id,
      product_id: product._id || product.id,
      slug: product.slug || product._id || product.id,
      name: product.name || "Thiết kế thời trang",
      category: product.category_id?.name || "Bộ sưu tập",
      image: variantImage || productImage || "",
      productImage,
      images: [variantImage, ...rawImages, productImage].filter(Boolean),
      new_price: Number(product.new_price ?? item.price ?? 0),
      old_price: Number(product.old_price ?? 0),
      price: Number(item.price ?? product.new_price ?? 0),
      quantity: Number(item.quantity || 1),
      stock: variant.stock ?? product.stock ?? 99,
      campaign: item.campaign || product.campaign || null,
      price_changed: Boolean(item.price_changed),
      variants: variant._id
        ? [
            {
              _id: variant._id,
              color: variant.color,
              size: variant.size,
              image_url: variant.image_url,
              stock: variant.stock,
            },
          ]
        : [],
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
    desc: "Không gian trải nghiệm chủ đạo",
  },
  {
    num: "02",
    label: "TẤT CẢ THIẾT KẾ",
    path: "/products",
    desc: "Khám phá danh mục may đo đương đại",
  },
  {
    num: "03",
    label: "MỤC YÊU THÍCH",
    path: "/favorites",
    desc: "Bộ sưu tập các thiết kế bạn đã lưu",
  },
  {
    num: "04",
    label: "ƯU ĐÃI VOUCHER",
    path: "/vouchers",
    desc: "Đặc quyền mua sắm dành riêng cho bạn",
  },
  {
    num: "05",
    label: "GIỎ HÀNG CỦA BẠN",
    path: "/cart",
    desc: "Xem lại và tiến hành thanh toán đơn hàng",
  },
];

export const CinematicHeader = ({ searchTerm = "", onSearchTermChange }) => {
  const navigate = useNavigate();
  const { settings, loading } = useWebsiteSettings();
  const { isAuthenticated: isLoggedIn } = useAuthStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const cartItems = useCartStore((state) => state.items);
  const setCartItems = useCartStore((state) => state.setCartItems);

  // Sync cart data from API when drawer opens or on login change
  const refreshCartData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const cartRes = await getCartService();
      const cartId = extractCartId(cartRes);
      if (cartId) {
        const itemsRes = await getCartItemsService(cartId);
        const normalized = normalizeCartItems(itemsRes?.data || []);
        setCartItems(normalized);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ giỏ hàng:", err);
    }
  }, [isLoggedIn, setCartItems]);

  useEffect(() => {
    if (isCartOpen) {
      refreshCartData();
    }
  }, [isCartOpen, refreshCartData]);

  // Calculate cart totals
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + (Number(item.new_price ?? item.price ?? 0)) * (item.quantity || 0),
      0
    );
  }, [cartItems]);

  const brandName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : "404 STUDIO";
  const logoUrl =
    !loading && settings?.general?.logoUrl ? settings.general.logoUrl : null;

  // Track scroll position to adjust header appearance
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.85;
      setScrolledPastHero(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        const products = Array.isArray(response) ? response : response?.data ?? [];
        setSuggestions(Array.isArray(products) ? products.slice(0, 6) : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const keyword = searchTerm.trim();
    setIsSearchOpen(false);
    if (keyword) {
      trackingService.trackSearchImmediate(keyword);
      navigate(`/products?search=${encodeURIComponent(keyword)}&page=1`);
      return;
    }
    navigate("/products");
  };

  const handleSuggestionSelect = (product) => {
    const keyword = searchTerm.trim();
    if (keyword) trackingService.trackSearchImmediate(keyword);
    setIsSearchOpen(false);
    const slug = product.slug;
    navigate(slug ? `/product/${slug}` : "/products");
  };

  // Handle quantity change with stock error handling & tracking
  const handleQuantityChange = async (itemId, newQty) => {
    const item = cartItems.find((i) => i._id === itemId);
    if (!item || newQty < 1) return;

    // Check inventory stock limit
    if (item.stock !== undefined && newQty > Number(item.stock)) {
      toast.error(`Kho chỉ còn tối đa ${item.stock} sản phẩm.`);
      return;
    }

    const oldQty = item.quantity;
    setUpdatingItemId(itemId);

    try {
      const res = await updateCartItemService(itemId, { quantity: newQty });
      if (res?.success && res?.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);

        // Tracking
        trackingService.trackCartQuantityChange(
          {
            id: item.product_id,
            _id: item.product_id,
            price: item.price || item.new_price,
          },
          oldQty,
          newQty
        );

        // Notify other components
        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              totalQuantity: normalized.reduce((sum, i) => sum + i.quantity, 0),
            },
          })
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
      toast.error("Không thể cập nhật số lượng lúc này!");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Handle delete cart item with tracking
  const handleDeleteItem = async (itemId) => {
    const targetItem = cartItems.find((i) => i._id === itemId);
    setUpdatingItemId(itemId);

    try {
      const res = await deleteCartItemService(itemId);
      if (res?.success && res?.data) {
        const normalized = normalizeCartItems(res.data);
        setCartItems(normalized);
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");

        // Tracking
        if (targetItem) {
          trackingService.trackRemoveFromCart(
            {
              id: targetItem.product_id,
              _id: targetItem.product_id,
              price: targetItem.price || targetItem.new_price,
            },
            targetItem.quantity
          );
        }

        // Notify other components
        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: {
              totalQuantity: normalized.reduce((sum, i) => sum + i.quantity, 0),
            },
          })
        );
      }
    } catch (err) {
      console.error("Lỗi khi xóa sản phẩm:", err);
      toast.error("Xóa sản phẩm thất bại!");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    navigate("/cart");
  };

  return (
    <>
      {/* 1. Transparent Header bar overlaid on Hero */}
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolledPastHero
            ? "bg-neutral-950/85 backdrop-blur-md border-b border-white/10 py-3.5"
            : "bg-transparent py-5 sm:py-7"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Left: Minimal Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Mở menu điều hướng toàn màn hình"
            aria-expanded={isMenuOpen}
            className="group flex min-h-[44px] min-w-[44px] items-center gap-2.5 text-xs font-semibold tracking-[0.26em] text-white uppercase transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span className="relative flex h-3.5 w-4 flex-col justify-between overflow-hidden">
              <span className="h-[1.5px] w-full bg-white transition-transform duration-300 group-hover:translate-x-0.5" />
              <span className="h-[1.5px] w-3/4 bg-white transition-transform duration-300 group-hover:w-full" />
              <span className="h-[1.5px] w-full bg-white transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
            <span className="font-condensed text-sm tracking-[0.2em] sm:inline">
              MENU
            </span>
          </button>

          {/* Center: Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-center group focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
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
              <span className="font-condensed text-2xl font-bold tracking-[0.16em] text-white uppercase sm:text-3xl">
                {brandName}
              </span>
              <span className="text-[9px] font-medium tracking-[0.4em] text-white/50 uppercase">
                ATELIER
              </span>
            </div>
          </Link>

          {/* Right: Search + Cart */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
              aria-label="Mở tìm kiếm sản phẩm"
              aria-expanded={isSearchOpen}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-white transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Mở giỏ hàng, hiện có ${cartCount} sản phẩm`}
              aria-expanded={isCartOpen}
              className="group flex min-h-[44px] min-w-[44px] items-center justify-end gap-2 text-xs font-semibold tracking-[0.22em] text-white uppercase transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className="font-condensed text-sm tracking-[0.2em]">
                GIỎ HÀNG
              </span>
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center border border-white/40 px-1 text-[11px] font-mono tabular-nums text-white group-hover:border-white">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute right-4 top-full mt-2 w-[calc(100%-2rem)] max-w-md border border-white/15 bg-neutral-950/95 p-3 shadow-2xl backdrop-blur-md sm:right-8 sm:w-96 lg:right-12">
            <form role="search" onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <Search size={17} className="shrink-0 text-white/55" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange?.(event.target.value)}
                autoFocus
                placeholder="Tìm kiếm thiết kế..."
                aria-label="Tìm kiếm sản phẩm"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Đóng tìm kiếm"
                className="p-2 text-white/65 transition-colors hover:text-white"
              >
                <X size={17} />
              </button>
            </form>

            {suggestions.length > 0 && (
              <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
                {suggestions.map((product) => {
                  const id = product._id || product.id || product.slug;
                  const thumbnail =
                    product.displayProduct?.[0] || product.image || product.images?.[0];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionSelect(product)}
                        className="flex w-full items-center gap-3 py-2 text-left transition-colors hover:bg-white/10"
                      >
                        <div className="h-10 w-8 shrink-0 overflow-hidden bg-white/10">
                          {thumbnail && (
                            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <span className="truncate text-xs tracking-wide text-white">
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
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#08090b] text-white p-6 sm:p-10 lg:p-14 animate-in fade-in duration-300"
        >
          {/* Top Bar: Brand & Close Button */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
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
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-12 lg:gap-14">
            {/* Left: Nav list */}
            <nav
              aria-label="Các trang chính"
              className="flex flex-col space-y-2 sm:space-y-4 lg:col-span-7"
            >
              {MENU_ITEMS.map((item, idx) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={() => setActiveMenuIndex(idx)}
                  className="group relative flex items-baseline gap-4 py-2 text-left transition-transform duration-300 hover:translate-x-3 focus-visible:outline-none"
                >
                  <span className="font-mono text-xs tracking-widest text-white/40 transition-colors group-hover:text-white">
                    {item.num}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-condensed text-3xl font-extrabold tracking-tight text-white/80 transition-colors group-hover:text-white sm:text-5xl lg:text-6xl">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-sans tracking-[0.18em] text-white/40 uppercase transition-colors group-hover:text-white/70">
                      {item.desc}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={22}
                    className="ml-auto opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                  />
                </Link>
              ))}
            </nav>

            {/* Right: Editorial Preview Canvas (Desktop only) */}
            <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:items-end">
              <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden border border-white/10 bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/80" />
                <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-mono tracking-[0.3em] text-white/50 uppercase">
                    ATELIER EDITION · 2026
                  </p>
                  <h3 className="font-condensed text-3xl font-extrabold tracking-wider text-white uppercase">
                    {MENU_ITEMS[activeMenuIndex].label}
                  </h3>
                  <div className="mx-auto h-[1px] w-12 bg-white/30" />
                  <p className="text-xs text-white/60 leading-relaxed max-w-[200px] mx-auto font-sans">
                    {MENU_ITEMS[activeMenuIndex].desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Social + Contact */}
          <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-6 text-[11px] tracking-[0.2em] text-white/60 uppercase">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
              <span className="text-white/20">/</span>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Facebook
              </a>
              <span className="text-white/20">/</span>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                TikTok
              </a>
            </div>

            <div className="text-[11px] tracking-[0.16em] text-white/40 uppercase sm:text-right">
              <span>contact@404studio.vn</span>
              <span className="mx-2 text-white/20">·</span>
              <span>104 Đồng Khởi, Q.1, TP.HCM</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cart Drawer (Slide-over from right) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Giỏ hàng của bạn"
            className="relative flex h-full w-full max-w-md flex-col justify-between border-l border-white/10 bg-[#0a0b0e] p-6 text-white shadow-2xl animate-in slide-in-from-right duration-300 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-baseline gap-2">
                <h2 className="font-condensed text-xl font-bold tracking-[0.16em] uppercase">
                  GIỎ HÀNG
                </h2>
                <span className="text-xs text-white/50 font-mono">
                  ({cartCount})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Đóng giỏ hàng"
                className="group flex min-h-[44px] min-w-[44px] items-center justify-center border border-white/20 p-2 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto py-6">
              {cartItems.length === 0 ? (
                /* Empty state: Large text + thin button */
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <p className="text-[11px] font-medium tracking-[0.3em] text-white/40 uppercase">
                    ATELIER BAG
                  </p>
                  <h3 className="mt-3 font-condensed text-3xl font-extrabold tracking-tight text-white uppercase sm:text-4xl">
                    GIỎ HÀNG ĐANG TRỐNG
                  </h3>
                  <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/60">
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

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity buttons */}
                            <div className="flex items-center border border-white/20">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    (item.quantity || 1) - 1
                                  )
                                }
                                aria-label="Giảm số lượng"
                                className="flex h-7 w-7 items-center justify-center text-white/70 hover:text-white disabled:opacity-30"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center font-mono text-xs text-white">
                                {isBusy ? (
                                  <Loader2 size={11} className="mx-auto animate-spin" />
                                ) : (
                                  item.quantity || 1
                                )}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    (item.quantity || 1) + 1
                                  )
                                }
                                aria-label="Tăng số lượng"
                                className="flex h-7 w-7 items-center justify-center text-white/70 hover:text-white disabled:opacity-30"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteItem(item._id)}
                              aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                              className="text-white/40 transition-colors hover:text-rose-400 p-1 disabled:opacity-30"
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

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/10 pt-5 space-y-4">
                <div className="flex items-center justify-between text-xs tracking-wider uppercase">
                  <span className="text-white/60">TẠM TÍNH</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex min-h-[44px] w-full items-center justify-center border border-white bg-white py-3 text-xs font-bold tracking-[0.22em] text-black uppercase transition-colors hover:bg-neutral-200"
                  >
                    TIẾN HÀNH THANH TOÁN
                  </button>

                  <button
                    type="button"
                    onClick={handleViewCart}
                    className="flex min-h-[44px] w-full items-center justify-center border border-white/30 bg-transparent py-3 text-xs font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:border-white hover:bg-white/10"
                  >
                    XEM CHI TIẾT GIỎ HÀNG
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

export default CinematicHeader;
