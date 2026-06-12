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
    <div className="w-full border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-8 overflow-x-auto scrollbar-none py-1 -mb-[1px]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                  isActive
                    ? "border-black text-black font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
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
