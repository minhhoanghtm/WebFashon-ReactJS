import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import recommendationApi from "@/api/recommendationApi";
import experimentApi from "@/api/experimentApi";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "./SectionHeader";
import { normalizeProduct } from "./productAdapter";
import AnimatedSection from "../../components/motion/AnimatedSection";
import InertialRail from "../../components/motion/InertialRail";
import useSectionVisibility from "@/hooks/useSectionVisibility";
import { getAnonymousId } from "@/utils/anonymousId";

/**
 * Editorial Warm Ivory Shimmer Skeleton Card
 * Matches the warm, crafted aesthetic of 404Studio
 */
const SkeletonCard = () => (
  <div className="flex flex-col bg-[#FAF9F5] dark:bg-[#151D18] border border-[#E8E5DF] dark:border-[#05251C]/40 rounded-2xl overflow-hidden relative shadow-xs">
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
);

const RecommendedSection = ({
  categoryMap = {},
  favoriteIds = new Set(),
  onToggleFavorite,
}) => {
  const queryClient = useQueryClient();

  // 1. TanStack Query with safety timeout (8s max) to prevent infinite skeleton
  const {
    data: recResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", 8],
    queryFn: async () => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Recommendation request timeout")), 8000)
      );

      const res = await Promise.race([
        recommendationApi.getRecommendations(8),
        timeoutPromise,
      ]);

      return res?.data || { products: [], mode: "popular" };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 1,
  });

  // 2. Multi-tier data resolution: API recommendations -> Client Cache -> Empty
  const apiProducts = Array.isArray(recResponse?.products)
    ? recResponse.products
    : Array.isArray(recResponse)
    ? recResponse
    : [];

  const rawMode = recResponse?.mode || "popular";

  let finalProducts = apiProducts;
  let activeMode = rawMode;

  // Client-side fallback if backend returns empty or errors out
  if (finalProducts.length === 0) {
    const cachedProducts = queryClient.getQueryData(["products"]);
    if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
      finalProducts = cachedProducts.slice(0, 8);
      activeMode = "popular";
    }
  }

  const products = finalProducts.map((p, idx) =>
    normalizeProduct(p, idx, categoryMap)
  );

  // Ghi nhận tiếp xúc thực tế (experiment_exposed) CHỈ KHI recommendation thực sự hiển thị trong viewport
  const exposedRef = React.useRef(false);
  const { ref: sectionRef, isVisible } = useSectionVisibility({
    threshold: 0.15,
    once: true,
  });

  React.useEffect(() => {
    if (!exposedRef.current && isVisible && products.length > 0 && recResponse?.experiment?.variant) {
      exposedRef.current = true;
      experimentApi.recordExposure({
        experiment_id: recResponse.experiment.experiment_id,
        variant: recResponse.experiment.variant,
        request_id: recResponse.experiment.request_id,
        anonymous_id: getAnonymousId(),
        meta: {
          product_count: products.length,
          mode: activeMode,
        },
      }).catch(() => {});
    }
  }, [isVisible, products.length, recResponse?.experiment, activeMode]);

  // 3. Mode-based titles and subtitles
  const headerContent = (() => {
    switch (activeMode) {
      case "personalized":
        return {
          eyebrow: "CHAPTER 04 · BẢN PHỐI CÁ NHÂN HÓA",
          title: "Dành riêng cho bạn",
          subtitle: "Những sản phẩm được chọn lọc dựa trên phong cách của bạn",
        };
      case "mixed":
        return {
          eyebrow: "CHAPTER 04 · GỢI Ý RIÊNG CHO BẠN",
          title: "Gợi ý cho bạn",
          subtitle: "Gợi ý kết hợp giữa sở thích của bạn và những thiết kế được yêu thích nhất",
        };
      case "popular":
      default:
        return {
          eyebrow: "CHAPTER 04 · XU HƯỚNG THỊ HÀNH",
          title: "Đang được yêu thích",
          subtitle: "Tuyển chọn những thiết kế bán chạy và mới về tại 404Studio",
        };
    }
  })();

  return (
    <AnimatedSection
      id="danh-cho-ban"
      variant="fade-up"
      className="home-section home-products"
      aria-labelledby="home-rec-title"
    >
      <div className="home-products__heading mb-6" data-cursor="hidden">
        <SectionHeader
          id="home-rec-title"
          eyebrow={headerContent.eyebrow}
          title={headerContent.title}
          subtitle={headerContent.subtitle}
        />
      </div>

      <div ref={sectionRef} className="min-h-[380px]">
        {isLoading ? (
          <div className="home-products__grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={`rec-skeleton-${index}`} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <InertialRail itemWidth={270} gap={20} ariaLabel="Dải sản phẩm đề xuất riêng">
            {products.map((product, index) => (
              <div key={product.id} className="w-[240px] sm:w-[270px] flex-shrink-0">
                <ProductCard
                  product={product}
                  isFavorite={favoriteIds.has(String(product.id))}
                  onToggleFavorite={onToggleFavorite}
                  trackingMeta={{
                    source: "recommend",
                    mode: activeMode,
                    isRecommendation: true,
                    algorithm: activeMode,
                    position: index + 1,
                    experiment_id: recResponse?.experiment?.experiment_id || null,
                    variant: recResponse?.experiment?.variant || null,
                    request_id: recResponse?.experiment?.request_id || null,
                  }}
                />
              </div>
            ))}
          </InertialRail>
        ) : (
          /* 4. Elegant empty state: NEVER returns null to create jarring blanks */
          <div className="home-products__state home-products__state--empty min-h-[260px] flex flex-col items-center justify-center text-[#77736E] gap-4 py-12 px-6 rounded-3xl border border-[#E8E5DF] bg-[#FAF9F5] text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#073D2A]/10 text-[#073D2A] flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base sm:text-lg text-[#171717]">
                Bộ sưu tập đang được cập nhật
              </h3>
              <p className="text-xs sm:text-sm text-[#77736E] max-w-md">
                {isError
                  ? "Tạm thời không thể kết nối đến máy chủ gợi ý. Bạn vẫn có thể khám phá toàn bộ sản phẩm bên dưới."
                  : "Chúng tôi đang tuyển chọn những gợi ý may đo đặc sắc nhất dành riêng cho bạn."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-100 text-[#171717] border border-[#E8E5DF] rounded-full transition shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw size={13} />
                <span>Thử lại</span>
              </button>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#05251C] text-[#FAF9F5] hover:bg-[#F5DD20] hover:text-[#05251C] rounded-full transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
};

export default RecommendedSection;
