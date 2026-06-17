import React from "react";
import { Link } from "react-router-dom";
import { Ticket, Loader2 } from "lucide-react";
import SectionHeader from "./SectionHeader";

const VoucherSection = ({
  vouchers = [],
  claimedIds = [],
  loading = false,
  onClaim,
  homeSearchTerm = "",
}) => {
  // If the user has entered a search keyword, do not render vouchers on homepage
  if (homeSearchTerm) return null;

  return (
    <section className="home-section home-vouchers mt-8 pt-12 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6">
        <SectionHeader
          eyebrow="Khuyến mãi đặc biệt"
          title="Voucher Hot Hôm Nay"
          subtitle="Nhận ngay ưu đãi đặc biệt trước khi mua sắm"
        />
        <Link
          to="/vouchers"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 transition cursor-pointer"
        >
          Xem tất cả voucher &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
          <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Hiện chưa có voucher hot công khai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vouchers.map((v) => {
            const isClaimed = claimedIds.includes(v._id);
            const percentRemaining = Math.round((v.remainingQuantity / v.totalQuantity) * 100);

            return (
              <div
                key={v._id}
                className="group relative bg-white border border-slate-150/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col justify-between overflow-hidden min-h-[175px]"
              >
                {/* Left & Right ticket notches */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-r border-slate-150 z-10"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-l border-slate-150 z-10"></div>

                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                    <Ticket className="h-5.5 w-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                      {v.code}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1.5">
                      {v.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {v.description || `Giảm ${v.discountType === "percentage" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}đ`}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Đơn tối thiểu: {v.minOrderValue.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                      <span>Còn lại {percentRemaining}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentRemaining}%` }}
                      ></div>
                    </div>
                  </div>

                  {isClaimed ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg cursor-not-allowed border border-emerald-100/50 whitespace-nowrap"
                    >
                      Đã Lưu
                    </button>
                  ) : (
                    <button
                      onClick={() => onClaim(v._id)}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold rounded-lg shadow-sm hover:scale-102 transition duration-200 cursor-pointer whitespace-nowrap"
                    >
                      Lưu Mã
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default VoucherSection;
