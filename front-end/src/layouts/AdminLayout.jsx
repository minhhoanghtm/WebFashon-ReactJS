import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AdminHeader from '../components/admin/ui/AdminHeader';
import AdminProfileModal from '../components/admin/ui/AdminProfileModal';
import AdminPasswordModal from '../components/admin/ui/AdminPasswordModal';
import { useAuthStore } from '@/store/auth.store';
import { getAdminConversationsService } from '@/services/chat.service';
import { io } from 'socket.io-client';
import { ENV } from '@/config/env';
import { tokenStorage } from '@/utils/token';

const AdminLayout = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'light';
  });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const mainRef = useRef(null);
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    const timer = setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Sync theme with document element
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

  // Socket for real-time chat alerts
  const socketUrl = useMemo(() => {
    return ENV.API_BASE_URL.replace('/api', '');
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchCount = async () => {
      const isAuthorized = user?.role === 'admin' || user?.role === 'staff';
      if (!isAuthorized) return;
      try {
        const res = await getAdminConversationsService({
          status: 'waiting_admin',
          limit: 100,
          type: 'support',
        });
        if (!ignore) {
          setUnreadCount(res?.total || res?.items?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching unread chat count:', error);
      }
    };
    fetchCount();
    return () => {
      ignore = true;
    };
  }, [user, pathname]);

  useEffect(() => {
    const isAuthorized = user?.role === 'admin' || user?.role === 'staff';
    if (!isAuthorized) return;

    const token = tokenStorage.getToken();
    if (!token) return;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    const refreshUnread = async () => {
      try {
        const res = await getAdminConversationsService({
          status: 'waiting_admin',
          limit: 100,
          type: 'support',
        });
        setUnreadCount(res?.total || res?.items?.length || 0);
      } catch (error) {
        console.error('Error updating unread count:', error);
      }
    };

    socket.on('message:new', () => {
      refreshUnread();
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.once('connect', () => {
          socket.disconnect();
        });
      }
    };
  }, [user, socketUrl]);

  return (
    <div className="admin-shell flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadCount={unreadCount}
      />

      {/* Main Wrapper */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Header */}
        <AdminHeader
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
          collapsed={collapsed}
          unreadChatsCount={unreadCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        />

        {/* Content Area */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-[1600px] w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Profile & Password Modals */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
