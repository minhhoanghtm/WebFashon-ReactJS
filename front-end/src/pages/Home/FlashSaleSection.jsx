import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronRight, Clock, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import campaignApi from "@/api/campaignApi";
import useServerCountdown from "@/hooks/useServerCountdown";
import AnimatedSection from "@/components/motion/AnimatedSection";
import MagneticCTA from "@/components/motion/MagneticCTA";

const FlashSaleSection = ({ favoriteIds, onToggleFavorite }) => {
  const [activeFlashSale, setActiveFlashSale] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );
      const res = await Promise.race([
        campaignApi.getActiveCampaigns(),
        timeoutPromise,
      ]);
      if (res.data?.success && res.data?.data) {
        const { serverTime: sTime, campaigns = [] } = res.data.data;
        setServerTime(sTime);
        const flash = campaigns.find(
          (c) => c.type === "flash_sale" && c.products?.length > 0
        );
        setActiveFlashSale(flash || null);
      }
    } catch (err) {
      console.warn("Lỗi tải flash sale trang chủ:", err.message);
      setActiveFlashSale(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleTimeEnd = useCallback(() => {
    // Tự động làm mới dữ liệu khi hết giờ
    fetchCampaigns();
  }, [fetchCampaigns]);

  const countdown = useServerCountdown(
    activeFlashSale?.endAt,
    serverTime,
    handleTimeEnd
  );

  // Chỉ hiển thị khi có chiến dịch flash sale đang diễn ra và chưa hết giờ
  if (loading || !activeFlashSale || countdown.isEnded || !activeFlashSale.products?.length) {
    return null;
  }

  const formatNumber = (num) => String(num || 0).padStart(2, "0");

  return (
    <AnimatedSection variant="scale" className="my-10 w-full">
      <div className="bg-[#05251C] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-white border border-[#073D2A]">
        {/* Subtle Warm Forest Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#073D2A]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-[#F5DD20]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header bar: Title, Countdown & View All */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 bg-[#073D2A] border border-[#F5DD20]/30 text-[#F5DD20] rounded-2xl flex items-center justify-center shadow-md">
              <Zap size={22} fill="currentColor" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest bg-[#F5DD20] text-[#05251C] px-2.5 py-0.5 rounded-full">
                  ATELIER LIMITED
                </span>
                <span className="text-xs text-[#FBF9F5]/70 font-medium">Giờ Vàng Số Lượng Giới Hạn</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 font-heading">
                {activeFlashSale.name}
              </h2>
            </div>
          </div>

          {/* Countdown Clock (dựa trên server time) */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Clock size={15} className="text-[#F5DD20]" />
              <span>Kết thúc trong:</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-white">
              {countdown.days > 0 && (
                <>
                  <span className="bg-white/10 border border-white/10 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-xs">
                    {formatNumber(countdown.days)}
                  </span>
                  <span className="text-neutral-500">:</span>
                </>
              )}
              <span className="bg-white/10 border border-white/10 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-xs">
                {formatNumber(countdown.hours)}
              </span>
              <span className="text-neutral-500">:</span>
              <span className="bg-white/10 border border-white/10 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-xs">
                {formatNumber(countdown.minutes)}
              </span>
              <span className="text-neutral-500">:</span>
              <span className="bg-[#073D2A] text-[#F5DD20] border border-[#F5DD20]/30 px-2 py-1 rounded-lg min-w-[32px] text-center shadow-xs">
                {formatNumber(countdown.seconds)}
              </span>
            </div>
          </div>

          {/* Link Xem tất cả */}
          <MagneticCTA strength={0.25} radius={60}>
            <Link
              to={`/campaigns/${activeFlashSale.slug}`}
              className="hidden md:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#F5DD20] text-[#05251C] hover:bg-white px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm"
            >
              <span>Khám phá ưu đãi</span>
              <ChevronRight size={15} className="text-[#05251C]" />
            </Link>
          </MagneticCTA>
        </div>

        {/* Product Carousel / Grid (Tái sử dụng ProductCard) */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          {activeFlashSale.products.slice(0, 4).map((item) => {
            const productAdapted = {
              _id: item.product_id,
              id: String(item.product_id),
              name: item.name,
              slug: item.slug,
              image: item.image,
              displayProduct: [item.image],
              price: item.sale_price,
              new_price: item.sale_price,
              oldPrice: item.original_price,
              old_price: item.original_price,
              quota: item.quota,
              sold_campaign: item.sold,
              sold: item.sold,
              remainingQuota: item.remainingQuota,
              campaign_type: "flash_sale",
              campaign: {
                id: activeFlashSale._id,
                name: activeFlashSale.name,
                type: "flash_sale",
                remainingQuota: item.remainingQuota,
                discountPercentage: item.discountPercentage,
                quota: item.quota,
                sold: item.sold,
                isQuotaExhausted: item.remainingQuota === 0,
              },
            };

            const isFav = favoriteIds ? favoriteIds.has(String(item.product_id)) : false;

            return (
              <div key={`${item.product_id}_${item.variant_id || "all"}`}>
                <ProductCard
                  product={productAdapted}
                  isFavorite={isFav}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-6 md:hidden text-center relative z-10">
          <Link
            to={`/campaigns/${activeFlashSale.slug}`}
            className="inline-flex items-center justify-center gap-2 w-full text-xs font-bold uppercase tracking-wider bg-[#F5DD20] text-[#05251C] hover:bg-white py-3 rounded-full shadow-md transition-colors"
          >
            <span>Xem tất cả sản phẩm Flash Sale</span>
            <ArrowRight size={14} className="text-[#05251C]" />
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default FlashSaleSection;

