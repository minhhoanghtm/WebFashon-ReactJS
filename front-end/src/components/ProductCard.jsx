import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { toast } from "react-toastify";
import { useFavoriteStore } from "@/store/favorite.store";

const ProductCard = ({ product, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleStoredFavorite = useFavoriteStore((state) => state.toggleProduct);

  if (!product) return null;

  const productId = String(product.id || product._id || "");
  const isStoredFavorite = favoriteItems.some((item) => String(item.id) === productId);
  const effectiveIsFavorite = isFavorite ?? isStoredFavorite;
  const productPath = product.slug ? `/product/${product.slug}` : "/products";
  
  const displayImage = product.displayProduct?.[0] || product.image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
  const price = product.price ?? product.new_price ?? 0;
  const oldPrice = product.oldPrice ?? product.old_price ?? 0;
  const rating = product.rating ?? product.rate ?? 0;
  const category = product.category ?? "Thời trang";

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
  };

  const handleCardClick = (event) => {
    if (
      event.target.closest("a") ||
      event.target.closest("button") ||
      event.target.closest(".favorite-btn")
    ) {
      return;
    }
    navigate(productPath);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      toggleStoredFavorite(product);
      toast.success(
        isStoredFavorite
          ? `Đã bỏ "${product.name}" khỏi danh sách yêu thích!`
          : `Đã thêm "${product.name}" vào danh sách yêu thích!`,
      );
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer w-full"
    >
      {/* Media section */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
        <Link to={productPath} className="block w-full h-full">
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
          />
        </Link>
        
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#18181B]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider z-10">
            {product.badge}
          </span>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="favorite-btn absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all text-neutral-400 hover:text-red-500 z-10 cursor-pointer"
          aria-label="Yêu thích"
        >
          <Heart size={15} fill={effectiveIsFavorite ? "rgb(239, 68, 68)" : "none"} className={effectiveIsFavorite ? "text-red-500" : ""} />
        </button>
      </div>

      {/* Content section */}
      <div className="flex flex-col flex-1 p-4 text-left">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">
          {category}
        </span>
        <Link 
          to={productPath} 
          className="text-sm font-bold text-neutral-900 line-clamp-2 hover:text-amber-800 transition duration-200 mb-3 min-h-[40px]"
        >
          {product.name}
        </Link>

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
    </article>
  );
};

// Helper for formatting currency
const formatPrice = (val) => {
  return val.toLocaleString("vi-VN") + " VNĐ";
};

export default ProductCard;
