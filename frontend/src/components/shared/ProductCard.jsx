import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Heart, Scale, Check } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { useCompareStore } from "../../stores/compareStore";
import { SafeImage } from "../ui/SafeImage";

export function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleCompare = useCompareStore((state) => state.toggleCompare);
  const isInCompare = useCompareStore((state) =>
    state.isInCompare(product?._id || product?.id)
  );

  if (!product) return null;

  const imageSrc =
    product.displayProduct?.[0] ||
    product.displayProduct ||
    product.images?.[0] ||
    product.image ||
    "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

  const secondaryImage =
    product.images?.[1] ||
    product.displayProduct?.[1] ||
    imageSrc;

  const price = product.price || product.new_price || 0;
  const oldPrice = product.old_price || product.oldPrice || null;
  const slug = product.slug || product._id;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product._id,
      productId: product._id,
      name: product.name,
      price,
      image: imageSrc,
      quantity: 1,
    });
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  };

  return (
    <div
      className="group relative flex flex-col bg-[#121215] border border-[rgba(244,240,232,0.1)] hover:border-[#e65100]/40 transition-all duration-300 hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#161619]">
        <Link to={`/product/${slug}`} className="block w-full h-full" aria-label={`Xem chi tiết ${product.name}`}>
          <SafeImage
            src={isHovered ? secondaryImage : imageSrc}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03] will-change-transform"
          />
        </Link>

        {/* Action buttons on top right (Wishlist + Compare) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleToggleWishlist}
            data-testid="product-wishlist-btn"
            className={`min-h-[32px] min-w-[32px] p-1.5 flex items-center justify-center transition-all btn-tactile ${
              isWishlisted
                ? "bg-[#e65100] text-white border border-[#e65100] animate-wishlist-pop"
                : "bg-[#0c0c0e]/80 text-[#9a989f] hover:text-[#e65100] border border-white/20 backdrop-blur-sm opacity-90 hover:opacity-100"
            }`}
            title={isWishlisted ? "Đã lưu vào danh sách yêu thích" : "Thêm vào yêu thích"}
            aria-label="Lưu vào danh sách yêu thích"
          >
            <Heart size={14} className={isWishlisted ? "fill-white" : ""} />
          </button>

          <button
            type="button"
            onClick={handleToggleCompare}
            data-testid="product-compare-btn"
            className={`min-h-[32px] min-w-[32px] p-1.5 flex items-center justify-center transition-all btn-tactile ${
              isInCompare
                ? "bg-[#e65100] text-white border border-[#e65100] opacity-100"
                : "bg-[#0c0c0e]/80 text-[#9a989f] hover:text-white border border-white/20 backdrop-blur-sm opacity-90 hover:opacity-100"
            }`}
            title={isInCompare ? "Đang trong danh sách so sánh" : "Thêm vào so sánh"}
            aria-label="So sánh sản phẩm"
          >
            {isInCompare ? <Check size={14} /> : <Scale size={14} />}
          </button>
        </div>

        {/* Quick action buttons floating on bottom */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            className="flex-1 min-h-[44px] px-3 bg-[#0c0c0e]/90 hover:bg-[#e65100] text-[#f4f0e8] text-xs font-display tracking-wider uppercase flex items-center justify-center gap-1.5 backdrop-blur-sm border border-[rgba(244,240,232,0.2)] transition-colors btn-tactile"
            title="Thêm nhanh vào giỏ hàng"
          >
            <ShoppingBag size={14} />
            <span>Thêm giỏ</span>
          </button>
          <Link
            to={`/product/${slug}`}
            aria-label={`Xem chi tiết ${product.name}`}
            className="p-2 min-h-[44px] min-w-[44px] bg-[#0c0c0e]/90 hover:bg-white/20 text-[#f4f0e8] flex items-center justify-center backdrop-blur-sm border border-[rgba(244,240,232,0.2)] transition-colors btn-tactile"
            title="Xem chi tiết"
          >
            <Eye size={14} />
          </Link>
        </div>

        {/* Stock / Sale Badge */}
        {oldPrice && oldPrice > price && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-[#e65100] text-white z-10 pointer-events-none">
            Ưu đãi
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a989f] block mb-1">
            {product.category?.name || "Atelier Collection"}
          </span>
          <Link
            to={`/product/${slug}`}
            className="font-display text-sm tracking-wide text-[#f4f0e8] hover:text-[#e65100] line-clamp-1 transition-colors"
          >
            {product.name}
          </Link>
        </div>

        <div className="flex items-baseline gap-2 pt-1 border-t border-[rgba(244,240,232,0.06)]">
          <span className="text-sm font-semibold text-[#f4f0e8]">
            {price.toLocaleString("vi-VN")} ₫
          </span>
          {oldPrice && oldPrice > price && (
            <span className="text-xs text-[#6b6973] line-through">
              {oldPrice.toLocaleString("vi-VN")} ₫
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
