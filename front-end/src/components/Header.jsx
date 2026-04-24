import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { FaSearch, FaShoppingBag } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Badge } from "antd";
import { MdOutlineAccountCircle } from "react-icons/md";
import { Dropdown } from "antd";

const Header = () => {
  const [search, setSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => {
      const isScrolling = window.scrollY > 0;
      setIsScrolled(isScrolling);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const items = [
    {
      key: "1",
      label: <Link to="/account/profile">Tài khoản</Link>,
    },
    {
      key: "2",
      label: <Link to="/orders">Đơn hàng</Link>,
    },
    {
      key: "3",
      label: token ? (
        <Link to="/logout">Đăng xuất</Link>
      ) : (
        <Link to="/login">Đăng nhập</Link>
      ),
    },
  ];
  return (
    <div className={`sticky top-0 z-50 flex justify-between items-center h-16 min-w-min px-5 transition-all duration-300 ${
      isScrolled ? "bg-black bg-opacity-30 backdrop-blur-md shadow-lg" : "bg-gray-800"
    } text-white`}>
      {/* Image  */}
      <Link to="/" className="h-full flex items-center" >
        <img src={logo} alt="404Studio" className="h-12 w-auto object-contain"/>
      </Link>
      {/* Navigation  */}
      <div>
        {search ? (
          <div className="">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="border rounded-l-lg text-white placeholder:text-gray-400  focus:outline-none focus:ring-2 focus:ring-blue-500 px-2"
            />
            <button type="submit" className="border rounded-r-lg px-4">
              Tìm
            </button>
          </div>
        ) : (
          <menu className="flex gap-6">
            <Link to="/">
              <li className="hover:underline">Home</li>
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
        <Link to="/cart" className="relative">
          <Badge count={5}>
            <FaShoppingBag className="text-white text-xl" />
          </Badge>
        </Link>
        {/* Me  */}
        <Dropdown menu={{ items }} placement="topRight">
          <MdOutlineAccountCircle className="text-2xl" />
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;
