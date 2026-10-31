import React, { forwardRef } from "react";
import { MessageSquare, X } from "lucide-react";
import { useLocation } from "react-router-dom";

export const ChatLauncher = forwardRef(
  ({ isOpen, onToggle, unreadCount = 0, isOverlayActive = false }, ref) => {
    const location = useLocation();
    const isProductDetail = location.pathname.startsWith("/product/");

    // If a full-screen drawer or menu overlay is open, lower z-index or hide to prevent clash
    if (isOverlayActive) return null;

    // Mobile placement: lift above sticky bottom buy-bar on /product/:slug
    const positionClasses = isProductDetail
      ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-6"
      : "bottom-6 right-6";

    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "Đóng khung trò chuyện"
            : unreadCount > 0
            ? `Mở trò chuyện, có ${unreadCount} tin nhắn mới chưa đọc`
            : "Mở khung hỗ trợ trực tuyến"
        }
        className={`fixed z-40 ${positionClasses} flex h-14 w-14 items-center justify-center rounded-none bg-primary text-primary-foreground shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2`}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <MessageSquare className="h-6 w-6 transition-transform duration-200" />
        )}

        {/* Unread badge for Support tab */}
        {!isOpen && unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center bg-destructive px-1 text-[11px] font-bold tabular-nums text-white shadow-md"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }
);

ChatLauncher.displayName = "ChatLauncher";
export default ChatLauncher;
