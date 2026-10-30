import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import AnimatedSection from "../../components/motion/AnimatedSection";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";
import DirectionalCard from "../../components/motion/DirectionalCard";
import MagneticCTA from "../../components/motion/MagneticCTA";

const curatedFallbackCategories = [
  {
    _id: "cat-ao-so-mi",
    name: "Áo sơ mi & Tops",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80",
    itemCount: "24 thiết kế",
  },
  {
    _id: "cat-blazer",
    name: "Blazer & Áo khoác",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80",
    itemCount: "18 thiết kế",
  },
  {
    _id: "cat-quan-tay",
    name: "Quần tây & Denim",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80",
    itemCount: "16 thiết kế",
  },
  {
    _id: "cat-dam-vay",
    name: "Đầm & Chân váy",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=80",
    itemCount: "20 thiết kế",
  },
  {
    _id: "cat-phu-kien",
    name: "Túi & Phụ kiện",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80",
    itemCount: "12 thiết kế",
  },
];

const CategoryShowcase = ({
  categories = [],
  loading = false,
  selectedCategoryId = "all",
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const displayCategories =
    categories && categories.length > 0 ? categories : curatedFallbackCategories;

  return (
    <AnimatedSection
      variant="fade-up"
      className="home-section home-categories"
      aria-labelledby="home-categories-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <SectionHeader
          id="home-categories-title"
          eyebrow="CHAPTER 02 · DANH MỤC THIẾT KẾ"
          title="Khám phá danh mục"
          subtitle="Những phom dáng thời trang may đo tinh xảo cho phong cách thường nhật và công sở"
        />
        <div className="hidden sm:flex items-center gap-2">
          <MagneticCTA strength={0.25} radius={60}>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-900 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Xem danh mục trước"
            >
              <ChevronLeft size={18} />
            </button>
          </MagneticCTA>
          <MagneticCTA strength={0.25} radius={60}>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-900 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Xem danh mục tiếp theo"
            >
              <ChevronRight size={18} />
            </button>
          </MagneticCTA>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-40 sm:w-48 h-56 sm:h-64 bg-neutral-200/60 rounded-2xl animate-pulse relative overflow-hidden"
            />
          ))}
        </div>
      ) : (
        <div className="relative group/scroll">
          <StaggerContainer
            ref={scrollContainerRef}
            staggerDelay={0.06}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory"
          >
            {/* "Tất cả" (All) Category Card with Directional Reveal */}
            <StaggerItem>
              <DirectionalCard
                onClick={() => onSelectCategory && onSelectCategory("all")}
                className={`flex-shrink-0 w-36 sm:w-44 h-52 sm:h-60 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border snap-start text-left block ${
                  selectedCategoryId === "all"
                    ? "border-[#073D2A] ring-2 ring-[#073D2A]/30 shadow-lg scale-[1.02]"
                    : "border-black/5"
                }`}
                overlay={
                  <div className="p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between text-white">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5DD20]">
                      Explore All
                    </span>
                    <ArrowUpRight size={14} className="text-[#F5DD20]" />
                  </div>
                }
              >
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80"
                  alt="Tất cả sản phẩm"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-all duration-300" />

                {selectedCategoryId === "all" && (
                  <span className="absolute top-3 right-3 bg-[#073D2A] text-[#F5DD20] text-[9px] font-black px-2.5 py-0.5 rounded-full z-20 shadow-sm uppercase tracking-wider border border-[#F5DD20]/20">
                    Đang chọn
                  </span>
                )}

                <div className="absolute bottom-0 inset-x-0 p-4 text-center z-10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5DD20]/90 block mb-0.5">
                    Bộ sưu tập
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm select-none font-heading group-hover:text-[#F5DD20] transition-colors">
                    Tất cả
                  </h3>
                </div>
              </DirectionalCard>
            </StaggerItem>

            {/* Dynamic / Curated Category Cards */}
            {displayCategories.map((cat) => {
              const isSelected = String(cat._id) === String(selectedCategoryId);
              return (
                <StaggerItem key={cat._id}>
                  <DirectionalCard
                    onClick={() => onSelectCategory && onSelectCategory(cat._id)}
                    className={`flex-shrink-0 w-36 sm:w-44 h-52 sm:h-60 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border snap-start text-left block ${
                      isSelected
                        ? "border-[#073D2A] ring-2 ring-[#073D2A]/30 shadow-lg scale-[1.02]"
                        : "border-black/5"
                    }`}
                    overlay={
                      <div className="p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between text-white">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5DD20]">
                          Khám phá
                        </span>
                        <ArrowUpRight size={14} className="text-[#F5DD20]" />
                      </div>
                    }
                  >
                    <img
                      src={cat.image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500"}
                      alt={cat.name}
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500";
                      }}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-all duration-300" />

                    {isSelected && (
                      <span className="absolute top-3 right-3 bg-[#073D2A] text-[#F5DD20] text-[9px] font-black px-2.5 py-0.5 rounded-full z-20 shadow-sm uppercase tracking-wider border border-[#F5DD20]/20">
                        Đang chọn
                      </span>
                    )}

                    <div className="absolute bottom-0 inset-x-0 p-4 text-center z-10">
                      {cat.itemCount && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-300/90 block mb-0.5">
                          {cat.itemCount}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm select-none font-heading group-hover:text-[#F5DD20] transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                  </DirectionalCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      )}
    </AnimatedSection>
  );
};

export default CategoryShowcase;
