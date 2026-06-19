import React, { useState, useEffect } from "react";
import { Ticket, X, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";

const CheckoutVoucherSelector = ({ subtotal, items = [], shippingFee = 0, onApply, appliedVoucher, onRemove, voucherType = "product", label }) => {
  const { isAuthenticated } = useAuthStore();
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
    if (!isAuthenticated || !isOpen) return;
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
  }, [isOpen, isAuthenticated]);

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

  if (!isAuthenticated) return null;

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Ticket className="h-5.5 w-5.5 text-indigo-650" />
          {appliedVoucher ? (
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${voucherType === "shipping" ? "text-blue-650 bg-blue-50" : "text-indigo-650 bg-indigo-50"}`}>
                  {appliedVoucher.code}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Giảm: -{(appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{voucherType === "shipping" ? "Voucher vận chuyển" : "Voucher khuyến mãi PetShop"}</p>
            </div>
          ) : (
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-250">
                {displayLabel}
              </span>
              <p className="text-xs text-slate-400">{displayDesc}</p>
            </div>
          )}
        </div>

        {appliedVoucher ? (
          <button
            onClick={onRemove}
            className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
          >
            Hủy dùng
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition cursor-pointer"
          >
            Chọn Voucher
          </button>
        )}
      </div>

      {/* Select Voucher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-650 font-bold">
                <Ticket className="h-5 w-5" />
                <span>{modalTitle}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Manual Code Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nhập mã giảm giá thủ công
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập code. Ví dụ: WELCOME10"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
                <button
                  onClick={() => handleValidateAndApply(inputCode)}
                  disabled={validating || !inputCode.trim()}
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  {validating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Áp Dụng</span>
                </button>
              </div>
            </div>

            {/* Wallet list */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
                Ví voucher của bạn
              </h4>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                </div>
              ) : filteredWallet.length === 0 ? (
                <div className="text-center py-10 space-y-1.5">
                  <AlertCircle className="h-8 w-8 text-slate-350 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">Ví voucher của bạn trống</p>
                  <p className="text-[10px] text-slate-450">Vui lòng truy cập trang Săn Voucher để nạp thêm mã!</p>
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
                        className={`group relative border rounded-xl p-3 flex justify-between items-center transition cursor-pointer overflow-hidden ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/20"
                            : isApplicable
                            ? "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/20"
                            : "border-slate-100 opacity-60 bg-slate-50/50 cursor-not-allowed"
                        }`}
                      >
                        {/* Circle notches */}
                        <div className="absolute -left-2 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10"></div>
                        <div className="absolute -right-2 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-10"></div>

                        <div className="flex gap-3 pl-2 pr-4">
                          <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                            <Ticket className="h-5.5 w-5.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold text-indigo-600">
                                {v.code}
                              </span>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                {v.discountType === "percentage" ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString("vi-VN")}đ`}
                              </span>
                            </div>
                            <h5 className="text-xs font-semibold text-slate-650 dark:text-slate-300 line-clamp-1 mt-0.5">
                              {v.name}
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Đơn tối thiểu: {v.minOrderValue > 0 ? `${v.minOrderValue.toLocaleString("vi-VN")}đ` : "0đ"}
                              {v.discountType === "percentage" && v.maxDiscountAmount > 0 && ` | Tối đa: ${v.maxDiscountAmount.toLocaleString("vi-VN")}đ`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 z-10 pr-2">
                          {isSelected ? (
                            <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                              <Check className="h-4.5 w-4.5" />
                            </div>
                          ) : isApplicable ? (
                            <button className="px-3 py-1 border border-indigo-600 text-indigo-650 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold transition">
                              Dùng
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
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
