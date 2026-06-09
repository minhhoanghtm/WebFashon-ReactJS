import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const cartCount = items.reduce((total, item) => total + (item.quantity || 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold tracking-tight text-indigo-600">
            WebFashion
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/products" className="text-sm font-medium hover:text-indigo-600 transition">
              Products
            </Link>
            <Link to="/cart" className="relative text-sm font-medium hover:text-indigo-600 transition">
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-sm font-medium hover:text-indigo-600 transition">
                  Profile
                </Link>
                {(user?.role === 'admin' || user?.data?.role === 'admin') && (
                  <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition">
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold hover:bg-gray-200 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
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
