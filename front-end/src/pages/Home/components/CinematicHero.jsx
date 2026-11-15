import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@/hooks/useGSAP";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "@/services/banner.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { scrollToLenis } from "@/hooks/useLenis";

export const CinematicHero = ({ onExploreClick }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { settings, loading } = useWebsiteSettings();
  const siteName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : "404 STUDIO";

  const heroSettings = settings?.homeContent?.hero || null;

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
                item.description ||
                "Thiết kế may đo đương đại với đường cắt chuẩn xác và tinh tế.",
              buttonText: item.buttonText || "KHÁM PHÁ BỘ SƯU TẬP",
              linkUrl: item.linkUrl || item.link || "/products",
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
        // Handled via dynamic settings
      }
    };

    loadBanners();
    return () => {
      isMounted = false;
    };
  }, [siteName]);

  const dynamicSlides = useMemo(() => {
    if (banners.length > 0) return banners;
    if (heroSettings) {
      return [
        {
          id: "hero-settings-slide",
          eyebrow: heroSettings.eyebrow || `${siteName} · ATELIER EDITION`,
          titleLine1: heroSettings.titleLine1 || "CẤU TRÚC TỐI GIẢN.",
          titleLine2: heroSettings.titleLine2 || "BẢN SẮC ĐƯƠNG ĐẠI.",
          subtitle: heroSettings.subtitle || settings?.general?.siteDescription || "",
          buttonText: heroSettings.cta || "KHÁM PHÁ BỘ SƯU TẬP",
          linkUrl: "/products",
          imageUrl: settings?.seo?.ogImage || "",
          isApi: true,
        },
      ];
    }
    return [];
  }, [banners, heroSettings, siteName, settings]);

  const activeSlide = dynamicSlides[currentIndex] || dynamicSlides[0] || null;

  // Auto crossfade slides slowly (every 7 seconds)
  useEffect(() => {
    if (dynamicSlides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dynamicSlides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [dynamicSlides.length]);

  const handleCTA = useCallback(() => {
    if (!activeSlide) return;
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

  // GSAP: Entrance timeline + Mouse Parallax across 3 layers (bg, mid, fg)
  useGSAP(
    () => {
      const heroEl = heroRef.current;
      if (!heroEl) return;

      const bgLayer = heroEl.querySelector('[data-hero-layer="bg"]');
      const midLayer = heroEl.querySelector('[data-hero-layer="mid"]');
      const fgLayer = heroEl.querySelector('[data-hero-layer="fg"]');

      // 1. Entrance timeline
      if (!prefersReducedMotion) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-anim-eyebrow", {
          opacity: 0,
          y: 16,
          duration: 0.5,
        })
          .from(
            ".hero-anim-title",
            {
              opacity: 0,
              y: 28,
              duration: 0.65,
              stagger: 0.1,
            },
            "-=0.25"
          )
          .from(
            ".hero-anim-subtitle",
            {
              opacity: 0,
              y: 14,
              duration: 0.45,
            },
            "-=0.3"
          )
          .from(
            ".hero-anim-cta",
            {
              opacity: 0,
              scale: 0.94,
              duration: 0.4,
            },
            "-=0.2"
          );
      }

      // 2. Mouse Parallax across layers (desktop only, hover enabled, reduced motion disabled)
      const canHover =
        typeof window !== "undefined" &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (prefersReducedMotion || !canHover || window.innerWidth < 768) {
        return;
      }

      const bgXTo = bgLayer
        ? gsap.quickTo(bgLayer, "x", { duration: 0.7, ease: "power2.out" })
        : null;
      const bgYTo = bgLayer
        ? gsap.quickTo(bgLayer, "y", { duration: 0.7, ease: "power2.out" })
        : null;

      const midXTo = midLayer
        ? gsap.quickTo(midLayer, "x", { duration: 0.5, ease: "power2.out" })
        : null;
      const midYTo = midLayer
        ? gsap.quickTo(midLayer, "y", { duration: 0.5, ease: "power2.out" })
        : null;

      const fgXTo = fgLayer
        ? gsap.quickTo(fgLayer, "x", { duration: 0.4, ease: "power2.out" })
        : null;
      const fgYTo = fgLayer
        ? gsap.quickTo(fgLayer, "y", { duration: 0.4, ease: "power2.out" })
        : null;

      const handlePointerMove = (e) => {
        const rect = heroEl.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        bgXTo?.(xPercent * -14);
        bgYTo?.(yPercent * -10);

        midXTo?.(xPercent * -6);
        midYTo?.(yPercent * -4);

        fgXTo?.(xPercent * 16);
        fgYTo?.(yPercent * 12);
      };

      const handlePointerLeave = () => {
        bgXTo?.(0);
        bgYTo?.(0);
        midXTo?.(0);
        midYTo?.(0);
        fgXTo?.(0);
        fgYTo?.(0);
      };

      heroEl.addEventListener("pointermove", handlePointerMove, { passive: true });
      heroEl.addEventListener("pointerleave", handlePointerLeave, { passive: true });

      return () => {
        heroEl.removeEventListener("pointermove", handlePointerMove);
        heroEl.removeEventListener("pointerleave", handlePointerLeave);
      };
    },
    { scope: heroRef, dependencies: [prefersReducedMotion] }
  );

  const handleScrollDown = () => {
    if (typeof onExploreClick === "function") {
      onExploreClick();
    } else {
      scrollToLenis(window.innerHeight, { duration: 1.1 });
    }
  };

  if (!activeSlide && loading) {
    return (
      <section className="sticky top-0 z-0 h-[90svh] min-h-[88svh] max-h-[92svh] w-full overflow-hidden bg-[#050608] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-12 w-64 bg-white/10 rounded" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </div>
      </section>
    );
  }

  if (!activeSlide) {
    return null;
  }

  return (
    <section
      id="section-hero"
      ref={heroRef}
      aria-label="Khám phá bộ sưu tập Atelier"
      className="sticky top-0 z-0 h-[100svh] min-h-[100vh] w-full overflow-hidden bg-[#050608] text-white select-none will-change-transform"
    >
      {/* Background Slides with Slow Crossfade + Subtle Ken Burns Zoom */}
      <div
        data-hero-layer="bg"
        className="absolute inset-0 z-0 overflow-hidden will-change-transform"
      >
        {dynamicSlides.map((slide, idx) => {
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
                  className={`h-full w-full object-cover object-[50%_25%] transition-transform duration-[8000ms] ease-out will-change-transform ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              ) : (
                /* Architectural Monochrome Canvas */
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
                      {siteName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ambient Dark Overlays for High-Contrast Typography */}
      <div
        data-hero-layer="mid"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden will-change-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/70" />
        <div className="absolute inset-0 bg-black/25 backdrop-brightness-95" />
      </div>

      {/* Header clearance -> centered narrative -> bottom controls */}
      <div className="relative z-10 flex h-full w-full flex-col px-6 pb-6 pt-24 text-center sm:px-10 sm:pb-8 sm:pt-28 lg:px-14 lg:pt-32">
        <div
          data-hero-layer="fg"
          className="flex min-h-0 flex-1 items-center justify-center py-5 sm:py-7 will-change-transform"
        >
          <div className="w-full">
            <div className="overflow-hidden py-[0.12em]">
              <p className="hero-anim-eyebrow inline-block text-[10px] font-semibold tracking-[0.32em] text-white/75 uppercase sm:text-xs">
                {activeSlide.eyebrow}
              </p>
            </div>

            <h1 className="hero-anim-title mx-auto mt-4 font-condensed text-[clamp(1.85rem,min(7.2vw,12.5svh),7.2rem)] font-bold leading-[1.2] tracking-[-0.015em] text-white uppercase sm:mt-5">
              <span className="mx-auto block max-w-[16ch] text-balance py-[0.14em]">
                {activeSlide.titleLine1}
              </span>
              <span className="mx-auto block max-w-[16ch] text-balance py-[0.14em] text-white/90">
                {activeSlide.titleLine2}
              </span>
            </h1>

            <p className="hero-anim-subtitle mx-auto mt-5 max-w-[48ch] text-xs font-normal leading-relaxed tracking-wider text-white/75 sm:mt-6 sm:text-sm font-sans">
              {activeSlide.subtitle}
            </p>

            <div className="hero-anim-cta mt-6 sm:mt-7">
              <button
                type="button"
                onClick={handleCTA}
                className="btn-cta group relative inline-flex min-h-[48px] items-center justify-center border border-white/40 bg-transparent px-8 py-3.5 text-xs font-semibold tracking-[0.26em] text-white uppercase transition-all duration-500 hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
              >
                <span>{activeSlide.buttonText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Slide Counter + Scroll prompt */}
        <div className="flex shrink-0 items-end justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-white/50">
            <span className="text-white font-semibold">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span>/</span>
            <span>{String(dynamicSlides.length).padStart(2, "0")}</span>
          </div>

          <button
            type="button"
            onClick={handleScrollDown}
            aria-label="Cuộn xuống để khám phá các chương tiếp theo"
            className="group flex items-center gap-2 text-[10px] font-medium tracking-[0.24em] text-white/70 uppercase transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">
              {heroSettings?.scrollHint || "CUỘN ĐỂ KHÁM PHÁ"}
            </span>
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
