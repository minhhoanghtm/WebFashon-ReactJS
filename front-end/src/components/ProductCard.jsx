import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { gsap } from "gsap";
import { useFavoriteStore } from "@/store/favorite.store";
import trackingService from "@/services/tracking.service";
import useProductImpression from "@/hooks/useProductImpression";
import { formatCurrency } from "@/utils/format";

const ProductCard = ({
  product,
  isFavorite,
  onToggleFavorite,
  trackingMeta = null,
}) => {
  const navigate = useNavigate();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleStoredFavorite = useFavoriteStore((state) => state.toggleProduct);

  // Collect all unique candidate image URLs from product fields & variants
  const imageCandidates = useMemo(() => {
    if (!product) return [];
    const list = [
      ...(Array.isArray(product.displayProduct) ? product.displayProduct : []),
      ...(Array.isArray(product.images) ? product.images : []),
      product.image,
      product.imageUrl,
      product.image_url,
      product.thumbnail,
      ...(Array.isArray(product.variants)
        ? product.variants.map((v) => v?.image_url || v?.image)
        : []),
    ]
      .filter((u) => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim());
    return [...new Set(list)];
  }, [product]);

  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [hoverIdxError, setHoverIdxError] = useState(false);

  const impressionRef = useProductImpression(product, {
    isRecommendation: Boolean(trackingMeta?.isRecommendation),
    algorithm: trackingMeta?.algorithm || "hybrid",
    position: trackingMeta?.position || 0,
  });

  const quickToRef = useRef(null);

  // GSAP quickTo 3D Tilt (Max 6deg) with cleanup & motion queries
  useEffect(() => {
    const el = impressionRef?.current;
    if (!el) return undefined;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    if (prefersReduced || !canHover) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(el, { transformPerspective: 800, transformStyle: "preserve-3d" });
      const xTo = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power2.out" });
      const yTo = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power2.out" });
      quickToRef.current = { xTo, yTo };
    }, el);

    return () => {
      ctx.revert();
    };
  }, [impressionRef]);

  const handleMouseMove = (e) => {
    const el = impressionRef?.current;
    if (!quickToRef.current || !el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = (x / rect.width) * 2 - 1; // -1 to 1
    const yPercent = (y / rect.height) * 2 - 1; // -1 to 1

    // Maximum 6 degrees tilt
    quickToRef.current.xTo(xPercent * 6);
    quickToRef.current.yTo(-yPercent * 6);
  };

  const handleMouseLeave = () => {
    if (!quickToRef.current) return;
    quickToRef.current.xTo(0);
    quickToRef.current.yTo(0);
  };

  if (!product) return null;

  const productId = String(product.id || product._id || "");
  const isStoredFavorite = favoriteItems.some(
    (item) => String(item.id || item._id) === productId
  );
  const effectiveIsFavorite = isFavorite ?? isStoredFavorite;
  const productPath = product.slug ? `/product/${product.slug}` : "/products";

  const primaryImage = imageCandidates[primaryIdx] || "";
  const secondaryImage =
    !hoverIdxError && imageCandidates.length > primaryIdx + 1
      ? imageCandidates[primaryIdx + 1]
      : "";

  const hasValidPrimary = Boolean(primaryImage);
  const hasValidSecondary = Boolean(secondaryImage);

  const price = Number(product.price ?? product.new_price ?? 0);
  const oldPrice = Number(product.oldPrice ?? product.old_price ?? 0);
  const rating = Number(product.rating ?? product.rate ?? 0);
  const category = product.category || "";

  const campaign = product.campaign;
  const isFlashSale =
    campaign?.type === "flash_sale" || product.campaign_type === "flash_sale";
  const isSeasonal =
    campaign?.type === "seasonal" || product.campaign_type === "seasonal";

  const discountPercent =
    campaign?.discountPercentage ||
    (oldPrice > price && price > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0);

  const quota = product.quota ?? campaign?.quota ?? null;
  const sold =
    product.sold_campaign ?? product.soldQuota ?? campaign?.sold ?? null;
  const remainingQuota =
    product.remainingQuota ??
    campaign?.remainingQuota ??
    (quota && sold !== null ? Math.max(0, quota - sold) : null);
  const isQuotaExhausted =
    campaign?.isQuotaExhausted || remainingQuota === 0;

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

  const handleLinkClick = () => {
    if (!productId) return;
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
  };

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextFavoriteState = !effectiveIsFavorite;
    if (productId) {
      trackingService.trackProductFavorite(productId, nextFavoriteState);
    }

    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      toggleStoredFavorite(product);
      toast.success(
        effectiveIsFavorite
          ? `Đã xóa "${product.name}" khỏi danh sách yêu thích.`
          : `Đã lưu "${product.name}" vào danh sách yêu thích.`
      );
    }
  };

  return (
    <article
      ref={impressionRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-product-card
      className="group relative flex w-full cursor-pointer flex-col border border-border bg-card transition-colors hover:border-foreground/40 will-change-transform"
    >
      {/* Aspect 3:4 Portrait Garment Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        {hasValidPrimary ? (
          <>
            <img
              src={primaryImage}
              alt={product.name || "Thiết kế WebFashion"}
              loading="lazy"
              onError={() => setPrimaryIdx((prev) => prev + 1)}
              className={`h-full w-full object-cover object-center transition-opacity duration-500 ${
                hasValidSecondary ? "group-hover:opacity-0" : ""
              }`}
            />
            {hasValidSecondary && (
              <img
                src={secondaryImage}
                alt={`${product.name || "Thiết kế"} - góc nhìn 2`}
                loading="lazy"
                onError={() => setHoverIdxError(true)}
                className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          /* Monochrome Architectural Placeholder when all candidate images are missing or 404 */
          <div
            className="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
            aria-label="Khung chờ hình ảnh sản phẩm"
          >
            <div className="mb-3 flex h-14 w-10 items-center justify-center border border-border/80">
              <span className="font-serif text-xs tracking-[0.2em] uppercase text-muted-foreground">
                WF
              </span>
            </div>
            <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
              Atelier Archive
            </span>
          </div>
        )}

        {/* Top-Left Status / Campaign Badge */}
        {isFlashSale ? (
          <span className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-primary-foreground">
            <Zap size={11} fill="currentColor" />
            <span>
              Flash Sale {discountPercent > 0 ? `-${discountPercent}%` : ""}
            </span>
          </span>
        ) : isSeasonal ? (
          <span className="pointer-events-none absolute top-3 left-3 z-10 bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-primary-foreground">
            Ưu đãi mùa {discountPercent > 0 ? `-${discountPercent}%` : ""}
          </span>
        ) : discountPercent > 0 ? (
          <span className="pointer-events-none absolute top-3 left-3 z-10 border border-border bg-background/95 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-foreground">
            -{discountPercent}%
          </span>
        ) : null}

        {/* Top-Right Favorite Button (Touch Target >= 44x44px) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="favorite-btn touch-target absolute top-2 right-2 z-20 inline-flex items-center justify-center bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-background"
          aria-label={
            effectiveIsFavorite
              ? `Bỏ thích ${product.name}`
              : `Yêu thích ${product.name}`
          }
          aria-pressed={effectiveIsFavorite}
        >
          <Heart
            size={17}
            strokeWidth={1.5}
            fill={effectiveIsFavorite ? "currentColor" : "none"}
          />
        </button>

        {/* Bottom Subtle Action Prompt on Hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full border-t border-border bg-background/95 py-2.5 text-center text-[10px] font-medium tracking-[0.2em] uppercase text-foreground transition-transform duration-300 group-hover:translate-y-0 sm:block">
          Xem chi tiết thiết kế
        </div>
      </div>

      {/* Product Specification Caption */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {category && (
            <p className="mb-1 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {category}
            </p>
          )}
          <Link
            to={productPath}
            onClick={handleLinkClick}
            className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            {product.name}
          </Link>

          {/* Real Flash Sale Quota Bar (only when quota > 0 from API) */}
          {isFlashSale && quota > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {isQuotaExhausted
                    ? "Đã hết suất ưu đãi"
                    : `Đã bán ${sold || 0}/${quota}`}
                </span>
                {remainingQuota !== null && !isQuotaExhausted && (
                  <span className="font-medium text-foreground">
                    Còn {remainingQuota}
                  </span>
                )}
              </div>
              <div className="h-1 w-full overflow-hidden bg-secondary">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((sold || 0) / quota) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Price & Real Rating Row */}
        <div className="mt-3 flex items-baseline justify-between border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <strong className="text-sm font-semibold tabular-nums text-foreground">
              {price > 0 ? formatCurrency(price) : "Liên hệ"}
            </strong>
            {oldPrice > price && price > 0 && (
              <del className="text-xs tabular-nums text-muted-foreground line-through">
                {formatCurrency(oldPrice)}
              </del>
            )}
          </div>

          {rating > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground"
              aria-label={`Đánh giá ${rating.toFixed(1)} trên 5 sao`}
            >
              <Star size={11} fill="currentColor" className="text-foreground" />
              <span>{rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
