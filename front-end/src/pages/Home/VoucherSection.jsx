import React from "react";
import { Link } from "react-router-dom";
import { Ticket, Loader2, Check } from "lucide-react";
import { motion } from "motion/react";
import SectionHeader from "./SectionHeader";
import AnimatedSection from "../../components/motion/AnimatedSection";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";
import MagneticCTA from "../../components/motion/MagneticCTA";
import { motionEase } from "../../config/motionTokens";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const VoucherSection = ({
  vouchers = [],
  claimedIds = [],
  loading = false,
  onClaim,
  homeSearchTerm = "",
}) => {
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
    <AnimatedSection
      variant="fade-up"
      className="home-section home-vouchers mt-12 pt-10 border-t border-black/5"
    >
      <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6">
        <SectionHeader
          eyebrow="CHAPTER 05 · ĐẶC QUYỀN ƯU ĐÃI"
          title="Voucher Hot Hôm Nay"
          subtitle="Nhận ngay mã giảm giá độc quyền cho trải nghiệm mua sắm đẳng cấp"
        />
        <Link
          to="/vouchers"
          className="text-xs font-bold text-[#073D2A] hover:text-[#0E5A3E] transition flex items-center gap-1 group py-1"
        >
          <span>Xem tất cả voucher</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#073D2A]" />
        </div>
      ) : (
        <StaggerContainer
          staggerDelay={0.07}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {displayVouchers.map((v) => {
            const isClaimed = claimedIds.includes(v._id);
            const percentRemaining = Math.round((v.remainingQuantity / v.totalQuantity) * 100);

            return (
              <StaggerItem key={v._id}>
                <MotionDiv
                  whileHover={{
                    y: -6,
                    scale: 1.01,
                    transition: { duration: 0.28, ease: motionEase.editorialReveal },
                  }}
                  className="group relative bg-white border border-[#E8E5DF] hover:border-[#073D2A]/60 rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[180px]"
                >
                  {/* Subtle top sheen border accent on hover */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#073D2A]/0 to-transparent group-hover:via-[#073D2A]/80 transition-all duration-500" />

                  {/* Left & Right ticket notches */}
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#FBF9F5] border border-[#E8E5DF] z-10"></div>
                  <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#FBF9F5] border border-[#E8E5DF] z-10"></div>

                  <div className="flex gap-3.5">
                    <MotionDiv
                      whileHover={{ rotate: [-3, 3, 0] }}
                      transition={{ duration: 0.3 }}
                      className="h-11 w-11 bg-[#073D2A]/10 rounded-xl flex items-center justify-center text-[#073D2A] shrink-0 border border-[#073D2A]/25"
                    >
                      <Ticket className="h-5 w-5" />
                    </MotionDiv>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-black text-[#073D2A] bg-[#073D2A]/10 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                        {v.code}
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 truncate mt-1.5 font-heading">
                        {v.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {v.description ||
                          `Giảm ${
                            v.discountType === "percentage"
                              ? `${v.discountValue}%`
                              : `${v.discountValue?.toLocaleString("vi-VN")}đ`
                          }`}
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
                        <span className="text-[#073D2A] font-bold">{percentRemaining}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <MotionDiv
                          className="h-full bg-[#073D2A] rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentRemaining}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: motionEase.cinematic }}
                        />
                      </div>
                    </div>

                    {isClaimed ? (
                      <MotionButton
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [1, 1.12, 1] }}
                        disabled
                        className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200/60 whitespace-nowrap cursor-default inline-flex items-center gap-1 shadow-xs"
                      >
                        <Check size={12} className="stroke-[3]" />
                        <span>Đã lưu ví</span>
                      </MotionButton>
                    ) : (
                      <MagneticCTA strength={0.2} radius={50}>
                        <MotionButton
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => onClaim(v._id)}
                          className="px-4 py-1.5 bg-[#073D2A] hover:bg-[#0E5A3E] text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                        >
                          Lưu mã
                        </MotionButton>
                      </MagneticCTA>
                    )}
                  </div>
                </MotionDiv>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </AnimatedSection>
  );
};

export default VoucherSection;
