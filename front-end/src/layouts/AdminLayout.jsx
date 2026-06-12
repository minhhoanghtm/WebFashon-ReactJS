import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Sun, Moon } from 'lucide-react';

const AdminLayout = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Nút gạt sáng/tối */}
        <div className="absolute top-6 right-8 z-50 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? 'Tối' : 'Sáng'}
          </span>
          <button
            onClick={toggleTheme}
            className={`relative flex h-7 w-14 cursor-pointer items-center rounded-full px-0.5 transition-colors duration-300 focus:outline-none ${
              theme === 'dark'
                ? 'bg-blue-600 border border-blue-500'
                : 'bg-slate-300 border border-slate-400'
            }`}
            aria-label="Toggle Theme"
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="h-3 w-3 text-blue-600 fill-blue-600" />
              ) : (
                <Sun className="h-3 w-3 text-amber-500 fill-amber-500" />
              )}
            </div>
          </button>
        </div>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
