import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [homeSearchTerm, setHomeSearchTerm] = useState('');
  const navigate = useNavigate();
  const cartCount = items.reduce((total, item) => total + (item.quantity || 0), 0);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="shrink-0 text-lg font-bold tracking-tight text-indigo-600 lg:text-2xl"
          >
            WebFashion
          </Link>

          <form
            className="relative hidden min-w-0 max-w-md flex-1 items-center sm:flex"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Search
              size={18}
              className="pointer-events-none absolute left-4 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={homeSearchTerm}
              onChange={(event) => setHomeSearchTerm(event.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm sản phẩm"
              className="h-11 w-full rounded-full border border-transparent bg-gray-100 py-2 pl-11 pr-10 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
            {homeSearchTerm && (
              <button
                type="button"
                onClick={() => setHomeSearchTerm('')}
                className="absolute right-3 rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </form>

          <nav className="ml-auto flex shrink-0 items-center gap-2 lg:gap-5">
            <Link to="/products" className="text-sm font-medium hover:text-indigo-600 transition">
              Sản phẩm
            </Link>
            <Link to="/vouchers" className="text-sm font-medium hover:text-indigo-600 transition">
              Voucher
            </Link>
            <Link to="/cart" className="relative text-sm font-medium hover:text-indigo-600 transition">
              Giỏ hàng
              {cartCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-sm font-medium hover:text-indigo-600 transition">
                  Đơn hàng
                </Link>
                <Link to="/profile" className="text-sm font-medium hover:text-indigo-600 transition">
                  Tài khoản
                </Link>
                {(user?.role === 'admin' || user?.data?.role === 'admin') && (
                  <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition">
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold hover:bg-gray-200 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>

        <form
          className="relative mx-4 mb-3 flex items-center sm:hidden"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={homeSearchTerm}
            onChange={(event) => setHomeSearchTerm(event.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Tìm kiếm sản phẩm"
            className="h-11 w-full rounded-full border border-transparent bg-gray-100 py-2 pl-11 pr-10 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100"
          />
          {homeSearchTerm && (
            <button
              type="button"
              onClick={() => setHomeSearchTerm('')}
              className="absolute right-3 rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet context={{ homeSearchTerm }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} WebFashion Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
