import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("example.com")) return "";
  if (url.includes("webfashon-reactjs.onrender.com")) {
    const localOrigin = "http://localhost:5000";
    return url.replace(
      /https?:\/\/webfashon-reactjs\.onrender\.com/,
      localOrigin
    );
  }
  return url;
};

const OrderItem = ({ item }) => {
  const slug = item.product_slug || item.product?.slug;
  const href = slug ? `/product/${slug}` : "/products";

  const color = item.variant?.color;
  const size = item.variant?.size;

  const candidates = [
    normalizeImageUrl(item.variant?.image_url),
    normalizeImageUrl(item.product_image),
    normalizeImageUrl(item.product?.images?.[0]?.url || item.product?.images?.[0]),
  ].filter(Boolean);

  const [imgIdx, setImgIdx] = useState(0);
  const activeSrc = candidates[imgIdx] || "";

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-border)] last:border-b-0">
      {/* Product Image or Monochrome Placeholder */}
      <Link
        to={href}
        className="block w-20 h-24 bg-[var(--color-bg)] border border-[var(--color-border)] overflow-hidden shrink-0 flex items-center justify-center"
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={item.product_name || "Sản phẩm"}
            className="w-full h-full object-cover object-center"
            onError={() => setImgIdx((prev) => prev + 1)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] select-none p-1 text-center">
            <span className="font-display text-xs tracking-widest uppercase">
              WF
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-70">
              No Img
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={href} className="block group">
          <h4 className="text-sm font-medium text-[var(--color-text)] line-clamp-2 group-hover:underline underline-offset-4">
            {item.product_name}
          </h4>
        </Link>
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
          {color && (
            <span className="px-2 py-0.5 border border-[var(--color-border)] bg-[var(--color-bg)]">
              Màu: {color}
            </span>
          )}
          {size && (
            <span className="px-2 py-0.5 border border-[var(--color-border)] bg-[var(--color-bg)]">
              Size: {size}
            </span>
          )}
          <span className="self-center font-mono">SL: ×{item.quantity}</span>
        </div>
      </div>

      {/* Product Price */}
      <div className="text-right shrink-0">
        <span className="text-sm font-mono font-medium text-[var(--color-text)]">
          {formatCurrency(item.price)}
        </span>
      </div>
    </div>
  );
};

export default OrderItem;
