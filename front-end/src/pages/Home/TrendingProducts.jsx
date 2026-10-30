import React, { useState } from "react";
import { PackageSearch, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProductCard from "../../components/ProductCard";
import SectionHeader from "./SectionHeader";
import AnimatedSection from "../../components/motion/AnimatedSection";
import MagneticCTA from "../../components/motion/MagneticCTA";
import { motionEase, motionDuration } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const TrendingProducts = ({
  products = [],
  limit = 8,
  isLoading,
  hasError,
  isUsingFallback,
  favoriteIds,
  onToggleFavorite,
  title = "Sản phẩm nổi bật",
}) => {
  const [visibleCount, setVisibleCount] = useState(limit);
  const prefersReduced = usePrefersReducedMotion();

  const displayedProducts = Array.isArray(products)
    ? products.slice(0, visibleCount)
    : [];

  const hasMore = Array.isArray(products) && products.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  const gridVariants = {
    initial: { opacity: 0, y: 14, scale: 0.99 },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReduced ? 0.1 : 0.4,
        ease: motionEase.editorialReveal,
        staggerChildren: prefersReduced ? 0 : 0.05,
        delayChildren: 0.04,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.99,
      transition: {
        duration: prefersReduced ? 0.05 : 0.18,
        ease: motionEase.inOutCubic,
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 16 },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionDuration.base,
        ease: motionEase.cinematic,
      },
    },
    exit: { opacity: 0 },
  };

  return (
    <AnimatedSection
      id="san-pham-noi-bat"
      variant="fade-up"
      className="home-section home-products"
      aria-labelledby="home-products-title"
    >
      <div className="home-products__heading mb-6">
        <SectionHeader
          id="home-products-title"
          eyebrow="CHAPTER 03 · TUYỂN CHỌN ĐẶC QUYỀN"
          title={title}
          subtitle="Những lựa chọn được yêu thích nhất dành cho phong cách hằng ngày"
        />
        {isUsingFallback && (
          <span className="home-products__source" role="status">
            {hasError ? "Đang hiển thị bộ sưu tập gợi ý" : "Bộ sưu tập gợi ý"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="home-products__grid min-h-[420px]">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`trending-skel-${idx}`}
              className="flex flex-col bg-[#FAF9F5] dark:bg-[#151D18] border border-[#E8E5DF] dark:border-[#05251C]/40 rounded-2xl overflow-hidden relative shadow-xs"
            >
              <div className="w-full aspect-[3/4] bg-[#EFECE6] dark:bg-[#1D2922] relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
              </div>
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-[#E8E5DF] dark:bg-[#22332A] rounded w-3/4 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
                </div>
                <div className="h-3 bg-[#E8E5DF]/70 dark:bg-[#22332A]/70 rounded w-1/2" />
                <div className="h-4 bg-[#E8E5DF] dark:bg-[#22332A] rounded w-1/3 pt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedProducts.length > 0 ? (
        <div className="space-y-8 min-h-[420px]">
          {/* Animated Category Transition on Tab Switch */}
          <AnimatePresence mode="wait">
            <MotionDiv
              key={title}
              variants={gridVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="home-products__grid"
            >
              {displayedProducts.map((product) => (
                <MotionDiv
                  key={product.id}
                  variants={cardVariants}
                  className="w-full"
                >
                  <ProductCard
                    product={product}
                    isFavorite={favoriteIds.has(product.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                </MotionDiv>
              ))}
            </MotionDiv>
          </AnimatePresence>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <MagneticCTA strength={0.25} radius={80}>
                <MotionButton
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#073D2A] hover:bg-[#0E5A3E] text-[#FBF9F5] text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <span>Xem thêm sản phẩm</span>
                  <ArrowDown size={14} />
                </MotionButton>
              </MagneticCTA>
            </div>
          )}
        </div>
      ) : (
        <div className="home-products__state home-products__state--empty min-h-[300px] flex flex-col items-center justify-center text-neutral-400 gap-3 py-16">
          <PackageSearch size={36} aria-hidden="true" />
          <span className="text-sm font-medium">Không tìm thấy sản phẩm phù hợp trong danh mục này</span>
        </div>
      )}
    </AnimatedSection>
  );
};

export default TrendingProducts;
