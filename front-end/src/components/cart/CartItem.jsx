import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, AlertTriangle, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const CartItem = ({
  item,
  selected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
  isUpdating = false,
}) => {
  const hasDiscount = Number(item.old_price) > Number(item.new_price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(item.old_price) - Number(item.new_price)) /
          Number(item.old_price)) *
          100
      )
    : 0;

  const candidateUrls = useMemo(() => {
    const raw = [];
    if (item.image) raw.push(item.image);
    if (item.productImage) raw.push(item.productImage);
    if (Array.isArray(item.images)) raw.push(...item.images);
    return [...new Set(raw.filter((u) => typeof u === "string" && u.trim()))];
  }, [item.image, item.productImage, item.images]);

  const [imgIdx, setImgIdx] = useState(0);
  const activeImgUrl = candidateUrls[imgIdx] || "";

  const stock = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 99;
  const isOutOfStock = stock <= 0;
  const isExceedingStock = !isOutOfStock && Number(item.quantity) > stock;
  const isLowStock = !isOutOfStock && stock <= 5;

  const variantColor = item.color || item.variants?.[0]?.color;
  const variantSize = item.size || item.variants?.[0]?.size;
  const productSlugOrId = item.slug || item.product_id || item._id;

  return (
    <article
      className={`flex gap-3 border bg-card p-4 transition-colors sm:gap-5 sm:p-5 ${
        isOutOfStock || isExceedingStock
          ? "border-destructive/50 bg-destructive/5"
          : selected
          ? "border-foreground"
          : "border-border"
      }`}
    >
      {/* Checkbox Selector (>= 44px touch target) */}
      <div className="flex items-start pt-1">
        <label className="touch-target -m-2 inline-flex cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={Boolean(selected && !isOutOfStock)}
            disabled={isOutOfStock}
            onChange={() => onToggleSelect(item._id)}
            aria-label={`Chọn ${item.name}`}
            className="h-4 w-4 cursor-pointer border-border accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>
      </div>

      {/* Image Thumbnail (3:4 Editorial Ratio) */}
      <Link
        to={`/product/${encodeURIComponent(productSlugOrId)}`}
        className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden border border-border bg-secondary sm:w-24"
      >
        {activeImgUrl ? (
          <img
            src={activeImgUrl}
            alt={item.name}
            onError={() => setImgIdx((prev) => prev + 1)}
            className={`h-full w-full object-cover object-center transition-opacity ${
              isOutOfStock ? "opacity-40 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center select-none">
            <span className="font-serif text-xs uppercase tracking-[0.16em] text-muted-foreground">
              WF
            </span>
          </div>
        )}
      </Link>

      {/* Item Info & Controls */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {item.category || "Thiết kế Giám tuyển"}
            </p>
            <Link
              to={`/product/${encodeURIComponent(productSlugOrId)}`}
              className={`block font-serif text-base leading-snug text-foreground hover:underline sm:text-lg ${
                isOutOfStock ? "line-through opacity-60" : ""
              }`}
            >
              {item.name}
            </Link>

            {/* Variant Attributes */}
            {(variantColor || variantSize) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {variantColor && (
                  <span className="border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                    Màu: {variantColor}
                  </span>
                )}
                {variantSize && (
                  <span className="border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase text-foreground">
                    Size: {variantSize}
                  </span>
                )}
              </div>
            )}

            {/* Campaign & Real-time Price Notice */}
            {item.campaign && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 border border-foreground bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-primary-foreground">
                  <Zap size={10} />
                  {item.campaign.name}
                </span>
                {item.campaign.isQuotaExhausted && (
                  <span className="border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    Hết suất ưu đãi
                  </span>
                )}
              </div>
            )}

            {item.price_changed && (
              <p className="pt-1 text-[11px] font-medium text-foreground">
                * Giá sản phẩm đã được cập nhật theo thời gian thực.
              </p>
            )}

            {/* Stock Error / Warning Messages */}
            {isOutOfStock && (
              <p
                role="alert"
                className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-destructive"
              >
                <AlertTriangle size={13} />
                <span>Sản phẩm hiện đã hết hàng trong kho.</span>
              </p>
            )}

            {isExceedingStock && (
              <p
                role="alert"
                className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-destructive"
              >
                <AlertTriangle size={13} />
                <span>
                  Vượt quá tồn kho (Kho chỉ còn tối đa {stock} sản phẩm).
                </span>
              </p>
            )}
          </div>

          {/* Remove Button (>= 44px touch target) */}
          <button
            type="button"
            onClick={() => onRemove(item._id)}
            className="touch-target -mr-2 -mt-2 inline-flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
            title="Xóa sản phẩm"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Bottom Row: Price & Quantity Adjuster */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
              {formatCurrency(item.new_price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs tabular-nums text-muted-foreground line-through">
                  {formatCurrency(item.old_price)}
                </span>
                <span className="border border-border px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLowStock && !isExceedingStock && (
              <span className="border border-border bg-secondary px-2 py-1 text-[10px] font-medium tracking-[0.12em] uppercase text-foreground">
                Chỉ còn {stock}
              </span>
            )}

            {isOutOfStock ? (
              <span className="border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-destructive">
                Hết hàng
              </span>
            ) : (
              <div className="inline-flex items-center border border-border bg-background">
                <button
                  type="button"
                  onClick={() => onQuantityChange(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  className="touch-target inline-flex items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Giảm số lượng"
                >
                  <Minus size={13} />
                </button>
                <span className="min-w-[36px] px-2 text-center text-xs font-semibold tabular-nums text-foreground">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                  disabled={item.quantity >= stock || isUpdating}
                  className="touch-target inline-flex items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Tăng số lượng"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartItem;
