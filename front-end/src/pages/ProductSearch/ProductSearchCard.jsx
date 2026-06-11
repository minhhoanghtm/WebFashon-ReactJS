import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { fallbackProductImage } from "./productMockData";

const ProductSearchCard = ({
  product,
  isFavorite,
  onToggleFavorite,
}) => {
  const productPath =
    product.slug && !product.isMock ? `/product/${product.slug}` : "/products";

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackProductImage;
  };

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={productPath} aria-label={`Xem chi tiết ${product.name}`}>
          <img
            src={product.image || fallbackProductImage}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
          />
        </Link>

        {product.badge && (
          <span className="product-card__badge">{product.badge}</span>
        )}

        <button
          type="button"
          className={`product-card__favorite${isFavorite ? " is-active" : ""}`}
          onClick={() => onToggleFavorite(product.id)}
          aria-label={
            isFavorite
              ? `Bỏ ${product.name} khỏi danh sách yêu thích`
              : `Thêm ${product.name} vào danh sách yêu thích`
          }
          aria-pressed={isFavorite}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="product-card__content">
        {product.category && (
          <span className="product-card__category">{product.category}</span>
        )}
        <Link to={productPath} className="product-card__name">
          {product.name}
        </Link>
        <div className="product-card__rating">
          <Star size={14} fill="currentColor" aria-hidden="true" />
          <span>
            {product.rating.toLocaleString("vi-VN", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
        <div className="product-card__prices">
          <strong>
            {product.price > 0 ? formatCurrency(product.price) : "Liên hệ"}
          </strong>
          {product.oldPrice > product.price && product.price > 0 && (
            <del>{formatCurrency(product.oldPrice)}</del>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductSearchCard;
