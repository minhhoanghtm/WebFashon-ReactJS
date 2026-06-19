import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Moon, Sun } from 'lucide-react';

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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 transition-colors duration-300 dark:bg-[#0b0f19] dark:text-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end border-b border-slate-200/70 bg-slate-50/90 px-6 backdrop-blur dark:border-slate-800/80 dark:bg-[#0b0f19]/90">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-[#1a1f2e]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {theme === 'dark' ? 'Tối' : 'Sáng'}
            </span>
            <button
              onClick={toggleTheme}
              className={`relative flex h-7 w-14 cursor-pointer items-center rounded-full px-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${
                theme === 'dark'
                  ? 'border border-blue-500 bg-blue-600'
                  : 'border border-slate-300 bg-slate-200'
              }`}
              aria-label="Toggle Theme"
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="h-3 w-3 fill-blue-600 text-blue-600" />
                ) : (
                  <Sun className="h-3 w-3 fill-amber-500 text-amber-500" />
                )}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
