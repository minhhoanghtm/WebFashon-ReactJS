import React from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

const CartSummary = ({
  subtotal = 0,
  discount = 0,
  shippingFee = 0,
  total = 0,
  onCheckout,
  isCheckingOut = false,
  selectedCount = 0,
}) => {
  const formatPrice = (val) => {
    return (val || 0).toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5 text-left lg:sticky lg:top-24 transition-all">
      <h3 className="text-base font-extrabold border-b border-neutral-100 pb-3 text-neutral-900 uppercase tracking-wider text-xs">
        Tóm tắt đơn hàng
      </h3>

      <div className="space-y-3.5 text-xs text-neutral-600">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="font-medium">Tạm tính ({selectedCount} món)</span>
          <span className="text-neutral-900 font-bold tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 font-semibold">
            <span>Giảm giá khuyến mãi</span>
            <span className="tabular-nums">-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Shipping Fee */}
        <div className="flex justify-between items-center">
          <span className="font-medium">Phí vận chuyển</span>
          <span className="text-neutral-900 font-bold tabular-nums">
            {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
          </span>
        </div>

        {/* Total separator line */}
        <div className="border-t border-neutral-200/80 pt-3.5"></div>

        {/* Grand Total */}
        <div className="flex justify-between items-baseline text-neutral-900">
          <span className="text-xs font-bold uppercase tracking-wider">Tổng thanh toán</span>
          <span className="text-xl font-extrabold text-neutral-950 tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={selectedCount === 0 || isCheckingOut}
        className="w-full py-4 bg-[#05251C] hover:bg-[#073D2A] text-[#F5DD20] font-bold text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-95"
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang xử lý đơn...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            <span>Tiến hành thanh toán</span>
          </>
        )}
      </button>

      {selectedCount === 0 ? (
        <p className="text-center text-[11px] text-[#05251C] bg-[#F5DD20]/20 border border-[#F5DD20]/40 py-2 px-3 rounded-xl font-semibold">
          Vui lòng chọn ít nhất 1 sản phẩm để thanh toán
        </p>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Thanh toán an toàn & bảo mật 100%</span>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
