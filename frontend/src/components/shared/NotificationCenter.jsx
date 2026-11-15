import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Trash2, ShoppingBag, Tag, Info, Sparkles, X } from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "order" | "promo"
  const popoverRef = useRef(null);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "order") return item.type === "order";
    if (filter === "promo") return item.type === "promo";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <ShoppingBag size={15} className="text-[#e65100]" />;
      case "promo":
        return <Tag size={15} className="text-[#d4af37]" />;
      default:
        return <Sparkles size={15} className="text-emerald-400" />;
    }
  };

  const formatTime = (dateString) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
      if (diff < 60) return "Vừa xong";
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return `${Math.floor(diff / 86400)} ngày trước`;
    } catch {
      return "Gần đây";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        data-testid="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-h-[40px] min-w-[40px] px-2.5 text-[#f4f0e8] hover:text-[#e65100] flex items-center justify-center border border-transparent hover:border-[rgba(244,240,232,0.15)] transition-colors"
        title="Thông báo mới"
        aria-label="Trung tâm thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            data-testid="notif-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#e65100] text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-pulse"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          data-testid="notif-popover"
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] max-w-[95vw] bg-[#121215] border border-[rgba(244,240,232,0.2)] shadow-2xl z-50 animate-fade-in backdrop-blur-xl"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[rgba(244,240,232,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#e65100] inline-block" />
              <h3 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] font-bold">
                Thông Báo ({notifications.length})
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                data-testid="notif-mark-all-read"
                onClick={markAllAsRead}
                className="text-[11px] font-mono text-[#9a989f] hover:text-[#ff6d00] flex items-center gap-1 transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đã đọc hết</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-[rgba(244,240,232,0.08)] bg-[#0c0c0e]/60 px-3 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`py-2 px-2.5 font-display uppercase tracking-wider text-[11px] border-b-2 transition-all ${
                filter === "all"
                  ? "border-[#e65100] text-[#f4f0e8] font-semibold"
                  : "border-transparent text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilter("order")}
              className={`py-2 px-2.5 font-display uppercase tracking-wider text-[11px] border-b-2 transition-all ${
                filter === "order"
                  ? "border-[#e65100] text-[#f4f0e8] font-semibold"
                  : "border-transparent text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
            >
              Đơn Hàng
            </button>
            <button
              onClick={() => setFilter("promo")}
              className={`py-2 px-2.5 font-display uppercase tracking-wider text-[11px] border-b-2 transition-all ${
                filter === "promo"
                  ? "border-[#e65100] text-[#f4f0e8] font-semibold"
                  : "border-transparent text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
            >
              Ưu Đãi
            </button>
          </div>

          {/* List of items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[rgba(244,240,232,0.06)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#9a989f] space-y-2">
                <Info size={24} className="mx-auto text-[#6b6973]" />
                <p className="text-xs">Không có thông báo nào trong mục này.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 hover:bg-white/[0.03] transition-colors flex gap-3 items-start relative group ${
                    !notif.isRead ? "bg-[rgba(230,81,0,0.06)]" : ""
                  }`}
                >
                  <div className="mt-0.5 p-1.5 bg-[#161619] border border-[rgba(244,240,232,0.12)] shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <Link
                      to={notif.link || "#"}
                      onClick={() => {
                        markAsRead(notif.id);
                        setIsOpen(false);
                      }}
                      className="block"
                    >
                      <h4
                        className={`text-xs tracking-tight line-clamp-1 hover:text-[#e65100] transition-colors ${
                          !notif.isRead ? "font-bold text-[#f4f0e8]" : "text-[#9a989f]"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-[#8b8994] mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </Link>
                    <span className="text-[10px] font-mono text-[#6b6973] block mt-1.5">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => removeNotification(notif.id)}
                      className="p-1 text-[#6b6973] hover:text-red-400"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#0c0c0e] border-t border-[rgba(244,240,232,0.1)] text-center">
            <Link
              to="/orders"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-display uppercase tracking-widest text-[#ff6d00] hover:text-white transition-colors"
            >
              Theo dõi tình trạng đơn hàng &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
