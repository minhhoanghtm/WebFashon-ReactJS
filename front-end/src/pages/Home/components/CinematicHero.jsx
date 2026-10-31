import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "@/services/banner.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import HOME_CONTENT from "../content";

const DEFAULT_SLIDES = [
  {
    id: "default-slide-1",
    eyebrow: HOME_CONTENT.hero.eyebrow,
    titleLine1: HOME_CONTENT.hero.titleLine1,
    titleLine2: HOME_CONTENT.hero.titleLine2,
    subtitle: HOME_CONTENT.hero.subtitle,
    buttonText: HOME_CONTENT.hero.cta,
    linkUrl: "/products",
    imageUrl: "",
    isApi: false,
  },
  {
    id: "default-slide-2",
    eyebrow: "PHIÊN BẢN GIỚI HẠN · CHẤT LIỆU CAO CẤP",
    titleLine1: "ĐƯỜNG CẮT CHUẨN XÁC.",
    titleLine2: "TỰ DO BIỂU CẢM.",
    subtitle:
      "Tuyển tập chất liệu len dệt, lụa tự nhiên và linen thô xử lý tối giản.",
    buttonText: "XEM CHI TIẾT SẢN PHẨM",
    linkUrl: "/products",
    imageUrl: "",
    isApi: false,
  },
  {
    id: "default-slide-3",
    eyebrow: "BỘ SƯU TẬP MÙA HẠ · PHONG CÁCH TỐI GIẢN",
    titleLine1: "DẤU ẤN BẤT BIẾN.",
    titleLine2: "VƯỢT THỜI GIAN.",
    subtitle:
      "Khám phá các thiết kế đơn sắc được giám tuyển cho nhịp sống đô thị.",
    buttonText: "KHÁM PHÁ CỬA HÀNG",
    linkUrl: "/products",
    imageUrl: "",
    isApi: false,
  },
];

