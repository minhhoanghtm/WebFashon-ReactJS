import React from "react";
import { ArrowRight, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const FREE_SHIPPING_THRESHOLD = 1000000;

const CartSummary = ({
  subtotal = 0,
  discount = 0,
  shippingFee = 0,
  total = 0,
  onCheckout,
  isCheckingOut = false,
  selectedCount = 0,
  hasStockIssue = false,
}) => {
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShipProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return (
    <div className="border border-border bg-card p-6 space-y-5 lg:sticky lg:top-24">
      <div className="border-b border-border pb-4">
        <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
          WebFashion · Thanh toán
        </p>
        <h2 className="mt-1 font-sans text-2xl font-semibold tracking-tight text-foreground">
          Tóm tắt đơn hàng
        </h2>
      </div>

      {/* Free Shipping Progress Indicator */}
      {subtotal > 0 && (
        <div className="space-y-2 border border-border bg-secondary/40 p-3.5">
          <div className="flex items-center justify-between text-[11px]">
            {remainingForFreeShip === 0 ? (
              <span className="font-medium text-foreground">
                Đơn hàng đủ điều kiện miễn phí vận chuyển tiêu chuẩn.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Mua thêm{" "}
                <strong className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(remainingForFreeShip)}
                </strong>{" "}
                để được miễn phí vận chuyển.
              </span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {freeShipProgress}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden bg-border">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${freeShipProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Breakdown */}
      <dl className="space-y-3 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <dt>Tạm tính ({selectedCount} thiết kế)</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatCurrency(subtotal)}
          </dd>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-foreground">
            <dt className="font-medium">Ưu đãi Voucher</dt>
            <dd className="font-semibold tabular-nums">
              -{formatCurrency(discount)}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between text-muted-foreground">
          <dt>Phí vận chuyển tạm tính</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {subtotal === 0
              ? "0 ₫"
              : shippingFee === 0
              ? "Miễn phí"
              : formatCurrency(shippingFee)}
          </dd>
        </div>

        <div className="border-t border-border pt-4 flex items-baseline justify-between">
          <dt className="text-xs font-semibold tracking-[0.16em] uppercase text-foreground">
            Tổng thanh toán
          </dt>
          <dd className="font-sans text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(total)}
          </dd>
        </div>
      </dl>

      {hasStockIssue && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Một số sản phẩm đã chọn vượt quá tồn kho hoặc hết hàng. Vui lòng
            điều chỉnh số lượng trước khi thanh toán.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onCheckout}
        disabled={selectedCount === 0 || isCheckingOut || hasStockIssue}
        className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isCheckingOut ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <span>Tiến hành thanh toán</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>

      {selectedCount === 0 ? (
        <p className="border border-border bg-secondary/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
          Vui lòng chọn ít nhất 1 thiết kế trong giỏ để tiến hành đặt hàng.
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
          <ShieldCheck size={14} className="text-foreground" />
          <span>Giao dịch được mã hóa và bảo vệ tồn kho thời gian thực</span>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
