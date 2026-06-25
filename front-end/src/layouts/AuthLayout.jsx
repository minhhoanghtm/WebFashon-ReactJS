import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';

const AuthLayout = () => {
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "404Studio";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password') {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600">{siteName}</h1>
          <p className="mt-2 text-sm text-gray-500">Discover premium fashion tailored to you.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
