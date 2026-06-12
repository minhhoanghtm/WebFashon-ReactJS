import React from "react";
import { Ticket } from "lucide-react";

const CouponManagement = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Khuyến mãi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Coming Soon Container */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 min-h-[350px]">
        {/* Icon Container */}
        <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
          <Ticket className="h-8 w-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold tracking-tight">Quản lý mã giảm giá</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tính năng quản lý mã giảm giá sẽ sớm ra mắt...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;
