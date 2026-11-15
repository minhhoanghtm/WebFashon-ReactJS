import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Sparkles, User, Menu, X, Shield, LogOut, Compass } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { useUiStore } from "../../stores/uiStore";
import { usePersonaStore } from "../../stores/personaStore";
import { NotificationCenter } from "../shared/NotificationCenter";

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.getCount());
  const openAiModal = useUiStore((state) => state.openAiModal);
  const isMobileMenuOpen = useUiStore((state) => state.isMobileMenuOpen);
  const toggleMobileMenu = useUiStore((state) => state.toggleMobileMenu);
  const closeMobileMenu = useUiStore((state) => state.closeMobileMenu);

  const persona = usePersonaStore((state) => state.persona);
  const openQuiz = usePersonaStore((state) => state.openQuiz);

  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`);
      closeMobileMenu();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c0c0e]/95 backdrop-blur-md border-b border-[rgba(244,240,232,0.1)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-display font-bold tracking-widest text-[#f4f0e8] hover:text-[#e65100] transition-colors"
          >
            <span className="w-2.5 h-2.5 bg-[#e65100] inline-block" />
            <span>WEBFASHION</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[rgba(244,240,232,0.2)] text-[#9a989f]">
              ATELIER
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-display tracking-widest text-[#9a989f] uppercase">
            <Link to="/products" className="hover:text-[#f4f0e8] transition-colors py-2">
              Bộ Sưu Tập
            </Link>
            <Link to="/lookbooks" className="hover:text-[#f4f0e8] transition-colors py-2">
              Lookbooks
            </Link>
            <Link to="/vouchers" className="hover:text-[#f4f0e8] transition-colors py-2">
              Vouchers
            </Link>
            <Link to="/order-lookup" className="hover:text-[#f4f0e8] transition-colors py-2">
              Tra Cứu Đơn
            </Link>
          </nav>
        </div>

        {/* Right Action Icons & Search */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Tìm kiếm thiết kế..."
              className="w-44 xl:w-56 min-h-[38px] pl-8 pr-3 bg-[#161619] border border-[rgba(244,240,232,0.12)] text-xs text-[#f4f0e8] placeholder-[#6b6973] focus:border-[#e65100] transition-all"
            />
            <Search className="absolute left-2.5 text-[#6b6973] pointer-events-none" size={14} />
          </form>

          {/* AI Style Persona Button / Badge */}
          <button
            onClick={openQuiz}
            className="min-h-[40px] px-2.5 bg-[#161619] hover:bg-[#202025] border border-[rgba(244,240,232,0.15)] hover:border-[#e65100] text-[#f4f0e8] text-xs font-display tracking-wider uppercase flex items-center gap-1.5 transition-colors"
            title={persona ? `Phong cách của bạn: ${persona.title}` : "Khám phá phong cách thời trang AI"}
          >
            <Compass size={14} className="text-[#e65100]" />
            <span className="hidden xl:inline">
              {persona ? persona.title.split(" ")[0] : "Style Quiz"}
            </span>
          </button>

          {/* AI Shopping Assistant Button */}
          <button
            onClick={openAiModal}
            className="min-h-[40px] px-3 bg-[rgba(230,81,0,0.1)] hover:bg-[rgba(230,81,0,0.2)] border border-[#e65100]/40 text-[#ff6d00] text-xs font-display tracking-wider uppercase flex items-center gap-1.5 transition-colors"
            title="Trợ lý mua sắm AI"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Trợ lý AI</span>
          </button>

          {/* In-App Notification Center */}
          <NotificationCenter />

          {/* Account Link or Menu */}
          {user ? (
            <div className="relative group">
              <Link
                to={user.role === "admin" ? "/admin" : "/profile"}
                className="min-h-[40px] px-2.5 text-xs text-[#f4f0e8] flex items-center gap-1.5 border border-transparent hover:border-[rgba(244,240,232,0.2)] py-1"
              >
                <User size={16} className="text-[#9a989f]" />
                <span className="hidden sm:inline font-mono text-[11px] max-w-[100px] truncate">
                  {user.fullName || user.email?.split("@")[0]}
                </span>
                {user.role === "admin" && (
                  <span className="px-1 text-[9px] bg-[#e65100] text-white uppercase font-bold">Admin</span>
                )}
              </Link>
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block w-44 bg-[#161619] border border-[rgba(244,240,232,0.15)] shadow-xl p-2 z-50">
                {user.role === "admin" && (
                  <Link to="/admin" className="block px-3 py-2 text-xs text-[#ff6d00] hover:bg-white/5 font-display uppercase tracking-wider">
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/profile" className="block px-3 py-2 text-xs text-[#f4f0e8] hover:bg-white/5 font-display uppercase tracking-wider">
                  Hồ Sơ Cá Nhân
                </Link>
                <Link to="/orders" className="block px-3 py-2 text-xs text-[#f4f0e8] hover:bg-white/5 font-display uppercase tracking-wider">
                  Đơn Hàng
                </Link>
                <Link to="/my-coupons" className="block px-3 py-2 text-xs text-[#f4f0e8] hover:bg-white/5 font-display uppercase tracking-wider">
                  Ví Voucher
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 font-display uppercase tracking-wider flex items-center gap-1 border-t border-white/5 mt-1"
                >
                  <LogOut size={12} /> Đăng Xuất
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="min-h-[40px] px-3 text-xs font-display tracking-wider text-[#f4f0e8] hover:text-[#e65100] flex items-center gap-1.5 uppercase"
            >
              <User size={16} />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </Link>
          )}

          {/* Cart Indicator */}
          <Link
            to="/cart"
            className="relative min-h-[40px] px-3 bg-[#161619] border border-[rgba(244,240,232,0.15)] hover:border-[#e65100] text-[#f4f0e8] flex items-center gap-2 transition-colors"
            title="Xem giỏ hàng"
          >
            <ShoppingBag size={16} className="text-[#e65100]" />
            <span className="text-xs font-mono font-semibold">{cartCount}</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden min-h-[40px] min-w-[40px] p-2 text-[#f4f0e8] flex items-center justify-center border border-[rgba(244,240,232,0.15)]"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0c0c0e] border-b border-[rgba(244,240,232,0.1)] px-4 py-6 space-y-4 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="flex items-center relative mb-4">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Tìm kiếm thiết kế..."
              className="w-full min-h-[44px] pl-9 pr-3 bg-[#161619] border border-[rgba(244,240,232,0.2)] text-sm text-[#f4f0e8]"
            />
            <Search className="absolute left-3 text-[#6b6973]" size={16} />
          </form>
          <div className="flex flex-col space-y-3 font-display uppercase tracking-wider text-sm">
            <button
              onClick={() => {
                closeMobileMenu();
                openQuiz();
              }}
              className="py-2 text-left border-b border-white/5 text-[#e65100] flex items-center gap-2"
            >
              <Compass size={16} />
              <span>AI Fashion Style Quiz</span>
            </button>
            <Link to="/products" onClick={closeMobileMenu} className="py-2 border-b border-white/5 text-[#f4f0e8]">
              Bộ Sưu Tập
            </Link>
            <Link to="/lookbooks" onClick={closeMobileMenu} className="py-2 border-b border-white/5 text-[#f4f0e8]">
              Lookbooks
            </Link>
            <Link to="/vouchers" onClick={closeMobileMenu} className="py-2 border-b border-white/5 text-[#f4f0e8]">
              Vouchers
            </Link>
            <Link to="/order-lookup" onClick={closeMobileMenu} className="py-2 border-b border-white/5 text-[#f4f0e8]">
              Tra Cứu Đơn
            </Link>
            <Link to="/favorites" onClick={closeMobileMenu} className="py-2 border-b border-white/5 text-[#f4f0e8]">
              Yêu Thích
            </Link>
            {user ? (
              <>
                <Link to="/profile" onClick={closeMobileMenu} className="py-2 text-[#ff6d00]">
                  Hồ Sơ: {user.fullName || user.email}
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={closeMobileMenu} className="py-2 text-[#e65100]">
                    Trang Quản Trị Admin
                  </Link>
                )}
                <button onClick={() => { logout(); closeMobileMenu(); }} className="text-left py-2 text-red-400">
                  Đăng Xuất
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="py-2 text-[#e65100]">
                Đăng Nhập / Đăng Ký
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
