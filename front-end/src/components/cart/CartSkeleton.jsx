import React from "react";

const CartSkeleton = () => {
  return (
    <div
      className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10"
      aria-busy="true"
      aria-label="Đang tải dữ liệu giỏ hàng"
    >
      <div className="mb-8 space-y-3 border-b border-border pb-6">
        <div className="h-3 w-36 animate-pulse bg-secondary" />
        <div className="h-10 w-64 animate-pulse bg-secondary" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="h-12 w-full animate-pulse border border-border bg-card" />
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex gap-4 border border-border bg-card p-5"
            >
              <div className="aspect-[3/4] w-24 shrink-0 animate-pulse bg-secondary" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-1/4 animate-pulse bg-secondary" />
                <div className="h-5 w-2/3 animate-pulse bg-secondary" />
                <div className="h-4 w-1/3 animate-pulse bg-secondary" />
                <div className="h-8 w-32 animate-pulse bg-secondary" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="h-36 animate-pulse border border-border bg-card" />
          <div className="h-72 animate-pulse border border-border bg-card" />
        </div>
      </div>
    </div>
  );
};

export default CartSkeleton;
