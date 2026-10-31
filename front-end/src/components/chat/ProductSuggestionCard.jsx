import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ShoppingBag } from "lucide-react";
import trackingService from "@/services/tracking.service";

export const ProductSuggestionCard = ({
  item,
  onAddToCart,
  onAskDetails,
  position = 1,
}) => {
  if (!item) return null;

  const handleClickDetail = () => {
    trackingService.trackAIRecommendationClick?.(
      { id: item.id, _id: item.id, name: item.name },
      { position }
    );
    if (onAskDetails) {
      onAskDetails(item);
    }
  };

  const productUrl = item.slug
    ? `/product/${item.slug}`
    : item.id
    ? `/products?search=${encodeURIComponent(item.name || "")}`
    : null;

  return (
    <div className="flex gap-3 border border-border bg-card p-2.5 text-card-foreground transition-all duration-150 hover:border-foreground/40">
      {item.image && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 min-w-0 flex-col justify-between">
        <div>
          <h4 className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-foreground">
            {item.name}
          </h4>
          <p className="mt-1 text-xs font-bold tabular-nums text-foreground">
            {item.price}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2 pt-1 border-t border-border/50">
          {productUrl ? (
            <Link
              to={productUrl}
              onClick={handleClickDetail}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              <span>Xem chi tiết</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleClickDetail}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              <span>Xem chi tiết</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}

          {onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(item)}
              className="ml-auto inline-flex items-center gap-1 bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 active:scale-95"
            >
              <ShoppingBag className="h-3 w-3" />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionCard;
