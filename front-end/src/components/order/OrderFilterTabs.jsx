import React from "react";

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "confirmed", label: "Chờ lấy hàng" },
  { id: "shipping", label: "Chờ giao hàng" },
  { id: "delivered", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "refunded", label: "Trả hàng / Hoàn tiền" },
];

const OrderFilterTabs = ({ activeTab, onTabChange }) => {
  return (
    <div
      className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-20 z-10"
      role="tablist"
      aria-label="Lọc đơn hàng theo trạng thái"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`min-h-[48px] px-3 py-3 text-xs uppercase tracking-[0.14em] border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "border-[var(--color-text)] text-[var(--color-text)] font-semibold"
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderFilterTabs;
