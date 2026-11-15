import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@/hooks/useGSAP";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "@/services/banner.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const DEFAULT_HERO_TITLE = "Cấu trúc Tối giản.\nBản sắc Đơn sắc.";
const DEFAULT_HERO_SUBTITLE =
  "Khám phá các thiết kế may đo đương đại với đường cắt chuẩn xác và phom dáng tinh gọn.";

const HeroBanner = () => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useWebsiteSettings();
  const siteName =
    !settingsLoading && settings?.general?.siteName
      ? settings.general.siteName
      : "WEBFASHION";

  const defaultHero = {
    id: "default-atelier-hero",
    eyebrow: `${siteName} · BỘ SƯU TẬP GIÁM TUYỂN`,
    title: DEFAULT_HERO_TITLE,
    subtitle: DEFAULT_HERO_SUBTITLE,
    buttonText: "Khám phá Bộ sưu tập",
    linkUrl: "/products",
    imageUrl: "",
    isApi: false,
  };

  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const heroRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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
          y: 15,
          duration: 0.45,
        })
          .from(
            ".hero-anim-title",
            {
              opacity: 0,
              y: 28,
              duration: 0.6,
            },
            "-=0.25"
          )
          .from(
            ".hero-anim-subtitle",
            {
              opacity: 0,
              y: 15,
              duration: 0.45,
            },
            "-=0.3"
          )
          .from(
            ".hero-anim-cta",
            {
              opacity: 0,
              scale: 0.95,
              duration: 0.4,
            },
            "-=0.2"
          )
          .from(
            midLayer,
            {
              opacity: 0,
              scale: 0.96,
              duration: 0.6,
            },
            0.1
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

  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const res = await getActiveBannersService();
        if (!isMounted || !Array.isArray(res)) return;
        const heroList = res
          .filter((item) => !item.position || item.position === "home_hero")
          .map((item) => ({
            id: item._id || item.id,
            eyebrow: `${siteName} · ATELIER`,
            title: item.title || DEFAULT_HERO_TITLE,
            subtitle: item.subtitle || DEFAULT_HERO_SUBTITLE,
            buttonText: item.buttonText || "Xem Bộ sưu tập",
            linkUrl: item.linkUrl || "/products",
            targetType: item.targetType,
            targetId: item.targetId,
            imageUrl: item.imageUrl || item.image || "",
            isApi: true,
          }));
        if (heroList.length > 0) {
          setBanners(heroList);
        }
      } catch {
        // Fallback silently to defaultHero
      }
    };
    loadBanners();
    return () => {
      isMounted = false;
    };
  }, [siteName]);

  const slides = banners.length > 0 ? banners : [defaultHero];
  const activeSlide = slides[currentIndex] || defaultHero;
  const hasImage =
    Boolean(activeSlide.imageUrl) && !failedImages[activeSlide.id];

  const handlePrimaryCTA = () => {
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
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      ref={heroRef}
      aria-label="Giới thiệu bộ sưu tập chủ đạo"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:py-20">
        {/* Left Column: Editorial Typography & Actions */}
        <div
          data-hero-layer="fg"
          className="flex flex-col items-start justify-center lg:col-span-6 will-change-transform"
        >
          <p className="hero-anim-eyebrow mb-4 border-l-2 border-foreground pl-3 text-[11px] font-medium tracking-[0.26em] uppercase text-muted-foreground">
            {activeSlide.isApi ? `${siteName} · ATELIER` : defaultHero.eyebrow}
          </p>

          <h1 className="hero-anim-title whitespace-pre-line font-sans text-4xl leading-[1.2] font-normal tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {activeSlide.title}
          </h1>

          <p className="hero-anim-subtitle mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {activeSlide.subtitle}
          </p>

          <div className="hero-anim-cta mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryCTA}
              className="btn-cta touch-target inline-flex items-center gap-2.5 bg-primary px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
            >
              <span>{activeSlide.buttonText}</span>
              <ArrowUpRight size={15} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/lookbooks")}
              className="touch-target inline-flex items-center gap-2 border border-border bg-transparent px-6 py-3.5 text-xs font-medium tracking-[0.18em] uppercase text-foreground transition-colors hover:border-foreground hover:bg-secondary"
            >
              <span>Hồ sơ Lookbook</span>
            </button>
          </div>

          {slides.length > 1 && (
            <div className="mt-8 flex items-center gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={handlePrev}
                className="touch-target inline-flex items-center justify-center border border-border text-foreground transition-colors hover:bg-secondary"
                aria-label="Banner trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-muted-foreground">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="touch-target inline-flex items-center justify-center border border-border text-foreground transition-colors hover:bg-secondary"
                aria-label="Banner tiếp theo"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Visual Frame */}
        <div data-hero-layer="mid" className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-secondary sm:aspect-[16/11] lg:aspect-[4/5]">
            {hasImage ? (
              <img
                src={activeSlide.imageUrl}
                alt={activeSlide.title}
                onError={() =>
                  setFailedImages((prev) => ({
                    ...prev,
                    [activeSlide.id]: true,
                  }))
                }
                className="h-full w-full object-cover object-[50%_25%]"
              />
            ) : (
              <div
                data-hero-layer="bg"
                className="relative flex h-full w-full flex-col justify-between p-6 sm:p-10 select-none"
                aria-label="Khung trưng bày Atelier"
              >
                <div className="flex items-center justify-between border-b border-border/80 pb-4 text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
                  <span>{siteName} ARCHIVE</span>
                  <span>SILHOUETTE STUDY</span>
                </div>

                <div className="my-auto flex flex-col items-center justify-center py-8 text-center">
                  <div className="relative flex h-44 w-32 items-center justify-center border border-foreground/25 bg-background/60 sm:h-56 sm:w-40">
                    <div className="absolute inset-2 border border-border" />
                    <span className="font-sans text-2xl tracking-[0.18em] uppercase text-foreground/80">
                      {siteName.slice(0, 3)}
                    </span>
                  </div>
                  <p className="mt-5 font-sans text-lg italic text-foreground">
                    {siteName} Monochrome Collection
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                    Noir · Bone · Slate
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/80 pt-4 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  <span>CURATED EDITION</span>
                  <span>VIETNAM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
