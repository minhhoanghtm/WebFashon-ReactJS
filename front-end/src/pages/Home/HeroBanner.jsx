import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
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
      aria-label="Giới thiệu bộ sưu tập chủ đạo"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:py-20">
        {/* Left Column: Editorial Typography & Actions */}
        <div
          data-hero-layer="fg"
          className="flex flex-col items-start justify-center lg:col-span-6"
        >
          <p className="mb-4 border-l-2 border-foreground pl-3 text-[11px] font-medium tracking-[0.26em] uppercase text-muted-foreground">
            {activeSlide.isApi ? `${siteName} · ATELIER` : defaultHero.eyebrow}
          </p>

          <h1 className="whitespace-pre-line font-serif text-4xl leading-[1.06] font-normal tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {activeSlide.title}
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {activeSlide.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryCTA}
              className="touch-target inline-flex items-center gap-2.5 bg-primary px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
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
                className="h-full w-full object-cover object-center"
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
                    <span className="font-serif text-2xl tracking-[0.18em] uppercase text-foreground/80">
                      {siteName.slice(0, 3)}
                    </span>
                  </div>
                  <p className="mt-5 font-serif text-lg italic text-foreground">
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
