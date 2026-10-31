import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ticket, X, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";
import { formatCurrency } from "@/utils/format";

const isShippingVoucher = (v) => {
  return (
    v.code?.toUpperCase().includes("SHIP") ||
    v.name?.toLowerCase().includes("vận chuyển") ||
    v.name?.toLowerCase().includes("ship")
  );
};

const CheckoutVoucherSelector = ({
  subtotal,
  items = [],
  shippingFee = 0,
  onApply,
  appliedVoucher,
  onRemove,
  voucherType = "product",
  label,
}) => {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem("accessToken");
  const isUserLoggedIn = isAuthenticated || Boolean(token);

  const [isOpen, setIsOpen] = useState(false);
  const [wallet, setWallet] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [validating, setValidating] = useState(false);

  const displayLabel =
    label ||
    (voucherType === "shipping"
      ? "Mã miễn phí vận chuyển"
      : "Mã giảm giá sản phẩm");
  const displayDesc =
    voucherType === "shipping"
      ? "Chọn từ ví hoặc nhập mã giảm phí vận chuyển"
      : "Chọn từ ví hoặc nhập mã ưu đãi thiết kế";
  const modalTitle =
    voucherType === "shipping"
      ? "Chọn Voucher Vận Chuyển"
      : "Chọn Voucher Sản Phẩm";

  useEffect(() => {
    if (!token || !isOpen) return;
    let isMounted = true;
    const loadWallet = async () => {
      try {
        setLoading(true);
        const res = await voucherApi.getUserWallet("CLAIMED");
        if (isMounted && res?.success && Array.isArray(res.data)) {
          setWallet(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải ví voucher của bạn.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadWallet();
    return () => {
      isMounted = false;
    };
  }, [isOpen, token, isUserLoggedIn]);

  const filteredWallet = wallet.filter((item) => {
    const v = item.voucherId;
    if (!v) return false;
    const isShip = isShippingVoucher(v);
    return voucherType === "shipping" ? isShip : !isShip;
  });

  const handleValidateAndApply = async (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (!uppercaseCode) {
      toast.warn("Vui lòng nhập mã giảm giá.");
      return;
    }

    const isShipInput = uppercaseCode.includes("SHIP");
    if (voucherType === "shipping" && !isShipInput) {
      toast.warn("Vui lòng nhập mã miễn phí vận chuyển.");
      return;
    }
    if (voucherType === "product" && isShipInput) {
      toast.warn("Vui lòng nhập mã giảm giá sản phẩm.");
      return;
    }

    try {
      setValidating(true);
      const res = await voucherApi.validateVoucher(
        uppercaseCode,
        subtotal,
        items,
        shippingFee
      );
      if (res?.success) {
        onApply(res.data);
        toast.success(`Đã áp dụng mã ${res.data.code}`);
        setInputCode("");
        setIsOpen(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện."
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSelectFromWallet = async (voucherCode) => {
    try {
      const res = await voucherApi.validateVoucher(
        voucherCode,
        subtotal,
        items,
        shippingFee
      );
      if (res?.success) {
        onApply(res.data);
        toast.success(`Đã áp dụng mã ${res.data.code}`);
        setIsOpen(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Voucher chưa đủ điều kiện áp dụng cho đơn hàng này."
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 border border-border bg-background p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Ticket size={16} strokeWidth={1.5} className="shrink-0 text-foreground" />
          {appliedVoucher ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {appliedVoucher.code}
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  -
                  {formatCurrency(
                    appliedVoucher.discountAmount ||
                      appliedVoucher.discount_amount ||
                      0
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {voucherType === "shipping"
                  ? "Ưu đãi phí vận chuyển"
                  : "Ưu đãi thiết kế thời trang"}
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {displayLabel}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {displayDesc}
              </p>
            </div>
          )}
        </div>

        {appliedVoucher ? (
          <button
            type="button"
            onClick={onRemove}
            className="touch-target shrink-0 px-2 text-xs font-semibold tracking-[0.12em] uppercase text-destructive hover:underline"
          >
            Gỡ bỏ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="touch-target shrink-0 px-2 text-xs font-semibold tracking-[0.12em] uppercase text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Chọn mã
          </button>
        )}
      </div>

      {/* Voucher Wallet Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col justify-between overflow-y-auto border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-foreground">
                <Ticket size={17} strokeWidth={1.5} />
                <h3 className="font-sans font-semibold text-xl">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="touch-target -mr-2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Đóng hộp thoại voucher"
              >
                <X size={18} />
              </button>
            </div>

            {/* Manual Code Entry */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Nhập mã giảm giá thủ công
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="VÍ DỤ: FASHION10"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="h-11 flex-1 border border-border bg-background px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleValidateAndApply(inputCode)}
                  disabled={validating || !inputCode.trim()}
                  className="touch-target inline-flex items-center gap-1.5 bg-primary px-5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {validating && <Loader2 size={14} className="animate-spin" />}
                  <span>Áp dụng</span>
                </button>
              </div>
            </div>

            {/* Saved Wallet Vouchers */}
            <div className="space-y-3">
              <h4 className="border-b border-border pb-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Ví voucher đã lưu
              </h4>

              {!isUserLoggedIn ? (
                <div className="border border-border bg-background p-6 text-center space-y-3">
                  <AlertCircle
                    size={24}
                    className="mx-auto text-muted-foreground"
                  />
                  <p className="text-xs font-semibold text-foreground">
                    Đăng nhập để sử dụng ví voucher cá nhân
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Các mã giảm giá bạn thu thập sẽ hiển thị tại đây.
                  </p>
                  <Link
                    to="/login"
                    className="touch-target inline-flex items-center justify-center bg-primary px-6 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={22}
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              ) : filteredWallet.length === 0 ? (
                <div className="border border-border bg-background p-6 text-center space-y-2">
                  <AlertCircle
                    size={24}
                    className="mx-auto text-muted-foreground"
                  />
                  <p className="text-xs font-semibold text-foreground">
                    Chưa có voucher phù hợp trong ví
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Bạn có thể săn thêm mã tại trang Ưu đãi của Atelier.
                  </p>
                </div>
              ) : (
                <div className="max-h-[38vh] space-y-2.5 overflow-y-auto pr-1">
                  {filteredWallet.map((item) => {
                    const v = item.voucherId;
                    if (!v) return null;

                    const isApplicable = subtotal >= (v.minOrderValue || 0);
                    const isSelected =
                      appliedVoucher && appliedVoucher.code === v.code;

                    return (
                      <div
                        key={item._id}
                        onClick={() => {
                          if (isApplicable) {
                            handleSelectFromWallet(v.code);
                          } else {
                            toast.warn(
                              `Voucher yêu cầu đơn tối thiểu ${formatCurrency(
                                v.minOrderValue
                              )} (Hiện tại: ${formatCurrency(subtotal)})`
                            );
                          }
                        }}
                        className={`flex items-center justify-between gap-3 border p-3.5 transition-colors ${
                          isSelected
                            ? "border-foreground bg-secondary"
                            : isApplicable
                            ? "cursor-pointer border-border bg-background hover:border-foreground"
                            : "cursor-not-allowed border-border/60 bg-secondary/30 opacity-50"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {v.code}
                            </span>
                            <span className="border border-border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                              {v.discountType === "percentage"
                                ? `Giảm ${v.discountValue}%`
                                : `Giảm ${formatCurrency(v.discountValue)}`}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {v.name}
                          </p>
                          <p className="text-[10px] tabular-nums text-muted-foreground">
                            Đơn tối thiểu:{" "}
                            {v.minOrderValue > 0
                              ? formatCurrency(v.minOrderValue)
                              : "0 ₫"}
                            {v.discountType === "percentage" &&
                              v.maxDiscountAmount > 0 &&
                              ` · Tối đa: ${formatCurrency(
                                v.maxDiscountAmount
                              )}`}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="inline-flex h-7 w-7 items-center justify-center bg-primary text-primary-foreground">
                              <Check size={14} />
                            </span>
                          ) : isApplicable ? (
                            <span className="inline-block border border-foreground px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-foreground">
                              Dùng
                            </span>
                          ) : (
                            <span className="inline-block border border-border px-2 py-1 text-[10px] text-muted-foreground">
                              Chưa đủ ĐK
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
