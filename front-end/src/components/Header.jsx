import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { FaSearch, FaShoppingBag } from "react-icons/fa";
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
  const navigate = useNavigate();
  const wrapperRef = useRef();
  //kiểm tra đăng nhập
  const { isAuthenticated: isLoggedIn, logout, user } = useAuthStore();
  const role = user?.role || user?.data?.role || "";
  // console.log("Header isLoggedIn:", isLoggedIn);
  console.log("Header user:", role);

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
        setShowSuggest(false);
        return;
      }
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
  };

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
          console.log("Cart response:", res.data);
          // Calculate total quantity of products
          const totalQty = res.data?.[0]?.total_items || 0;
          console.log("Total cart quantity:", totalQty);
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
      console.log("cartUpdated event received, totalQuantity:", totalQuantity);
      if (totalQuantity !== undefined) {
        console.log("Setting cartItemCount to:", totalQuantity);
        setCartItemCount(totalQuantity);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const totalItems = cartItemCount;
  return (
    <div
      className={`sticky top-0 z-50 flex justify-between items-center h-16 px-6 transition-all duration-300 ${
        isScrolled
          ? "bg-background border-b border-border shadow-sm"
          : "bg-background border-b border-border"
      }`}
    >
      {/* Logo */}
      <Link to="/" onClick={handleGoHome} className="h-full flex items-center">
        <img
          src={logo}
          alt="WebFashion"
          className="h-10 w-auto object-contain"
        />
      </Link>

      {/* Navigation Menu */}
      <div className="flex-1 flex justify-center">
        {search ? (
          <form onSubmit={handleSubmit} className="w-96">
            <div className="relative flex">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-border rounded-l-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-r-lg hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
            {/* Search Suggestions */}
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-96 mt-1 bg-card border border-border rounded-lg shadow-lg z-50">
                {suggestions.map((item) => (
                  <Link
                    key={item._id}
                    to={`/products?search=${encodeURIComponent(item.name)}&page=1`}
                    className="block px-4 py-2 hover:bg-muted text-foreground transition-colors first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => {
                      setKeyword("");
                      setShowSuggest(false);
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </form>
        ) : (
          <menu className="flex gap-8 text-sm font-medium">
            <Link to="/" className="text-foreground hover:text-accent transition-colors">
              Home
            </Link>
            <Link to="/lookbooks" className="text-foreground hover:text-accent transition-colors">
              Lookbook
            </Link>
            <Link to="/about" className="text-foreground hover:text-accent transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-foreground hover:text-accent transition-colors">
              Contact
            </Link>
          </menu>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search Icon */}
        <button
          onClick={() => setSearch(!search)}
          className="text-foreground hover:text-accent transition-colors"
          title="Search"
        >
          <FaSearch className="text-lg" />
        </button>

        {/* Cart Icon */}
        <Link to={isLoggedIn ? "/cart" : "/login"} className="relative">
          <Badge count={cartItemCount} color="cyan">
            <div ref={cartRef} className="text-foreground hover:text-accent transition-colors">
              <FaShoppingBag className="text-lg" />
            </div>
          </Badge>
        </Link>

        {/* User Menu */}
        <Dropdown menu={{ items }} placement="bottomRight">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={user?.data?.avatar || "/default-avatar.png"}
                alt={user?.data?.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm text-foreground hidden sm:inline">
                {user?.data?.fullName || "Account"}
              </span>
            </div>
          ) : (
            <div className="flex items-center cursor-pointer hover:text-accent transition-colors">
              <MdOutlineAccountCircle className="text-2xl text-foreground" />
            </div>
          )}
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;
