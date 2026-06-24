import React from "react";
import { CreditCard, Loader2 } from "lucide-react";

const CartSummary = ({
  subtotal,
  discount,
  shippingFee,
  total,
  onCheckout,
  isCheckingOut,
  selectedCount,
}) => {
  const formatPrice = (val) => {
    return val.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-left lg:sticky lg:top-24 transition-all duration-300">
      <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
        Tóm tắt đơn hàng
      </h3>

      <div className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span>Tạm tính ({selectedCount} sản phẩm)</span>
          <span className="text-slate-900 dark:text-slate-100">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Giảm giá</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Shipping Fee */}
        <div className="flex justify-between">
          <span>Phí vận chuyển</span>
          <span className="text-slate-900 dark:text-slate-100">
            {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
          </span>
        </div>

        {/* Total separator line */}
        <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

        {/* Grand Total */}
        <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
          <span>Tổng cộng</span>
          <span className="text-xl text-blue-600 dark:text-blue-400 font-semibold">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={onCheckout}
        disabled={selectedCount === 0 || isCheckingOut}
        className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4.5 w-4.5" />
            <span>Tiến hành thanh toán</span>
          </>
        )}
      </button>
      
      {selectedCount === 0 && (
        <p className="text-center text-xs text-red-500 dark:text-red-400 font-medium animate-pulse">
          Vui lòng chọn ít nhất một sản phẩm để thanh toán
        </p>
      )}
    </div>
  );
};

export default CartSummary;
