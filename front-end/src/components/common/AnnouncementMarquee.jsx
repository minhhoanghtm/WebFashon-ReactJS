import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, X, Zap, Tag } from "lucide-react";
import campaignApi from "@/api/campaignApi";
import { getActiveBannersService } from "@/services/banner.service";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const defaultAnnouncements = [
  {
    id: "ann-freeship",
    text: "MIỄN PHÍ GIAO HÀNG TOÀN QUỐC CHO ĐƠN TỪ 500.000₫",
    highlight: "FREESHIP",
    link: "/products",
    icon: Sparkles,
  },
  {
    id: "ann-atelier",
    text: "404STUDIO ATELIER · CONTEMPORARY VIETNAMESE TAILORING",
    highlight: "EDITION 2026",
    link: "/about",
    icon: Sparkles,
  },
  {
    id: "ann-return",
    text: "CHÍNH SÁCH ĐỔI TRẢ TRONG 7 NGÀY · BẢO HÀNH TRỌN ĐỜI ĐƯỜNG MAY",
    highlight: "AN TÂM MUA SẮM",
    link: "/policy",
    icon: Tag,
  },
];

export const AnnouncementMarquee = () => {
  const [items, setItems] = useState(defaultAnnouncements);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("404_announcement_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        const [campaignRes, banners] = await Promise.allSettled([
          campaignApi.getActiveCampaigns(),
          getActiveBannersService(),
        ]);

        const dynamicItems = [];

        // 1. Check active campaigns from campaignApi
        if (
          campaignRes.status === "fulfilled" &&
          campaignRes.value?.data?.success &&
          Array.isArray(campaignRes.value.data.data?.campaigns)
        ) {
          const activeCampaigns = campaignRes.value.data.data.campaigns;
          activeCampaigns.forEach((c) => {
            const isFlash = c.type === "flash_sale";
            dynamicItems.push({
              id: `camp-${c._id || c.slug}`,
              text: `${isFlash ? "FLASH SALE GIỜ VÀNG" : "CHIẾN DỊCH"}: ${c.name.toUpperCase()}`,
              highlight: c.discountRule
                ? `GIẢM ${c.discountRule.discountValue}${
                    c.discountRule.discountType === "percentage" ? "%" : "₫"
                  }`
                : "ƯU ĐÃI ĐẶC QUYỀN",
              link: `/campaigns/${c.slug}`,
              icon: isFlash ? Zap : Sparkles,
            });
          });
        }

        // 2. Check active announcement banners from banner service
        if (banners.status === "fulfilled" && Array.isArray(banners.value)) {
          const promoBanners = banners.value.filter(
            (b) => b.position === "announcement_bar" || (b.position === "home_promotion" && b.title)
          );
          promoBanners.slice(0, 2).forEach((b) => {
            dynamicItems.push({
              id: `ban-${b._id || b.id}`,
              text: b.title.toUpperCase(),
              highlight: b.subtitle ? b.subtitle.toUpperCase() : "DISCOVER NOW",
              link: b.linkUrl || "/products",
              icon: Sparkles,
            });
          });
        }

        if (isMounted && dynamicItems.length > 0) {
          // Combine dynamic promotions with core brand service guarantees
          setItems([...dynamicItems, ...defaultAnnouncements]);
        }
      } catch (err) {
        console.warn("Announcement marquee data fetch fallback:", err);
      }
    };

    fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("404_announcement_dismissed", "true");
    } catch {
      // Ignore if sessionStorage is unavailable
    }
  };

  if (isDismissed) {
    return null;
  }

  // Render static accessible announcement if user prefers reduced motion
  if (prefersReduced) {
    const featured = items[0] || defaultAnnouncements[0];
    const Icon = featured.icon || Sparkles;
    return (
      <aside
        className="h-9 bg-[#062D22] text-[#F7F6F1] border-b border-[#F5DD20]/15 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider relative z-50 select-none"
        aria-label="Thông báo đầu trang"
      >
        <div className="mx-auto flex items-center gap-2 text-[11px] truncate">
          <Icon size={12} className="text-[#F5DD20] flex-shrink-0" />
          <span>{featured.text}</span>
          <span className="text-[#F5DD20] font-black">[{featured.highlight}]</span>
          {featured.link && (
            <Link
              to={featured.link}
              className="text-[#F5DD20] underline underline-offset-2 ml-1 hover:text-white"
            >
              Xem ngay
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/60 hover:text-white p-1 ml-2 transition-colors cursor-pointer"
          aria-label="Đóng thanh thông báo"
        >
          <X size={13} />
        </button>
      </aside>
    );
  }

  // Render Infinite Marquee
  return (
    <aside
      className="h-9 bg-[#062D22] text-[#F7F6F1] border-b border-[#F5DD20]/15 overflow-hidden flex items-center relative z-50 select-none group"
      aria-label="Thông báo sự kiện và khuyến mãi"
    >
      <div className="announcement-marquee-track">
        {/* Track 1: Interactive items */}
        <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 flex-shrink-0">
          {items.map((item, idx) => {
            const Icon = item.icon || Sparkles;
            return (
              <Link
                key={`ann-1-${item.id}-${idx}`}
                to={item.link || "#"}
                className="inline-flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#F7F6F1] hover:text-[#F5DD20] transition-colors focus:outline-none focus:ring-1 focus:ring-[#F5DD20] whitespace-nowrap"
              >
                <Icon size={12} className="text-[#F5DD20] flex-shrink-0" />
                <span>{item.text}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F5DD20] text-[#062D22] text-[9px] font-black tracking-widest">
                  {item.highlight}
                </span>
                <span className="text-[#F5DD20]/40 font-mono text-xs">✦</span>
              </Link>
            );
          })}
        </div>

        {/* Track 2: Cloned segment for seamless loop (hidden from screen reader to avoid duplicate reading) */}
        <div
          className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 flex-shrink-0"
          aria-hidden="true"
        >
          {items.map((item, idx) => {
            const Icon = item.icon || Sparkles;
            return (
              <span
                key={`ann-2-${item.id}-${idx}`}
                className="inline-flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#F7F6F1] hover:text-[#F5DD20] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Icon size={12} className="text-[#F5DD20] flex-shrink-0" />
                <span>{item.text}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F5DD20] text-[#062D22] text-[9px] font-black tracking-widest">
                  {item.highlight}
                </span>
                <span className="text-[#F5DD20]/40 font-mono text-xs">✦</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Dismiss Button on the far right */}
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[#062D22] via-[#062D22] to-transparent pl-6 pr-3 flex items-center z-10">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/60 hover:text-[#F5DD20] p-1 transition-colors cursor-pointer rounded-full"
          aria-label="Đóng thanh thông báo"
        >
          <X size={13} />
        </button>
      </div>
    </aside>
  );
};

export default AnnouncementMarquee;

