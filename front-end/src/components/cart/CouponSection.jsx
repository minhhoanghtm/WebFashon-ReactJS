import React from "react";
import { Ticket, X, Loader2 } from "lucide-react";

const CouponSection = ({
  couponCode,
  setCouponCode,
  appliedCoupon,
  onApplyCoupon,
  onCancelCoupon,
  couponError,
  isValidating,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!couponCode.trim() || isValidating) return;
    onApplyCoupon(couponCode);
  };

  return (
    <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 text-left transition-all duration-300">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Ticket className="h-4.5 w-4.5 text-blue-500" />
        <span>Mã giảm giá (Voucher)</span>
      </div>

      {appliedCoupon ? (
        /* Coupon applied state */
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50 rounded-xl p-3.5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <span className="inline-block bg-green-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              {appliedCoupon.code}
            </span>
            <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
              Đã giảm:{" "}
              {appliedCoupon.discount_type === "percentage"
                ? `-${appliedCoupon.discount_value}% (-${appliedCoupon.discount_amount.toLocaleString()}đ)`
                : `-${appliedCoupon.discount_amount.toLocaleString()}đ`}
            </p>
          </div>
          <button
            onClick={onCancelCoupon}
            className="p-1 rounded-lg text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40 transition cursor-pointer"
            title="Hủy áp dụng"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      ) : (
        /* Form input state */
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 uppercase font-mono tracking-wider"
              disabled={isValidating}
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || isValidating}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Áp dụng"
              )}
            </button>
          </div>
          {couponError && (
            <p className="text-red-500 dark:text-red-400 text-xs font-semibold animate-in slide-in-from-top-1">
              {couponError}
            </p>
          )}
        </form>
      )}

      {/* Suggested active vouchers list for user convenience */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Gợi ý mã có sẵn:
        </span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          <button
            onClick={() => setCouponCode("WELCOME10")}
            className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded hover:bg-blue-100 transition"
          >
            WELCOME10 (giảm 10%)
          </button>
          <button
            onClick={() => setCouponCode("LUSTRA50K")}
            className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded hover:bg-blue-100 transition"
          >
            LUSTRA50K (-50k)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponSection;
