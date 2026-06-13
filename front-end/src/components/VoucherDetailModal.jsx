import React from "react";
import { X, Calendar, DollarSign, ShieldAlert, Award } from "lucide-react";

const VoucherDetailModal = ({ isOpen, onClose, voucher, onClaim, claimedList = [] }) => {
  if (!isOpen || !voucher) return null;

  const isClaimed = claimedList.some((id) => id === voucher._id);
  const isExpired = new Date(voucher.endDate) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative Background Circles to create a ticket notch style */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-6 w-6 rounded-full bg-slate-900/60 md:bg-gray-100 dark:bg-slate-950/80"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-6 w-6 rounded-full bg-slate-900/60 md:bg-gray-100 dark:bg-slate-950/80"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Award className="h-5 w-5" />
            <span>Chi tiết ưu đãi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ticket Design */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full w-fit mx-auto">
              {voucher.code}
            </div>
            <h3 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 leading-tight">
              {voucher.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {voucher.description || "Không có mô tả bổ sung cho ưu đãi này."}
            </p>
          </div>

          <div className="border-t border-dashed border-indigo-200 dark:border-indigo-900 pt-4 space-y-3">
            {/* Discount Value */}
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4.5 w-4.5 text-indigo-600" />
              <div>
                <span className="text-slate-500">Mức giảm giá: </span>
                <span className="font-extrabold text-indigo-600">
                  {voucher.discountType === "percentage" ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString("vi-VN")}đ`}
                </span>
                {voucher.discountType === "percentage" && voucher.maxDiscountAmount > 0 && (
                  <span className="text-xs text-slate-400"> (Tối đa: {voucher.maxDiscountAmount.toLocaleString("vi-VN")}đ)</span>
                )}
              </div>
            </div>

            {/* Min Order Value */}
            <div className="flex items-center gap-3 text-sm">
              <ShieldAlert className="h-4.5 w-4.5 text-indigo-600" />
              <div>
                <span className="text-slate-500">Giá trị đơn tối thiểu: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {voucher.minOrderValue > 0 ? `${voucher.minOrderValue.toLocaleString("vi-VN")}đ` : "Không giới hạn"}
                </span>
              </div>
            </div>

            {/* Expire Dates */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4.5 w-4.5 text-indigo-600" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <div>Bắt đầu: <span className="font-semibold">{new Date(voucher.startDate).toLocaleString("vi-VN")}</span></div>
                <div className="mt-0.5">Hết hạn: <span className="font-bold text-red-500">{new Date(voucher.endDate).toLocaleString("vi-VN")}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isExpired ? (
            <button
              disabled
              className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed text-center"
            >
              Voucher đã hết hạn
            </button>
          ) : isClaimed ? (
            <button
              disabled
              className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-100 dark:border-emerald-900 rounded-xl cursor-not-allowed text-center"
            >
              Bạn đã sở hữu voucher này
            </button>
          ) : (
            <button
              onClick={() => {
                onClaim(voucher._id);
                onClose();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer text-center"
            >
              Nhận voucher ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherDetailModal;
