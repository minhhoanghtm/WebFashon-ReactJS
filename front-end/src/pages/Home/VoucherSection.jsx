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

  const fallbackVouchers = [
    {
      _id: "v-welcome-15",
      code: "ATELIER15",
      name: "Ưu đãi 15% Khách hàng Mới",
      description: "Giảm 15% cho đơn hàng đầu tiên từ 500.000₫",
      discountType: "percentage",
      discountValue: 15,
      minOrderValue: 500000,
      remainingQuantity: 65,
      totalQuantity: 100,
    },
    {
      _id: "v-freeship-all",
      code: "FREESHIP",
      name: "Miễn phí Giao hàng Toàn quốc",
      description: "Miễn phí vận chuyển cho đơn hàng từ 800.000₫",
      discountType: "fixed",
      discountValue: 40000,
      minOrderValue: 800000,
      remainingQuantity: 82,
      totalQuantity: 100,
    },
    {
      _id: "v-vip-100k",
      code: "LUXE100",
      name: "Voucher VIP Giảm 100K",
      description: "Giảm 100.000₫ cho đơn hàng từ 1.500.000₫",
      discountType: "fixed",
      discountValue: 100000,
      minOrderValue: 1500000,
      remainingQuantity: 35,
      totalQuantity: 100,
    },
  ];

  const displayVouchers = vouchers.length > 0 ? vouchers : fallbackVouchers;

  return (
    <section className="home-section home-vouchers mt-12 pt-10 border-t border-black/5">
      <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6">
        <SectionHeader
          eyebrow="Khuyến mãi đặc biệt"
          title="Voucher Hot Hôm Nay"
          subtitle="Nhận ngay mã giảm giá độc quyền cho trải nghiệm mua sắm đẳng cấp"
        />
        <Link
          to="/vouchers"
          className="text-xs font-bold text-amber-800 hover:text-amber-900 transition flex items-center gap-1 group"
        >
          <span>Xem tất cả voucher</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayVouchers.map((v) => {
            const isClaimed = claimedIds.includes(v._id);
            const percentRemaining = Math.round((v.remainingQuantity / v.totalQuantity) * 100);

            return (
              <div
                key={v._id}
                className="group relative bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[175px]"
              >
                {/* Left & Right ticket notches */}
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#FCFAF7] border border-neutral-200 z-10"></div>
                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#FCFAF7] border border-neutral-200 z-10"></div>

                <div className="flex gap-3.5">
                  <div className="h-11 w-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-800 shrink-0 border border-amber-200/50">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                      {v.code}
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 truncate mt-1.5 font-heading">
                      {v.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                      {v.description || `Giảm ${v.discountType === "percentage" ? `${v.discountValue}%` : `${v.discountValue?.toLocaleString("vi-VN")}đ`}`}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Đơn tối thiểu: {v.minOrderValue?.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
                      <span>Số lượng còn lại</span>
                      <span className="text-amber-800 font-bold">{percentRemaining}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentRemaining}%` }}
                      ></div>
                    </div>
                  </div>

                  {isClaimed ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200/60 whitespace-nowrap cursor-default"
                    >
                      Đã lưu ví
                    </button>
                  ) : (
                    <button
                      onClick={() => onClaim(v._id)}
                      className="px-4 py-1.5 bg-[#18181B] hover:bg-neutral-800 text-white text-[10px] font-bold rounded-lg shadow-sm hover:scale-103 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Lưu mã
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
