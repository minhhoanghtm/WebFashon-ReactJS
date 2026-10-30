import React from "react";
import { Heart, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useFavoriteStore } from "@/store/favorite.store";
import ProductActions from "./ProductActions";

const ProductInfo = ({ product, variants = [] }) => {
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);
  const isFavorite = favoriteItems.some((item) => String(item.id) === String(product.id));

  const discountPercent =
    product.oldPrice > product.price && product.price > 0
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <div className="product-info flex flex-col gap-5 lg:gap-3 w-full">
      {/* Category & Favorite Header */}
      <div className="flex items-center justify-between">
        <span className="micro-label text-[#05251C]/70">
          {product.category || "THỜI TRANG CAO CẤP"}
        </span>

        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
            isFavorite
              ? "bg-[#F5DD20]/20 border-[#F5DD20] text-[#05251C] shadow-2xs font-bold"
              : "bg-white border-neutral-200 text-neutral-600 hover:text-[#05251C] hover:border-neutral-300"
          }`}
          aria-label="Yêu thích"
        >
          <Heart
            size={14}
            fill={isFavorite ? "#05251C" : "none"}
            aria-hidden="true"
          />
          <span>{isFavorite ? "Đã lưu vào BST" : "Lưu vào BST"}</span>
        </button>
      </div>

      {/* Product Title & Badge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl lg:text-[2.15rem] font-black text-[#05251C] tracking-tight leading-tight font-display">
            {product.name}
          </h1>
        </div>

        {/* Rating and Reviews Meta */}
        <div className="flex items-center flex-wrap gap-3 text-xs text-neutral-500 pt-0.5">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-200/60">
            <Star size={12} fill="currentColor" className="text-amber-500" />
            <span>
              {product.rating.toLocaleString("vi-VN", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </span>
          </div>

          <span className="hover:text-neutral-800 transition">
            ({product.reviewCount || 0} nhận xét từ khách hàng)
          </span>

          <span className="text-neutral-300">•</span>

          {product.stockLabel && (
            <span
              className={`font-semibold ${
                product.isSoldOut ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {product.stockLabel}
            </span>
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex items-baseline gap-3 py-2 border-y border-neutral-200/80">
        <strong className="text-2xl sm:text-3xl lg:text-[1.9rem] font-extrabold text-neutral-950 tabular-nums">
          {product.price > 0 ? formatCurrency(product.price) : "Liên hệ"}
        </strong>
        {product.oldPrice > product.price && product.price > 0 && (
          <del className="text-base text-neutral-400 font-medium line-through tabular-nums">
            {formatCurrency(product.oldPrice)}
          </del>
        )}
        {discountPercent && (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            Tiết kiệm {discountPercent}%
          </span>
        )}
      </div>

      {/* Product Variant Choices & Actions */}
      <ProductActions product={product} variants={variants} />

      {/* Trust & Guarantee Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-2 pt-4 lg:pt-3 border-t border-neutral-200/80">
        <div className="flex items-center gap-2.5 lg:gap-2 p-3 lg:p-2 rounded-xl bg-white border border-neutral-200/80 text-neutral-700 shadow-2xs">
          <Truck size={18} className="text-[#05251C] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-900 leading-tight">Giao nhanh toàn quốc</span>
            <span className="text-[11px] text-neutral-500">Miễn phí từ 500k</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 lg:gap-2 p-3 lg:p-2 rounded-xl bg-white border border-neutral-200/80 text-neutral-700 shadow-2xs">
          <RotateCcw size={18} className="text-[#05251C] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-900 leading-tight">Đổi trả 7 ngày</span>
            <span className="text-[11px] text-neutral-500">Thủ tục nhanh gọn</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 lg:gap-2 p-3 lg:p-2 rounded-xl bg-white border border-neutral-200/80 text-neutral-700 shadow-2xs">
          <ShieldCheck size={18} className="text-[#05251C] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-900 leading-tight">Chính hãng 100%</span>
            <span className="text-[11px] text-neutral-500">Cam kết chất lượng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
