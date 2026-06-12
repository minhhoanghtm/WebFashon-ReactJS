import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const EmptyCart = () => {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center space-y-6 flex flex-col items-center">
      {/* Icon Container */}
      <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
        <ShoppingBag className="h-12 w-12" />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Hãy khám phá các sản phẩm thời trang cao cấp và mới nhất của chúng tôi để lấp đầy giỏ hàng của bạn.
        </p>
      </div>

      {/* Shop Link */}
      <Link
        to="/products"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-8 py-3 text-sm font-semibold shadow-md transition-all duration-200"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
};

export default EmptyCart;
