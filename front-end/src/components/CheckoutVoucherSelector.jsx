import React, { useState, useEffect } from "react";
import { Ticket, X, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";

const CheckoutVoucherSelector = ({ subtotal, items = [], shippingFee = 0, onApply, appliedVoucher, onRemove, voucherType = "product", label }) => {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem("accessToken");
  const isUserLoggedIn = isAuthenticated || !!token;
  const [isOpen, setIsOpen] = useState(false);
  const [wallet, setWallet] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Input code state
  const [inputCode, setInputCode] = useState("");
  const [validating, setValidating] = useState(false);

  const displayLabel = label || (voucherType === "shipping" ? "Voucher vận chuyển" : "Voucher sản phẩm");
  const displayDesc = voucherType === "shipping" ? "Chọn hoặc nhập mã để giảm phí vận chuyển" : "Chọn hoặc nhập mã giảm giá để nhận chiết khấu";
  const modalTitle = voucherType === "shipping" ? "Chọn Voucher Vận Chuyển" : "Chọn Voucher Sản Phẩm";

  const fetchWallet = async () => {
    if (!token || !isOpen) return;
    try {
      setLoading(true);
      const res = await voucherApi.getUserWallet("CLAIMED");
      if (res.success) {
        setWallet(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải ví voucher của bạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [isOpen, isUserLoggedIn]);

  const isShippingVoucher = (v) => {
    return v.code?.toUpperCase().includes("SHIP") || v.name?.toLowerCase().includes("vận chuyển") || v.name?.toLowerCase().includes("ship");
  };

  const filteredWallet = wallet.filter((item) => {
    const v = item.voucherId;
    if (!v) return false;
    const isShip = isShippingVoucher(v);
    return voucherType === "shipping" ? isShip : !isShip;
  });

  const handleValidateAndApply = async (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (!uppercaseCode) {
      toast.warn("Vui lòng nhập mã giảm giá");
      return;
    }

    const isShipInput = uppercaseCode.includes("SHIP");
    if (voucherType === "shipping" && !isShipInput) {
      toast.warn("Vui lòng nhập mã miễn phí vận chuyển");
      return;
    }
    if (voucherType === "product" && isShipInput) {
      toast.warn("Vui lòng nhập mã giảm giá sản phẩm");
      return;
    }

    try {
      setValidating(true);
      const res = await voucherApi.validateVoucher(uppercaseCode, subtotal, items, shippingFee);
      if (res.success) {
        onApply(res.data);
        toast.success(`Đã áp dụng mã giảm giá ${res.data.code}`);
        setInputCode("");
        setIsOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Mã giảm giá không hợp lệ hoặc không đủ điều kiện");
    } finally {
      setValidating(false);
    }
  };

  const handleSelectFromWallet = async (voucherCode) => {
    try {
      const res = await voucherApi.validateVoucher(voucherCode, subtotal, items, shippingFee);
      if (res.success) {
        onApply(res.data);
        toast.success(`Đã áp dụng mã giảm giá ${res.data.code}`);
        setIsOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Voucher không đủ điều kiện áp dụng cho đơn hàng này");
    }
  };

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex justify-between items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-xl shadow-[0_2px_8px_-2px_rgba(28,25,23,0.04)]">
        <div className="flex items-center gap-3">
          <Ticket className="h-5 w-5 text-amber-700 dark:text-amber-500" />
          {appliedVoucher ? (
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${voucherType === "shipping" ? "text-stone-800 bg-stone-100 dark:bg-stone-800 dark:text-stone-200" : "text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                  {appliedVoucher.code}
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-300 font-semibold tabular-nums">
                  Giảm: -{(appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">{voucherType === "shipping" ? "Voucher vận chuyển" : "Ưu đãi thời trang áp dụng"}</p>
            </div>
          ) : (
            <div>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {displayLabel}
              </span>
              <p className="text-xs text-stone-500">{displayDesc}</p>
            </div>
          )}
        </div>

        {appliedVoucher ? (
          <button
            onClick={onRemove}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
          >
            Gỡ bỏ
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs font-semibold text-neutral-900 dark:text-white underline underline-offset-4 hover:text-amber-700 transition cursor-pointer"
          >
            Chọn voucher
          </button>
        )}
      </div>

      {/* Select Voucher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold tracking-tight">
                <Ticket className="h-5 w-5 text-amber-700" />
                <span className="font-serif text-lg">{modalTitle}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Manual Code Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Nhập mã giảm giá thủ công
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: FASHION10"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono font-bold"
                />
                <button
                  onClick={() => handleValidateAndApply(inputCode)}
                  disabled={validating || !inputCode.trim()}
                  className="px-5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  {validating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Áp Dụng</span>
                </button>
              </div>
            </div>

            {/* Wallet list */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800 pb-1.5">
                Ví voucher của bạn
              </h4>

              {!isUserLoggedIn ? (
                <div className="text-center py-8 space-y-3">
                  <AlertCircle className="h-8 w-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">Đăng nhập để xem ví voucher của bạn</p>
                  <p className="text-[11px] text-stone-500">Bạn có thể thu thập các voucher giảm giá độc quyền vào tài khoản</p>
                  <a
                    href="/login"
                    className="inline-block mt-1 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Đăng nhập ngay
                  </a>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
                </div>
              ) : filteredWallet.length === 0 ? (
                <div className="text-center py-8 space-y-1.5">
                  <AlertCircle className="h-8 w-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">Ví voucher của bạn chưa có mã phù hợp</p>
                  <p className="text-[11px] text-stone-400">Khám phá trang Ưu đãi để thu thập thêm nhiều mã giảm giá!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {filteredWallet.map((item) => {
                    const v = item.voucherId;
                    if (!v) return null;
                    
                    const isApplicable = subtotal >= v.minOrderValue;
                    const isSelected = appliedVoucher && appliedVoucher.code === v.code;

                    return (
                      <div
                        key={item._id}
                        onClick={() => {
                          if (isApplicable) {
                            handleSelectFromWallet(v.code);
                          } else {
                            toast.warn(`Voucher yêu cầu đơn tối thiểu ${v.minOrderValue.toLocaleString("vi-VN")}đ (Đơn hiện tại: ${subtotal.toLocaleString("vi-VN")}đ)`);
                          }
                        }}
                        className={`group relative border rounded-xl p-3.5 flex justify-between items-center transition cursor-pointer overflow-hidden ${
                          isSelected
                            ? "border-neutral-900 bg-stone-50 dark:bg-stone-800/80 shadow-sm"
                            : isApplicable
                            ? "border-stone-200 hover:border-stone-400 hover:bg-stone-50/50"
                            : "border-stone-100 opacity-50 bg-stone-50/50 cursor-not-allowed"
                        }`}
                      >
                        {/* Circle notches */}
                        <div className="absolute -left-2 h-4 w-4 rounded-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 z-10"></div>
                        <div className="absolute -right-2 h-4 w-4 rounded-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 z-10"></div>

                        <div className="flex gap-3 pl-2 pr-4">
                          <div className="h-10 w-10 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-amber-700 dark:text-amber-500 shrink-0">
                            <Ticket className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-stone-900 dark:text-white">
                                {v.code}
                              </span>
                              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                {v.discountType === "percentage" ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString("vi-VN")}đ`}
                              </span>
                            </div>
                            <h5 className="text-xs font-medium text-stone-700 dark:text-stone-300 line-clamp-1 mt-0.5">
                              {v.name}
                            </h5>
                            <p className="text-[10px] text-stone-500 tabular-nums">
                              Đơn tối thiểu: {v.minOrderValue > 0 ? `${v.minOrderValue.toLocaleString("vi-VN")}đ` : "0đ"}
                              {v.discountType === "percentage" && v.maxDiscountAmount > 0 && ` | Tối đa: ${v.maxDiscountAmount.toLocaleString("vi-VN")}đ`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 z-10 pr-2">
                          {isSelected ? (
                            <div className="h-6 w-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : isApplicable ? (
                            <button className="px-3 py-1 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition">
                              Dùng
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                              Chưa đủ đ/k
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutVoucherSelector;
