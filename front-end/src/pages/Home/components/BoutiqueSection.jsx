import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HOME_CONTENT from "../content";

export const BoutiqueSection = ({
  products = [],
  favoriteIds = new Set(),
  onToggleFavorite,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const { boutique } = HOME_CONTENT;

  // Limit strictly to 4 to 6 curated products
  const curatedProducts = products.slice(0, 6);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNext = () => {
    setActiveSlide((prev) =>
      prev + 3 < curatedProducts.length ? prev + 1 : prev
    );
  };

  if (curatedProducts.length === 0) return null;

  const visibleProducts =
    curatedProducts.length > 3
      ? curatedProducts.slice(activeSlide, activeSlide + 3)
      : curatedProducts;

  return (
    <section
      aria-labelledby="boutique-section-heading"
      className="relative z-10 bg-[#FBF9F5] text-[#05251C] px-4 py-20 sm:px-8 sm:py-32 lg:px-14 border-t border-[#05251C]/10"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Interactive Product Showcase Slider (~65%) */}
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
            <div className="flex items-center justify-between pb-2">
              <span className="font-mono text-xs tracking-widest text-[#05251C]/50 uppercase">
                TUYỂN TẬP {curatedProducts.length} THIẾT KẾ ĐỘC BẢN
              </span>

              {/* Slider Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Xem sản phẩm trước"
                  className="flex h-10 w-10 items-center justify-center border border-[#05251C]/20 text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5]"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Xem sản phẩm kế tiếp"
                  className="flex h-10 w-10 items-center justify-center border border-[#05251C]/20 text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Product Cards Grid / Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {visibleProducts.map((product, idx) => (
                <div
                  key={product.id || `boutique-${idx}`}
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <ProductCard
                    product={product}
                    isFavorite={favoriteIds.has(String(product.id))}
                    onToggleFavorite={onToggleFavorite}
                    trackingMeta={{
                      position: idx + 1,
                      source: "home_boutique_curated",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Narrative Context & Store CTA (~35%) */}
          <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-32 space-y-6">
            <div className="space-y-1">
              <span className="font-mono text-xs tracking-[0.28em] text-[#05251C]/60 uppercase">
                {boutique.eyebrow}
              </span>
              <div className="h-[1px] w-12 bg-[#05251C]/20" />
            </div>

            <h2
              id="boutique-section-heading"
              className="font-condensed text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-[#05251C] leading-none"
            >
              {boutique.title}
            </h2>

            <p className="font-sans text-xs sm:text-sm text-[#05251C]/75 leading-relaxed">
              {boutique.description}
            </p>

            <div className="pt-2">
              <Link
                to="/products"
                className="group inline-flex min-h-[48px] items-center gap-3 border border-[#05251C]/40 bg-transparent px-8 py-3.5 text-xs font-semibold tracking-[0.26em] text-[#05251C] uppercase transition-all duration-300 hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5]"
              >
                <span>{boutique.cta}</span>
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoutiqueSection;
