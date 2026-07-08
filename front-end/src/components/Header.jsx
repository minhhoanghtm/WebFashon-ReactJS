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

  const totalItems = cartItemCount;
  return (
    <div
      className={`sticky top-0 z-50 flex justify-between items-center h-16 min-w-min px-5 transition-all duration-300 ${
        isScrolled
          ? "bg-black bg-opacity-30 backdrop-blur-md shadow-lg"
          : "bg-gray-800"
      } text-white`}
    >
      {/* Image  */}
      <Link to="/" onClick={handleGoHome} className="h-full flex items-center">
        <img
          src={logo}
          alt="404Studio"
          className="h-12 w-auto object-contain"
        />
      </Link>
      {/* Navigation  */}
      <div className="relative">
        {search ? (
          <form onSubmit={handleSubmit}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="border rounded-l-lg text-white placeholder:text-gray-400  focus:outline-none focus:ring-2 focus:ring-blue-500 px-2"
            />
            {/* // Hiển thị gợi ý tìm kiếm */}
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white text-black shadow-md rounded-md z-50">
                {suggestions.map((item) => (
                  <Link
                    key={item._id}
                    to={`/products?search=${encodeURIComponent(item.name)}&page=1`}
                    className="block px-4 py-2 hover:bg-gray-200"
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
            <button type="submit" className="border rounded-r-lg px-4">
              Tìm
            </button>
          </form>
        ) : (
          <menu className="flex gap-6">
            <Link to="/">
              <li className="hover:underline">Home</li>
            </Link>
            <Link to="/lookbooks">
              <li className="hover:underline">Lookbook</li>
            </Link>
            <Link to="/about">
              <li className="hover:underline">About</li>
            </Link>
            <Link to="/contact">
              <li className="hover:underline">Contact</li>
            </Link>
          </menu>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Search  */}
        <button onClick={() => setSearch(!search)} className="">
          <FaSearch className="text-xl" />
        </button>
        {/* Cart */}
        <Link to={isLoggedIn ? "/cart" : "/login"} className="relative">
          <Badge count={cartItemCount}>
            <div ref={cartRef}>
              <FaShoppingBag className="text-white text-xl" />
            </div>
          </Badge>
        </Link>
        {/* Me  */}
        <Dropdown menu={{ items }} placement="topRight">
          {isLoggedIn ? (
            <div className="flex items-center gap-1 cursor-pointer">
              <img
                src={user?.data.avatar || "/default-avatar.png"}
                alt={user?.data.fullName}
                className="w-8 h-8 rounded-full object-cover object-center"
              />
              <span>{user?.data.fullName || "Tài khoản"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 cursor-pointer">
              <MdOutlineAccountCircle className="text-2xl" />
            </div>
          )}
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;
