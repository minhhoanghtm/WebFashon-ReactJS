import trackingService from "@/services/tracking.service";
import trackingApi from "@/api/trackingApi";
import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { FaSearch, FaShoppingBag, FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "antd";
import { MdOutlineAccountCircle } from "react-icons/md";
import { Dropdown } from "antd";
import { suggestProductsService } from "@/services/product.service";
import { useAuthStore } from "@/store/auth.store";
import useCartAnimation from "./useCartAnimation";
import { getCartService } from "@/services/cart.service";
import { toast } from "react-toastify";
const Header = () => {
  const [search, setSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadSearchHistory = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await trackingApi.getSearchHistory();
      if (res && res.data) {
        setSearchHistory(res.data);
      }
    } catch (_err) {
      // ignore
    }
  };

  const handleClearHistory = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await trackingApi.clearSearchHistory();
      setSearchHistory([]);
    } catch (_err) {
      // ignore
    }
  };
  const navigate = useNavigate();
  const wrapperRef = useRef();
  //kiểm tra đăng nhập
  const { isAuthenticated: isLoggedIn, logout, user } = useAuthStore();
  const role = user?.role || user?.data?.role || "";
  // console.log("Header isLoggedIn:", isLoggedIn);
  // console.log("Header user:", role);

  //Hieu ung khi them vao gio hang
  const { cartRef, flyToCart } = useCartAnimation();
  //Scroll header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolling = window.scrollY > 0;
      setIsScrolled(isScrolling);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  //Tim kiem
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!keyword.trim()) {
        setSuggestions([]);
        return;
      }
      trackingService.trackSearchDebounced(keyword, 800);
      try {
        const res = await suggestProductsService(keyword);
        const results = Array.isArray(res) ? res : res?.data ?? [];
        if (results && results.length > 0) {
          setSuggestions(results.slice(0, 7));
          setShowSuggest(true);
        } else {
          setSuggestions([]);
          setShowSuggest(false);
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        setSuggestions([]);
        setShowSuggest(false);
      }
    }, 300); // Delay 300ms sau khi người dùng ngừng gõ

    return () => clearTimeout(delay);
  }, [keyword]);

  //Tim kiem san pham
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      return;
    }
    trackingService.trackSearchImmediate(keyword);
    setShowSuggest(false);
    navigate(`/products?search=${encodeURIComponent(keyword)}&page=1`);
  };

  //Khi click vao logo thi se quay ve trang chu va reset search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  //Quay ve trang chu khi click logo
  const handleGoHome = () => {
    navigate("/");
    setSearch(false);
    setKeyword("");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  //Dang xuat
  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    navigate("/login");
  };

  //lay duong dan menu dua tren role
  const getMenuPath = () => {
    if (!isLoggedIn) return "/login";
    if (role === "admin") return "/admin/customers";
    return "/orders";
  };

  //lay label menu dua tren role
  const getMenuLabel = () => {
    if (!isLoggedIn) return "Đơn hàng";
    if (role === "admin") return "Quản lý tài khoản";
    return "Đơn hàng";
  };

  // Menu dropdown tùy theo role
  const items = [
    // Tài khoản - Chỉ cho user
    {
      key: "1",
      label: (
        <Link to={isLoggedIn && role === "user" ? "/account/profile" : "/login"}>
          {role === "user" ? "Tài khoản cá nhân" : "Tài khoản"}
        </Link>
      ),
      disabled: isLoggedIn && role !== "user",
    },
    // Quản lý - Tùy theo role
    {
      key: "2",
      label: <Link to={getMenuPath()}>{getMenuLabel()}</Link>,
    },
    // Dashboard - Tùy theo role
    {
      key: "3",
      label: isLoggedIn ? (
        <Link to={role === "user" ? "/user/dashboard" : "/admin"}>
          {role === "user" ? "Thống kê đơn hàng" : "Dashboard Quản lý"}
        </Link>
      ) : (
        <Link to="/login">Dashboard</Link>
      ),
    },
    // Đăng xuất / Đăng nhập
    {
      key: "4",
      label: isLoggedIn ? (
        <Link to="/" onClick={handleLogout}>
          Đăng xuất
        </Link>
      ) : (
        <Link to="/login">Đăng nhập</Link>
      ),
    },
  ];

  //hieu ung them vao gio hang
  useEffect(() => {
    const handleFly = (e) => {
      const payload = e.detail;
      flyToCart(payload?.src ? payload : payload?.img || payload);
    };

    window.addEventListener("flyToCart", handleFly);

    return () => window.removeEventListener("flyToCart", handleFly);
  }, [flyToCart]);

  //lấy giỏ hàng
  useEffect(() => {
    const fetchCart = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await getCartService();
        if (res.success) {
          // console.log("Cart response:", res.data);
          // Calculate total quantity of products
          const totalQty = res.data?.[0]?.total_items || 0;
          // console.log("Total cart quantity:", totalQty);
          setCartItemCount(totalQty);
        }
      } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
      }
    };
    fetchCart();
  }, [isLoggedIn]);

  //listen for cart updates from other pages
  useEffect(() => {
    const handleCartUpdate = async (e) => {
      const { totalQuantity } = e.detail || {};
      // console.log("cartUpdated event received, totalQuantity:", totalQuantity);
      if (totalQuantity !== undefined) {
        // console.log("Setting cartItemCount to:", totalQuantity);
        setCartItemCount(totalQuantity);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  return (
    <header className={`site-header sticky top-0 z-50 ${isScrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__bar">
      {/* Image  */}
      <Link to="/" onClick={handleGoHome} className="site-header__brand" aria-label="404Studio trang chủ">
        <img
          src={logo}
          alt="404Studio"
          className="site-header__logo"
        />
      </Link>
      <nav className="site-header__nav" aria-label="Điều hướng chính">
        <Link to="/" onClick={closeMenu}>Trang chủ</Link><Link to="/lookbooks" onClick={closeMenu}>Lookbook</Link><Link to="/about" onClick={closeMenu}>Về chúng tôi</Link><Link to="/contact" onClick={closeMenu}>Liên hệ</Link>
      </nav>
      <div className="site-header__search relative" ref={wrapperRef}>
        {search ? (
          <form onSubmit={handleSubmit} className="site-header__search-form">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                setShowSuggest(true);
                loadSearchHistory();
              }}
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="site-header__search-input"
            />
            {/* // Hiển thị gợi ý tìm kiếm & Lịch sử tìm kiếm */}
            {showSuggest && (
              <div className="absolute top-full left-0 w-full bg-white text-black shadow-lg rounded-md z-50 border border-gray-200 overflow-hidden">
                {keyword.trim() && suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <Link
                      key={item._id}
                      to={`/products?search=${encodeURIComponent(item.name)}&page=1`}
                      className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        trackingService.trackSearchImmediate(item.name);
                        setKeyword("");
                        setShowSuggest(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  ))
                ) : !keyword.trim() && isLoggedIn && searchHistory.length > 0 ? (
                  <div className="p-2">
                    <div className="flex justify-between items-center px-2 py-1 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      <span>Lịch sử tìm kiếm</span>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-red-500 hover:text-red-700 text-xs cursor-pointer font-normal normal-case"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="mt-1 max-h-48 overflow-y-auto">
                      {searchHistory.map((term, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1.5 hover:bg-gray-100 rounded text-sm cursor-pointer text-gray-700 truncate"
                          onClick={() => {
                            setKeyword(term);
                            setShowSuggest(false);
                            trackingService.trackSearchImmediate(term);
                            navigate(`/products?search=${encodeURIComponent(term)}&page=1`);
                          }}
                        >
                          {term}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <button type="submit" className="site-header__search-submit">
              Tìm kiếm
            </button>
          </form>
        ) : (
          <span className="site-header__tagline">Contemporary Vietnamese tailoring</span>
        )}
      </div>
      <div className="site-header__actions">
        {/* Search  */}
        <button onClick={() => setSearch(!search)} className="site-header__icon-button" aria-label={search ? "Đóng tìm kiếm" : "Mở tìm kiếm"}>
          <FaSearch />
        </button>
        {/* Cart */}
        <Link to={isLoggedIn ? "/cart" : "/login"} className="site-header__icon-button relative" aria-label="Giỏ hàng">
          <Badge count={cartItemCount}>
            <div ref={cartRef}>
              <FaShoppingBag />
            </div>
          </Badge>
        </Link>
        {/* Me  */}
        <Dropdown menu={{ items }} placement="topRight">
          {isLoggedIn ? (
            <div className="site-header__account cursor-pointer">
              <img
                src={user?.data.avatar || "/default-avatar.png"}
                alt={user?.data.fullName}
                className="site-header__avatar"
              />
              <span className="hidden lg:inline">{user?.data.fullName || "Tài khoản"}</span>
            </div>
          ) : (
            <div className="site-header__icon-button cursor-pointer">
              <MdOutlineAccountCircle />
            </div>
          )}
        </Dropdown>
        <button className="site-header__menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label="Mở menu">{menuOpen ? <FaTimes /> : <FaBars />}</button>
      </div></div>
      <nav id="mobile-navigation" className={`site-header__mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng di động">
        <Link to="/" onClick={closeMenu}>Trang chủ</Link><Link to="/lookbooks" onClick={closeMenu}>Lookbook</Link><Link to="/about" onClick={closeMenu}>Về chúng tôi</Link><Link to="/contact" onClick={closeMenu}>Liên hệ</Link>
      </nav>
    </header>
  );
};

export default Header;
