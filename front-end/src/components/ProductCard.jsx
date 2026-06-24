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
      className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:border-accent cursor-pointer w-full"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
        <Link to={productPath} className="block w-full h-full">
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider z-10">
            {product.badge}
          </span>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="favorite-btn absolute top-2 right-2 w-9 h-9 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:border-accent z-10"
          aria-label="Favorite"
        >
          <Heart 
            size={18} 
            fill={effectiveIsFavorite ? "rgb(239, 68, 68)" : "none"} 
            className={effectiveIsFavorite ? "text-red-500" : "text-muted-foreground"} 
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          {category}
        </span>
        <Link 
          to={productPath} 
          className="text-sm font-semibold text-foreground line-clamp-2 hover:text-accent transition-colors mb-3"
        >
          {product.name}
        </Link>

        {/* Rating and Price */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          {/* Rating */}
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Star size={14} fill="currentColor" className="text-yellow-500" />
            {rating.toLocaleString("vi-VN", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>

          {/* Pricing */}
          <div className="flex flex-col items-end gap-1">
            <strong className="text-sm font-bold text-foreground">
              {price > 0 ? formatPrice(price) : "Contact"}
            </strong>
            {oldPrice > price && price > 0 && (
              <del className="text-xs text-muted-foreground line-through">
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
