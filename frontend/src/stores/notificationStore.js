import { create } from "zustand";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Đơn hàng #WF-8892 đã được xác nhận",
    message: "Kiệt tác may đo của bạn đang được các nghệ nhân chuẩn bị và đóng gói thủ công.",
    type: "order",
    link: "/order-lookup",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    isRead: false,
  },
  {
    id: "notif-2",
    title: "Voucher VIP Giảm 250.000 ₫",
    message: "Mã VIPMEMBER đã sẵn sàng trong ví của bạn cho đơn hàng từ 2.000.000 ₫.",
    type: "promo",
    link: "/my-coupons",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    isRead: false,
  },
  {
    id: "notif-3",
    title: "Ra mắt Lookbook Thu Đông 2026",
    message: "Khám phá bản hòa tấu Monochrome Structure với các đường cắt kiến trúc mới nhất.",
    type: "system",
    link: "/lookbooks",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
  },
  {
    id: "notif-4",
    title: "Cảnh báo số lượng có hạn",
    message: "Áo Blazer Silk Satin trong danh sách yêu thích của bạn chỉ còn lại 2 chiếc.",
    type: "order",
    link: "/products",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: true,
  },
];

export const useNotificationStore = create((set, get) => ({
  notifications: JSON.parse(
    localStorage.getItem("webfashion_notifications") || JSON.stringify(INITIAL_NOTIFICATIONS)
  ),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem("webfashion_notifications", JSON.stringify(updated));
    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem("webfashion_notifications", JSON.stringify(updated));
    set({ notifications: updated });
  },

  removeNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    localStorage.setItem("webfashion_notifications", JSON.stringify(updated));
    set({ notifications: updated });
  },

  addNotification: (notification) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notification,
    };
    const updated = [newNotif, ...get().notifications];
    localStorage.setItem("webfashion_notifications", JSON.stringify(updated));
    set({ notifications: updated });
  },
}));
