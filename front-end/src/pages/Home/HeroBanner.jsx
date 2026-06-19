import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "./assets/hero-atelier.jpg";
import { getActiveBannersService, trackBannerClickService } from "../../services/banner.service";

const HeroBanner = () => {
  const navigate = useNavigate();
  const [activeBanners, setActiveBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const banners = await getActiveBannersService();
        if (isMounted) {
          const heroBanners = banners.filter(b => b.position === "home_hero");
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

  // Build list of slides: map API active banners
  const bannerList = activeBanners.map(b => ({
    id: b._id || b.id,
    // TEMPORARY FIX: Correct typo "Wellcome" to "Welcome" from database strings until fixed in MongoDB.
    title: b.title ? b.title.replace(/Wellcome/gi, "Welcome") : "",
    subtitle: b.subtitle ? b.subtitle.replace(/Wellcome/gi, "Welcome") : "",
    eyebrow: "Thiết kế nổi bật",
    buttonText: b.buttonText || "Khám phá ngay",
    imageUrl: b.imageUrl,
    mobileImageUrl: b.mobileImageUrl,
    targetType: b.targetType,
    targetId: b.targetId,
    linkUrl: b.linkUrl,
    isApi: true
  }));

  // Auto-play timer
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

  if (bannerList.length === 0) {
    return null;
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
    if (banner.isApi && banner.id) {
      // Increment clickCount in the background
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

  return (
    <section className="home-hero group min-h-[510px] relative w-full overflow-hidden rounded-[22px] bg-[#272522]">
      {bannerList.map((banner, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={banner.id + "-" + index}
            onClick={() => handleBannerClick(banner)}
            className={`absolute inset-0 w-full h-full cursor-pointer transition-all duration-1000 ease-in-out flex items-center
              ${isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"}`}
          >
            {/* Slide Background Image */}
            <picture className="absolute inset-0 w-full h-full select-none">
              {banner.mobileImageUrl && (
                <source media="(max-width: 768px)" srcSet={encodeURI(banner.mobileImageUrl)} />
              )}
              <img
                src={banner.imageUrl ? encodeURI(banner.imageUrl) : ""}
                alt={banner.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            </picture>

            {/* Premium Dark Overlay */}
            <div className="home-hero__overlay" />

            {/* Slide Text Content */}
            <div className="home-hero__content select-none">
              <span className="home-hero__eyebrow">{banner.eyebrow}</span>
              <h1 id="home-hero-title" className="drop-shadow-sm">{banner.title}</h1>
              {banner.subtitle && <p>{banner.subtitle}</p>}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(banner);
                }}
              >
                {banner.buttonText}
                <ArrowDown size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Slide Navigation Buttons */}
      {bannerList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 hover:bg-white hover:text-black text-white transition-all duration-300 opacity-0 group-hover:opacity-100 border-none shadow-sm cursor-pointer"
            style={{ margin: 0, padding: 0 }}
            aria-label="Slide trước"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 hover:bg-white hover:text-black text-white transition-all duration-300 opacity-0 group-hover:opacity-100 border-none shadow-sm cursor-pointer"
            style={{ margin: 0, padding: 0 }}
            aria-label="Slide tiếp theo"
          >
            <ChevronRight size={22} />
          </button>
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
    </section>
  );
};

export default HeroBanner;
