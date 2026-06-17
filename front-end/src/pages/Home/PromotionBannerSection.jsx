import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "../../services/banner.service";

const PromotionBannerSection = () => {
  const [promoBanners, setPromoBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const banners = await getActiveBannersService();
        if (isMounted) {
          const filtered = banners.filter(
            (b) => b.position === "home_promotion",
          );
          // Sort by sortOrder ascending
          filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setPromoBanners(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi tải Promotion Banner:", error);
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

  if (loading || promoBanners.length === 0) {
    return null;
  }

  // Grid layout class based on number of banners
  const getGridClass = () => {
    const count = promoBanners.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <section className="home-section home-promotions mt-12 animate-in fade-in duration-500">
      <div className={`grid gap-6 ${getGridClass()}`}>
        {promoBanners.map((banner) => (
          <div
            key={banner._id || banner.id}
            onClick={() => handleBannerClick(banner)}
            className="group relative h-[240px] rounded-[22px] overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-150/40 bg-gray-50 flex items-center"
          >
            {/* Background Image */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition duration-700 pointer-events-none"
            />

            {/* Dark/Glassy overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent transition-opacity duration-300" />

            {/* Text Content */}
            <div className="relative z-10 p-8 text-left max-w-[80%] space-y-3 select-none">
              <span className="inline-block text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                Ưu đãi đặc biệt
              </span>
              <h3 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className="text-xs text-gray-250 font-medium line-clamp-2">
                  {banner.subtitle}
                </p>
              )}
              <button className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white border-b border-white pb-0.5 hover:gap-2.5 transition-all duration-300">
                {banner.buttonText && (
                  <div>
                    <span>{banner.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
                {/* <ArrowRight className="h-3.5 w-3.5" /> */}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromotionBannerSection;
