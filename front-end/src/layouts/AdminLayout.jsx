import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "@/components/layout/Sidebar";
import {
  AdminHeader,
  AdminProfileModal,
  AdminPasswordModal,
} from "@/components/admin/ui";
import { ENV } from "@/config/env";
import { getAdminConversationsService } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth.store";

const getSocketBaseUrl = (apiUrl) => {
  try {
    const parsed = new URL(apiUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return apiUrl.replace(/\/api\/v\d+\/?$/, "");
  }
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("webfashion_theme") ||
        localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }
    return "light";
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { isAuthenticated, user } = useAuthStore();
  const { pathname } = useLocation();

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("webfashion_theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const fetchUnreadChats = useCallback(async () => {
    await Promise.resolve();
    if (!isAuthenticated || user?.role !== "admin") return;
    try {
      const res = await getAdminConversationsService();
      if (res?.success && Array.isArray(res.data)) {
        const total = res.data.reduce(
          (sum, c) => sum + (c.unreadByAdmin || 0),
          0
        );
        setUnreadChatCount(total);
      }
    } catch {
      // ignore background polling error
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUnreadChats();
  }, [fetchUnreadChats, pathname]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated || user?.role !== "admin" || !token) return undefined;

    const socket = io(getSocketBaseUrl(ENV.API_URL), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("chat:conversation_updated", () => {
      fetchUnreadChats();
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, fetchUnreadChats]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text)] transition-colors duration-200">
      {/* Sidebar (Desktop Collapsible + Mobile Drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadChatCount={unreadChatCount}
      />

      {/* Main Content Shell */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onOpenPasswordModal={() => setPasswordModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AdminProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <AdminPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
