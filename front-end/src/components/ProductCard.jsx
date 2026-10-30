import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-toastify";
import { useFavoriteStore } from "@/store/favorite.store";
import trackingService from "@/services/tracking.service";
import useProductImpression from "@/hooks/useProductImpression";
import SoftImageFollow from "@/components/motion/SoftImageFollow";
import MagneticCTA from "@/components/motion/MagneticCTA";
import defaultFallbackImage from "@/pages/Home/assets/product-linen-shirt.jpg";

const MotionArticle = motion.article;
const MotionButton = motion.button;

const ProductCard = ({ product, isFavorite, onToggleFavorite, trackingMeta = null }) => {
  const navigate = useNavigate();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleStoredFavorite = useFavoriteStore((state) => state.toggleProduct);

  if (!product) return null;

  const productId = String(product.id || product._id || "");
  const isStoredFavorite = favoriteItems.some((item) => String(item.id) === productId);
  const effectiveIsFavorite = isFavorite ?? isStoredFavorite;
  const productPath = product.slug ? `/product/${product.slug}` : "/products";

  const displayImage =
    product.displayProduct?.[0] ||
    product.image ||
    defaultFallbackImage;
  const hoverImage =
    product.displayProduct?.[1] ||
    product.images?.[1] ||
    product.variants?.find((v) => v.image_url && v.image_url !== displayImage)?.image_url ||
    null;

  const price = product.price ?? product.new_price ?? 0;
  const oldPrice = product.oldPrice ?? product.old_price ?? 0;
  const rating = product.rating ?? product.rate ?? 0;
  const category = product.category ?? "Thời trang";

  const campaign = product.campaign;
  const isFlashSale = campaign?.type === "flash_sale" || product.campaign_type === "flash_sale";
  const isSeasonal = campaign?.type === "seasonal" || product.campaign_type === "seasonal";
  const discountPercent =
    campaign?.discountPercentage ||
    (oldPrice > price && price > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0);

  const quota = product.quota ?? campaign?.quota ?? null;
  const sold = product.sold_campaign ?? product.soldQuota ?? campaign?.sold ?? null;
  const remainingQuota =
    product.remainingQuota ??
    campaign?.remainingQuota ??
    (quota && sold !== null ? Math.max(0, quota - sold) : null);
  const isQuotaExhausted = campaign?.isQuotaExhausted || remainingQuota === 0;

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = defaultFallbackImage;
  };

  const impressionRef = useProductImpression(product, {
    isRecommendation: !!trackingMeta?.isRecommendation,
    algorithm: trackingMeta?.algorithm || "hybrid",
    position: trackingMeta?.position || 0,
  });

  const handleCardClick = (event) => {
    if (
      event.target.closest("a") ||
      event.target.closest("button") ||
      event.target.closest(".favorite-btn")
    ) {
      return;
    }
    if (productId) {
      if (trackingMeta?.isRecommendation) {
        trackingService.trackRecommendationClick(
          product,
          trackingMeta?.algorithm || "hybrid",
          trackingMeta?.position || 0,
          {
            experiment_id: trackingMeta?.experiment_id || null,
            variant: trackingMeta?.variant || null,
            request_id: trackingMeta?.request_id || null,
          }
        );
      } else {
        if (trackingMeta?.search_query) {
          trackingService.trackSearchResultClick(
            productId,
            trackingMeta.search_query,
            trackingMeta?.position || 0
          );
        }
        trackingService.trackProductClick(product, {
          campaign_id: campaign?.id || null,
          price,
          ...(trackingMeta || {}),
        });
      }
    }
    navigate(productPath);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextFavoriteState = !effectiveIsFavorite;
    trackingService.trackProductFavorite(productId, nextFavoriteState);

    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      toggleStoredFavorite(product);
      toast.success(
        isStoredFavorite
          ? `Đã bỏ "${product.name}" khỏi danh sách yêu thích!`
          : `Đã thêm "${product.name}" vào danh sách yêu thích!`
      );
    }
  };

  return (
    <MotionArticle
      ref={impressionRef}
      onClick={handleCardClick}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-[#05251C]/10 dark:border-slate-800/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#073D2A]/30 cursor-pointer w-full will-change-transform"
    >
      {/* Media section với Soft Image Follow & Image Hover Swap */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
        <SoftImageFollow maxOffset={5} scaleOnHover={1.04} className="w-full h-full">
          <Link to={productPath} className="block w-full h-full relative">
            {/* Primary image */}
            <img
              src={displayImage}
              alt={product.name}
              loading="lazy"
              onError={handleImageError}
              className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
                hoverImage ? "group-hover:opacity-0" : ""
              }`}
            />

            {/* Secondary image (hover crossfade swap) */}
            {hoverImage && (
              <img
                src={hoverImage}
                alt={`${product.name} alternate view`}
                loading="lazy"
                onError={handleImageError}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
              />
            )}
          </Link>
        </SoftImageFollow>

        {/* Badges */}
        {product.badge ? (
          <span className="absolute top-3 left-3 bg-[#05251C]/90 backdrop-blur-xs text-[#FBF9F5] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider z-10 pointer-events-none">
            {product.badge}
          </span>
        ) : isFlashSale ? (
          <span className="absolute top-3 left-3 bg-[#073D2A] text-[#F5DD20] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 uppercase tracking-wide pointer-events-none border border-[#F5DD20]/20">
            <Zap size={11} fill="currentColor" /> Flash Sale {discountPercent > 0 ? `-${discountPercent}%` : ""}
          </span>
        ) : isSeasonal ? (
          <span className="absolute top-3 left-3 bg-[#05251C] text-[#FBF9F5] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md z-10 uppercase tracking-wide pointer-events-none">
            Sale Mùa {discountPercent > 0 ? `-${discountPercent}%` : ""}
          </span>
        ) : discountPercent > 0 ? (
          <span className="absolute top-3 left-3 bg-[#F5DD20] text-[#05251C] text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs z-10 pointer-events-none uppercase tracking-wide">
            -{discountPercent}%
          </span>
        ) : null}

        {/* Favorite Button with Tactile Magnetic Spring */}
        <div className="absolute top-3 right-3 z-20">
          <MagneticCTA strength={0.25} radius={45}>
            <MotionButton
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.82 }}
              onClick={handleFavoriteClick}
              className="favorite-btn w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-md hover:bg-white text-neutral-400 hover:text-[#05251C] cursor-pointer transition-colors"
              aria-label="Yêu thích"
            >
              <Heart
                size={15}
                fill={effectiveIsFavorite ? "#05251C" : "none"}
                className={effectiveIsFavorite ? "text-[#05251C]" : ""}
              />
            </MotionButton>
          </MagneticCTA>
        </div>

        {/* Quick view bar on hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none hidden sm:block z-10">
          <div className="w-full py-2 bg-[#05251C] text-[#FBF9F5] rounded-xl text-center text-xs font-bold uppercase tracking-wider shadow-lg">
            Xem thiết kế
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="flex flex-col flex-1 p-4 text-left">
        <span className="micro-label text-[#05251C]/60 mb-1">
          {category}
        </span>
        <Link
          to={productPath}
          className="text-sm font-bold text-[#05251C] line-clamp-2 hover:text-[#073D2A] transition duration-200 mb-2 min-h-[40px]"
        >
          {product.name}
        </Link>

        {/* Thanh còn lại / Đã bán cho Flash Sale */}
        {isFlashSale && quota > 0 && (
          <div className="mb-2">
            <div className="flex justify-between items-center text-[10px] font-semibold text-neutral-600 mb-1">
              <span>{isQuotaExhausted ? "Đã hết suất ưu đãi" : `Đã bán ${sold || 0}/${quota}`}</span>
              <span className={isQuotaExhausted ? "text-neutral-500" : "text-[#073D2A] font-bold"}>
                {isQuotaExhausted ? "0 suất" : `Còn ${remainingQuota}`}
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${isQuotaExhausted ? "bg-neutral-400" : "bg-[#073D2A]"}`}
                style={{
                  width: `${Math.min(100, Math.round(((sold || 0) / quota) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Rating and Price Row */}
        <div className="flex items-end justify-between mt-auto pt-3 border-t border-neutral-100">
          {/* Rating */}
          <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
            <Star size={12} fill="currentColor" className="text-amber-500" />
            {rating.toLocaleString("vi-VN", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>

          {/* Pricing */}
          <div className="flex flex-col items-end">
            <strong className="text-sm font-extrabold text-neutral-950 tabular-nums">
              {price > 0 ? formatPrice(price) : "Liên hệ"}
            </strong>
            {oldPrice > price && price > 0 && (
              <del className="text-[11px] text-neutral-400 font-medium line-through tabular-nums">
                {formatPrice(oldPrice)}
              </del>
            )}
          </div>
        </div>
      </div>
    </MotionArticle>
  );
};

// Helper for formatting currency
const formatPrice = (val) => {
  return val.toLocaleString("vi-VN") + " VNĐ";
};

export default ProductCard;
