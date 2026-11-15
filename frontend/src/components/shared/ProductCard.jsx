import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Heart } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";

export function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

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

  return (
    <div
      className="group relative flex flex-col bg-[#121215] border border-[rgba(244,240,232,0.1)] transition-transform duration-200 hover:-translate-y-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link to={`/product/${slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-[#161619] block">
        <img
          src={isHovered ? secondaryImage : imageSrc}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Quick action buttons floating on bottom */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleQuickAdd}
            className="flex-1 min-h-[40px] px-3 bg-[#0c0c0e]/90 hover:bg-[#e65100] text-[#f4f0e8] text-xs font-display tracking-wider uppercase flex items-center justify-center gap-1.5 backdrop-blur-sm border border-[rgba(244,240,232,0.2)] transition-colors"
            title="Thêm nhanh vào giỏ hàng"
          >
            <ShoppingBag size={14} />
            <span>Thêm giỏ</span>
          </button>
          <span className="p-2 min-h-[40px] min-w-[40px] bg-[#0c0c0e]/90 text-[#f4f0e8] flex items-center justify-center backdrop-blur-sm border border-[rgba(244,240,232,0.2)]">
            <Eye size={14} />
          </span>
        </div>

        {/* Stock / Sale Badge */}
        {oldPrice && oldPrice > price && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-[#e65100] text-white">
            Ưu đãi
          </span>
        )}
      </Link>

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
