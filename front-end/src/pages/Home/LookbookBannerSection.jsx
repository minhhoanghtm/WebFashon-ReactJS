import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { getActiveBannersService, trackBannerClickService } from "../../services/banner.service";

const LookbookBannerSection = () => {
  const [lookbookBanners, setLookbookBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const banners = await getActiveBannersService();
        if (isMounted) {
          const filtered = banners.filter(b => b.position === "home_lookbook");
          filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setLookbookBanners(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi tải Lookbook Banner:", error);
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

  if (loading || lookbookBanners.length === 0) {
    return null;
  }

  return (
    <section className="home-section home-lookbook-banners mt-12 animate-in fade-in duration-500">
      <div className="space-y-6">
        {lookbookBanners.map((banner) => (
          <div
            key={banner._id || banner.id}
            onClick={() => handleBannerClick(banner)}
            className="group relative w-full h-[360px] md:h-[420px] rounded-[22px] overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-150/40 bg-gray-900 flex items-end"
          >
            {/* Background Image */}
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition duration-700 pointer-events-none"
            />
            
            {/* Elegant Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300" />
            
            {/* Lookbook Content */}
            <div className="relative z-10 p-8 md:p-12 text-left max-w-xl space-y-4 select-none">
              <span className="inline-block text-[10px] font-bold tracking-widest text-amber-500 bg-amber-950/45 px-2.5 py-0.5 rounded-full uppercase">
                Bộ sưu tập mới
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-sm font-sans">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-xs md:text-sm text-gray-300 font-medium leading-relaxed line-clamp-3">
                  {banner.subtitle}
                </p>
              )}
              <div className="pt-2">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-md group-hover:bg-slate-100 transition cursor-pointer"
                >
                  <span>{banner.buttonText || "Khám phá Lookbook"}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LookbookBannerSection;
