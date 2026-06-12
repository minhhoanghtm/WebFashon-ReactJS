import React from "react";

const CartSkeleton = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 animate-pulse space-y-8">
      {/* Title skeleton */}
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>

      <div className="grid lg:grid-cols-12 lg:gap-x-12 items-start mt-8">
        {/* Left Column Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
              <div className="h-24 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-1/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0 space-y-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CartSkeleton;
