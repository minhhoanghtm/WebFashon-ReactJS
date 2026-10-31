import React from "react";
import { X, Calendar, Tag, ShieldAlert, Award } from "lucide-react";

const VoucherDetailModal = ({
  isOpen,
  onClose,
  voucher,
  onClaim,
  claimedList = [],
}) => {
  if (!isOpen || !voucher) return null;

  const isClaimed = claimedList.some((id) => id === voucher._id);
  const isExpired = new Date(voucher.endDate) < new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-detail-title"
    >
      <div className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] w-full max-w-md p-6 space-y-6 relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold">
            <Award className="h-4 w-4" aria-hidden="true" />
            <span id="voucher-detail-title">Chi tiết ưu đãi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết ưu đãi"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ticket Design */}
        <div className="bg-[var(--color-bg)] border border-dashed border-[var(--color-border)] p-5 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono font-semibold text-[var(--color-text)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 w-fit mx-auto uppercase tracking-widest">
              {voucher.code}
            </div>
            <h3 className="font-display text-xl font-semibold leading-tight">
              {voucher.name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {voucher.description ||
                "Không có mô tả bổ sung cho ưu đãi này."}
            </p>
          </div>

          <div className="border-t border-dashed border-[var(--color-border)] pt-4 space-y-3 text-xs">
            {/* Discount Value */}
            <div className="flex items-center gap-3">
              <Tag
                className="h-4 w-4 text-[var(--color-text-muted)] shrink-0"
                aria-hidden="true"
              />
              <div>
                <span className="text-[var(--color-text-muted)]">
                  Mức giảm giá:{" "}
                </span>
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  {voucher.discountType === "percentage"
                    ? `${voucher.discountValue}%`
                    : `${voucher.discountValue.toLocaleString("vi-VN")}đ`}
                </span>
                {voucher.discountType === "percentage" &&
                  voucher.maxDiscountAmount > 0 && (
                    <span className="text-[var(--color-text-muted)]">
                      {" "}
                      (Tối đa:{" "}
                      {voucher.maxDiscountAmount.toLocaleString("vi-VN")}đ)
                    </span>
                  )}
              </div>
            </div>

            {/* Min Order Value */}
            <div className="flex items-center gap-3">
              <ShieldAlert
                className="h-4 w-4 text-[var(--color-text-muted)] shrink-0"
                aria-hidden="true"
              />
              <div>
                <span className="text-[var(--color-text-muted)]">
                  Đơn tối thiểu:{" "}
                </span>
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  {voucher.minOrderValue > 0
                    ? `${voucher.minOrderValue.toLocaleString("vi-VN")}đ`
                    : "Không giới hạn"}
                </span>
              </div>
            </div>

            {/* Expire Dates */}
            <div className="flex items-start gap-3">
              <Calendar
                className="h-4 w-4 text-[var(--color-text-muted)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Bắt đầu:{" "}
                  </span>
                  <span className="font-mono">
                    {new Date(voucher.startDate).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Hết hạn:{" "}
                  </span>
                  <span className="font-mono font-semibold text-[var(--color-danger)]">
                    {new Date(voucher.endDate).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isExpired ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[48px] py-3 border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs uppercase tracking-[0.16em] font-medium cursor-not-allowed opacity-50"
            >
              Voucher đã hết hạn
            </button>
          ) : isClaimed ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[48px] py-3 border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] text-xs uppercase tracking-[0.16em] font-medium cursor-not-allowed"
            >
              Bạn đã sở hữu voucher này
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClaim(voucher._id);
                onClose();
              }}
              className="w-full min-h-[48px] py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Lưu voucher ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherDetailModal;
