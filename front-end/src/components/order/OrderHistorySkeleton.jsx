import React from "react";

const OrderHistorySkeleton = () => {
  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      aria-busy="true"
      aria-label="Đang tải danh sách đơn hàng"
    >
      <div className="mb-8 space-y-3">
        <div className="h-3 w-32 bg-[var(--color-border)] animate-pulse" />
        <div className="h-8 w-64 bg-[var(--color-border)] animate-pulse" />
      </div>

      <div className="mb-6 border-b border-[var(--color-border)] pb-3 flex gap-6 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="h-5 w-24 bg-[var(--color-border)] animate-pulse shrink-0"
          />
        ))}
      </div>

      <div className="mb-8">
        <div className="h-11 w-full bg-[var(--color-border)] animate-pulse" />
      </div>

      <div className="space-y-6">
        {[1, 2].map((cardIdx) => (
          <div
            key={cardIdx}
            className="border border-[var(--color-border)] p-6 bg-[var(--color-surface)] space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div className="h-4 w-48 bg-[var(--color-border)] animate-pulse" />
              <div className="h-5 w-24 bg-[var(--color-border)] animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((itemIdx) => (
                <div key={itemIdx} className="flex gap-4">
                  <div className="w-20 h-24 bg-[var(--color-border)] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-2/3 bg-[var(--color-border)] animate-pulse" />
                    <div className="h-3 w-1/4 bg-[var(--color-border)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistorySkeleton;