export const CinematicHero = ({ onExploreClick }) => {
  const navigate = useNavigate();
  const { settings, loading } = useWebsiteSettings();
  const siteName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : "404 STUDIO";

  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real banners from API
  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const res = await getActiveBannersService();
        if (!isMounted || !Array.isArray(res) || res.length === 0) return;

        const filtered = res
          .filter((item) => !item.position || item.position === "home_hero")
          .map((item, idx) => {
            const rawTitle = item.title || "";
            const titleParts = rawTitle.includes("\n")
              ? rawTitle.split("\n")
              : [rawTitle || "CẤU TRÚC TỐI GIẢN.", "BẢN SẮC ĐƯƠNG ĐẠI."];

            return {
              id: item._id || item.id || `api-banner-${idx}`,
              eyebrow: `${siteName} · BỘ SƯU TẬP 2026`,
              titleLine1: titleParts[0] || "CẤU TRÚC TỐI GIẢN.",
              titleLine2: titleParts[1] || "BẢN SẮC ĐƯƠNG ĐẠI.",
              subtitle:
                item.subtitle ||
                "Thiết kế may đo đương đại với đường cắt chuẩn xác và tinh tế.",
              buttonText: item.buttonText || "KHÁM PHÁ BỘ SƯU TẬP",
              linkUrl: item.linkUrl || "/products",
              targetType: item.targetType,
              targetId: item.targetId,
              imageUrl: item.imageUrl || item.image || "",
              isApi: true,
            };
          });

        if (filtered.length > 0) {
          setBanners(filtered);
        }
      } catch {
        // Fallback to default slides
      }
    };

    loadBanners();
    return () => {
      isMounted = false;
    };
  }, [siteName]);

  const slides = useMemo(
    () => (banners.length > 0 ? banners : DEFAULT_SLIDES),
    [banners]
  );

  const activeSlide = slides[currentIndex] || DEFAULT_SLIDES[0];

  // Auto crossfade slides slowly (every 7 seconds)
  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleCTA = useCallback(() => {
    if (activeSlide.isApi && activeSlide.id) {
      trackBannerClickService(activeSlide.id);
    }
    if (activeSlide.targetType === "category" && activeSlide.targetId) {
      navigate(`/products?category=${encodeURIComponent(activeSlide.targetId)}`);
      return;
    }
    if (activeSlide.targetType === "product" && activeSlide.targetId) {
      navigate(`/product/${encodeURIComponent(activeSlide.targetId)}`);
      return;
    }
    navigate(activeSlide.linkUrl || "/products");
  }, [activeSlide, navigate]);

  const handleScrollDown = () => {
    if (typeof onExploreClick === "function") {
      onExploreClick();
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      aria-label="Khám phá bộ sưu tập Atelier"
      className="sticky top-0 z-0 h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#050608] text-white select-none"
    >
      {/* Background Slides with Slow Crossfade + Subtle Ken Burns Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.titleLine1}
                  className={`h-full w-full object-cover object-center transition-transform duration-[8000ms] ease-out will-change-transform ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              ) : (
                /* Architectural Monochrome Placeholder Canvas */
                <div className="relative h-full w-full bg-gradient-to-b from-[#111317] via-[#090a0d] to-[#040405] flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                      backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                      backgroundSize: "32px 32px",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center text-center opacity-[0.05] select-none">
                    <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                      ATELIER MONOCHROME CANVAS
                    </span>
                    <span className="mt-1 font-condensed text-6xl font-bold tracking-widest text-white/10 uppercase">
                      404 STUDIO
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Ambient Dark Overlays for Pristine High-Contrast Typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/70" />
        <div className="absolute inset-0 bg-black/25 backdrop-brightness-95" />
      </div>

      {/* Header clearance → centered narrative → bottom controls. */}
      <div className="relative z-10 flex h-full w-full flex-col px-6 pb-6 pt-24 text-center sm:px-10 sm:pb-8 sm:pt-28 lg:px-14 lg:pt-32">
        {/* Center Narrative Content: Eyebrow, title, description, CTA */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-5 sm:py-7">
          <div className="w-full">
            {/* Eyebrow badge retains its slide-up mask with safe diacritic clearance. */}
            <div className="overflow-hidden py-[0.12em]">
              <p className="inline-block text-[10px] font-semibold tracking-[0.32em] text-white/75 uppercase sm:text-xs">
                {activeSlide.eyebrow}
              </p>
            </div>

            {/* Responsive title keeps Vietnamese diacritics clear at every viewport size (390px, 1366px, 1920px). */}
            <h1 className="mx-auto mt-4 font-condensed text-[clamp(1.85rem,min(7.2vw,12.5svh),7.2rem)] font-bold leading-[1.2] tracking-[-0.015em] text-white uppercase sm:mt-5">
              <span className="mx-auto block max-w-[16ch] text-balance py-[0.14em]">
                {activeSlide.titleLine1}
              </span>
              <span className="mx-auto block max-w-[16ch] text-balance py-[0.14em] text-white/90">
                {activeSlide.titleLine2}
              </span>
            </h1>

            {/* Subtitle / Manifesto description */}
            <p className="mx-auto mt-5 max-w-[48ch] text-xs font-normal leading-relaxed tracking-wider text-white/75 sm:mt-6 sm:text-sm font-sans">
              {activeSlide.subtitle}
            </p>

            {/* Thin-bordered Call to Action Button */}
            <div className="mt-6 sm:mt-7">
              <button
                type="button"
                onClick={handleCTA}
                className="group relative inline-flex min-h-[48px] items-center justify-center border border-white/40 bg-transparent px-8 py-3.5 text-xs font-semibold tracking-[0.26em] text-white uppercase transition-all duration-500 hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>{activeSlide.buttonText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Slide Counter (Left) + Scroll to Explore (Right) */}
        <div className="flex shrink-0 items-end justify-between">
          {/* Slide Counter */}
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-white/50">
            <span className="text-white font-semibold">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span>/</span>
            <span>{String(slides.length).padStart(2, "0")}</span>
          </div>

          {/* Scroll down prompt */}
          <button
            type="button"
            onClick={handleScrollDown}
            aria-label="Cuộn xuống để khám phá các chương tiếp theo"
            className="group flex items-center gap-2 text-[10px] font-medium tracking-[0.24em] text-white/70 uppercase transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">CUỘN ĐỂ KHÁM PHÁ</span>
            <span className="flex h-7 w-7 items-center justify-center border border-white/25 transition-transform group-hover:translate-y-1 group-hover:border-white">
              <ArrowDown size={13} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;
