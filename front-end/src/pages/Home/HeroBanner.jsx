import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getActiveBannersService, trackBannerClickService } from "../../services/banner.service";
import { motionEase } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import MagneticCTA from "../../components/motion/MagneticCTA";
import heroAtelierImage from "./assets/hero-atelier.jpg";

const MotionSection = motion.section;
const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionH1 = motion.h1;
const MotionP = motion.p;
const MotionButton = motion.button;

const HeroBanner = () => {
  const navigate = useNavigate();
  const [activeBanners, setActiveBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroRef = useRef(null);
  const editorialRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  // Scoped GSAP choreography: entrance and scroll depth are cleaned up on every slide change.
  useLayoutEffect(() => {
    if (prefersReduced || !editorialRef.current) return undefined;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo("[data-hero-image]", { scale: 1.06 }, { scale: 1, duration: 1.25 })
        .fromTo("[data-hero-eyebrow]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.82")
        .fromTo("[data-hero-title]", { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.25")
        .fromTo("[data-hero-copy]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.4")
        .fromTo("[data-hero-cta]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.42 }, "-=0.28");

      gsap.to("[data-hero-image]", {
        yPercent: 11,
        scale: 1.035,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.7 },
      });
      gsap.to("[data-hero-atmosphere]", {
        yPercent: -16,
        opacity: 0.28,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.7 },
      });
      gsap.to("[data-hero-content]", {
        yPercent: -8,
        opacity: 0.78,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.7 },
      });
    }, editorialRef);
    return () => context.revert();
  }, [currentIndex, prefersReduced]);

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const banners = await getActiveBannersService();
        if (isMounted) {
          const heroBanners = banners.filter((b) => b.position === "home_hero");
          setActiveBanners(heroBanners);
        }
      } catch (error) {
        console.error("Lỗi khi tải banner trang chủ:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  const defaultFallbackBanner = {
    id: "default-hero-atelier",
    title: "Khám phá phong cách của bạn",
    subtitle: "Dễ dàng tìm những sản phẩm phù hợp trong danh mục thời trang của chúng tôi.",
    eyebrow: "404 STUDIO · ATELIER 2026",
    buttonText: "Khám phá bộ sưu tập",
    imageUrl: heroAtelierImage,
    mobileImageUrl: heroAtelierImage,
    targetType: "category",
    targetId: "",
    linkUrl: "/products",
    isApi: false,
  };

  const bannerList =
    activeBanners.length > 0
      ? activeBanners.map((b) => ({
          id: b._id || b.id,
          title: b.title ? b.title.replace(/Wellcome/gi, "Welcome") : "",
          subtitle: b.subtitle ? b.subtitle.replace(/Wellcome/gi, "Welcome") : "",
          eyebrow: "Thiết kế nổi bật",
          buttonText: b.buttonText || "Khám phá ngay",
          imageUrl: b.imageUrl,
          mobileImageUrl: b.mobileImageUrl,
          targetType: b.targetType,
          targetId: b.targetId,
          linkUrl: b.linkUrl,
          isApi: true,
        }))
      : [defaultFallbackBanner];

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [bannerList.length]);

  if (loading) {
    return (
      <div className="home-hero flex items-center justify-center min-h-[510px] rounded-[22px] bg-[#272522]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === bannerList.length - 1 ? 0 : prev + 1));
  };

  const handleBannerClick = async (banner) => {
    if (!banner.isApi) {
      navigate("/products");
      return;
    }

    if (banner.id) {
      await trackBannerClickService(banner.id);
    }

    if (banner.targetType === "product" && banner.targetId) {
      navigate(`/product/${banner.targetId}`);
    } else if (banner.targetType === "category" && banner.targetId) {
      navigate(`/products?category=${banner.targetId}`);
    } else if (banner.targetType === "lookbook" && banner.targetId) {
      navigate(`/lookbooks/${banner.targetId}`);
    } else if (banner.targetType === "external" && banner.linkUrl && banner.linkUrl.trim() !== "") {
      if (banner.linkUrl.startsWith("#")) {
        const element = document.getElementById(banner.linkUrl.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        window.open(banner.linkUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const currentBanner = bannerList[currentIndex] || bannerList[0];

  return (
    <MotionSection
      ref={heroRef}
      className="home-hero group min-h-[510px] relative w-full overflow-hidden rounded-[22px] bg-[#272522] will-change-transform shadow-lg"
    >
      {/* Editorial Frame Expansion Stage */}
      <AnimatePresence mode="wait">
        <MotionDiv
          ref={editorialRef}
          key={currentBanner.id + "-" + currentIndex}
          initial={
            prefersReduced
              ? { opacity: 0 }
              : { clipPath: "inset(4% 6% 4% 6% round 24px)", opacity: 0, scale: 1.05 }
          }
          animate={
            prefersReduced
              ? { opacity: 1 }
              : { clipPath: "inset(0% 0% 0% 0% round 22px)", opacity: 1, scale: 1 }
          }
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.02 }
          }
          transition={{ duration: prefersReduced ? 0.2 : 0.95, ease: motionEase.editorialReveal }}
          onClick={() => handleBannerClick(currentBanner)}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center overflow-hidden"
        >
          <MotionDiv
            data-hero-image
            className="absolute inset-0 w-full h-full select-none"
          >
            <picture className="w-full h-full">
              {currentBanner.mobileImageUrl && (
                <source media="(max-width: 768px)" srcSet={encodeURI(currentBanner.mobileImageUrl)} />
              )}
              <img
                src={currentBanner.imageUrl ? encodeURI(currentBanner.imageUrl) : ""}
                alt={currentBanner.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </picture>
          </MotionDiv>

          {/* Premium Dark Overlay */}
          <div className="home-hero__overlay" />
          <div data-hero-atmosphere className="home-hero__atmosphere" aria-hidden="true" />

          {/* Animated Slide Text Content */}
          <MotionDiv
            data-hero-content
            className="home-hero__content select-none relative z-10"
          >
            {/* Eyebrow */}
            <MotionSpan
              initial={{ opacity: 0, y: 14, letterSpacing: "0.15em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.22em" }}
              transition={{ duration: 0.6, delay: 0.15, ease: motionEase.editorialReveal }}
              data-hero-eyebrow
              className="home-hero__eyebrow text-[#F5DD20] font-bold uppercase tracking-[0.22em]"
            >
              {currentBanner.eyebrow}
            </MotionSpan>

            {/* Title with Mask Reveal */}
            <div className="overflow-hidden">
              <MotionH1
                id="home-hero-title"
                data-hero-title
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: "0%" }}
                transition={{ duration: 0.7, delay: 0.24, ease: motionEase.editorialReveal }}
                className="drop-shadow-sm font-heading"
              >
                {currentBanner.title}
              </MotionH1>
            </div>

            {/* Subtitle */}
            {currentBanner.subtitle && (
              <MotionP
                data-hero-copy
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.38, ease: motionEase.cinematic }}
              >
                {currentBanner.subtitle}
              </MotionP>
            )}

            {/* Tactile Magnetic CTA Button */}
            <MagneticCTA strength={0.25} radius={100} className="pt-2">
              <MotionButton
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.48, ease: motionEase.cinematic }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(currentBanner);
                }}
                data-hero-cta
                className="group/btn cursor-pointer shadow-md"
              >
                <span>{currentBanner.buttonText}</span>
                <ArrowDown
                  size={17}
                  aria-hidden="true"
                  className="transition-transform group-hover/btn:translate-y-0.5"
                />
              </MotionButton>
            </MagneticCTA>
          </MotionDiv>
        </MotionDiv>
      </AnimatePresence>

      {/* Slide Navigation Buttons with Tactile Magnetic Feel */}
      {bannerList.length > 1 && (
        <>
          <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <MagneticCTA strength={0.3} radius={70}>
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/50 hover:bg-[#F5DD20] hover:text-[#05251C] text-white transition-all duration-300 border border-white/20 shadow-md cursor-pointer"
                style={{ margin: 0, padding: 0 }}
                aria-label="Slide trước"
              >
                <ChevronLeft size={22} />
              </button>
            </MagneticCTA>
          </div>
          <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <MagneticCTA strength={0.3} radius={70}>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/50 hover:bg-[#F5DD20] hover:text-[#05251C] text-white transition-all duration-300 border border-white/20 shadow-md cursor-pointer"
                style={{ margin: 0, padding: 0 }}
                aria-label="Slide tiếp theo"
              >
                <ChevronRight size={22} />
              </button>
            </MagneticCTA>
          </div>
        </>
      )}

      {/* Slide Indicators Dots */}
      {bannerList.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {bannerList.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 border-none p-0 cursor-pointer
                ${index === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
              style={{ margin: 0 }}
              aria-label={`Đi tới slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </MotionSection>
  );
};

export default HeroBanner;
