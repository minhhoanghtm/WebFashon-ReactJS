import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "../../services/banner.service";
import AnimatedSection from "../../components/motion/AnimatedSection";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";
import FabricCurtainReveal from "../../components/motion/FabricCurtainReveal";
import MagneticCTA from "../../components/motion/MagneticCTA";
import SoftImageFollow from "../../components/motion/SoftImageFollow";
import { motionEase } from "../../config/motionTokens";

const MotionDiv = motion.div;

const PromotionBannerSection = () => {
  const [promoBanners, setPromoBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 8000);

    const fetchBanners = async () => {
      try {
        const banners = await getActiveBannersService();
        if (isMounted) {
          const filtered = Array.isArray(banners)
            ? banners.filter((b) => b.position === "home_promotion")
            : [];
          filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setPromoBanners(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi tải Promotion Banner:", error);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };
    fetchBanners();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleBannerClick = async (banner) => {
    const bannerId = banner._id || banner.id;
    if (bannerId) {
      await trackBannerClickService(bannerId);
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

  const fallbackPromoBanners = [
    {
      _id: "promo-signature",
      title: "Ưu đãi 15% Đơn Hàng Đầu Tiên",
      subtitle: "Nhập mã WELCOME15 khi thanh toán để trải nghiệm phong cách may đo cao cấp.",
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
      buttonText: "Mua sắm ngay",
      targetType: "category",
      targetId: "all",
      isApi: false,
    },
    {
      _id: "promo-lookbook",
      title: "Cảm Hứng Phối Đồ Mùa Mới",
      subtitle: "Khám phá phong cách thanh lịch đương đại được tuyển chọn kỹ lưỡng bởi các stylist.",
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
      buttonText: "Xem Lookbook",
      targetType: "lookbook",
      targetId: "",
      isApi: false,
    },
  ];

  const displayBanners = promoBanners.length > 0 ? promoBanners : fallbackPromoBanners;

  if (loading) {
    return null;
  }

  const getGridClass = () => {
    const count = displayBanners.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <AnimatedSection
      variant="scale"
      className="home-section home-promotions mt-14"
    >
      <StaggerContainer
        staggerDelay={0.08}
        className={`grid gap-6 ${getGridClass()}`}
      >
        {displayBanners.map((banner) => (
          <StaggerItem key={banner._id || banner.id}>
            <FabricCurtainReveal
              className="rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500"
              curtainColor="bg-neutral-950"
            >
              <MotionDiv
                whileHover={{ y: -4, transition: { duration: 0.3, ease: motionEase.cinematic } }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleBannerClick(banner)}
                className="group relative h-[250px] sm:h-[270px] overflow-hidden cursor-pointer border border-black/5 bg-neutral-900 flex items-center"
              >
                {/* Background Image with Soft Follow & Scale */}
                <SoftImageFollow maxOffset={8} scaleOnHover={1.06} className="absolute inset-0 w-full h-full">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover pointer-events-none opacity-85"
                  />
                </SoftImageFollow>

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent transition-opacity duration-300 pointer-events-none" />

                {/* Text Content */}
                <div className="relative z-10 p-7 sm:p-9 text-left max-w-[85%] space-y-2.5 select-none pointer-events-none">
                  <span className="inline-block text-[10px] font-extrabold tracking-[0.2em] text-[#F5DD20] uppercase">
                    Ưu đãi đặc quyền
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm font-heading">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-neutral-300 font-medium line-clamp-2 max-w-sm">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="pt-2 pointer-events-auto">
                    <MagneticCTA strength={0.2} radius={50}>
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-white border-b-2 border-[#F5DD20] pb-1 group-hover:gap-3 transition-all">
                        <span>{banner.buttonText || "Khám phá ngay"}</span>
                        <ArrowRight size={14} className="text-[#F5DD20] transition-transform group-hover:translate-x-1" />
                      </span>
                    </MagneticCTA>
                  </div>
                </div>
              </MotionDiv>
            </FabricCurtainReveal>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </AnimatedSection>
  );
};

export default PromotionBannerSection;
