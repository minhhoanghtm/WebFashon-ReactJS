import React from "react";
import { Link } from "react-router-dom";
import { Ticket, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const CouponSection = ({
  couponCode,
  setCouponCode,
  appliedCoupon,
  appliedShippingCoupon,
  onApplyCoupon,
  onCancelCoupon,
  onCancelShippingCoupon,
  couponError,
  isValidating,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!couponCode.trim() || isValidating) return;
    onApplyCoupon(couponCode);
  };

  return (
    <div className="border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
          <Ticket size={15} strokeWidth={1.5} />
          <span>Mã ưu đãi (Voucher)</span>
        </div>
        <Link
          to="/vouchers"
          className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Săn mã ưu đãi
        </Link>
      </div>

      {/* Applied Coupons */}
      {(appliedCoupon || appliedShippingCoupon) && (
        <div className="space-y-2.5">
          {appliedCoupon && (
            <div className="flex items-center justify-between border border-foreground bg-secondary/60 px-3.5 py-2.5">
              <div className="space-y-0.5">
                <span className="inline-block bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase text-primary-foreground">
                  THIẾT KẾ · {appliedCoupon.code}
                </span>
                <p className="text-xs font-medium text-foreground tabular-nums">
                  Giảm:{" "}
                  {(appliedCoupon.discountType ||
                    appliedCoupon.discount_type) === "percentage"
                    ? `-${
                        appliedCoupon.discountValue ||
                        appliedCoupon.discount_value
                      }% (-${formatCurrency(
                        appliedCoupon.discountAmount ||
                          appliedCoupon.discount_amount ||
                          0
                      )})`
                    : `-${formatCurrency(
                        appliedCoupon.discountAmount ||
                          appliedCoupon.discount_amount ||
                          0
                      )}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelCoupon}
                className="touch-target -mr-2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Hủy mã giảm giá sản phẩm"
                title="Hủy áp dụng"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {appliedShippingCoupon && (
            <div className="flex items-center justify-between border border-foreground bg-secondary/60 px-3.5 py-2.5">
              <div className="space-y-0.5">
                <span className="inline-block border border-foreground px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase text-foreground">
                  VẬN CHUYỂN · {appliedShippingCoupon.code}
                </span>
                <p className="text-xs font-medium text-foreground tabular-nums">
                  Giảm phí vận chuyển: -
                  {formatCurrency(
                    appliedShippingCoupon.discountAmount ||
                      appliedShippingCoupon.discount_amount ||
                      0
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelShippingCoupon}
                className="touch-target -mr-2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Hủy mã miễn phí vận chuyển"
                title="Hủy áp dụng"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      {!appliedCoupon || !appliedShippingCoupon ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <label htmlFor="cart-coupon-input" className="sr-only">
              Nhập mã giảm giá
            </label>
            <input
              id="cart-coupon-input"
              type="text"
              placeholder="NHẬP MÃ VOUCHER..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={isValidating}
              className="h-11 min-w-0 flex-1 border border-border bg-background px-3.5 font-mono text-xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || isValidating}
              className="touch-target shrink-0 border border-foreground bg-primary px-5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isValidating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "Áp dụng"
              )}
            </button>
          </div>
          {couponError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {couponError}
            </p>
          )}
        </form>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Đã áp dụng tối đa 2 mã ưu đãi (1 mã sản phẩm & 1 mã vận chuyển).
        </p>
      )}
    </div>
  );
};

export default CouponSection;
