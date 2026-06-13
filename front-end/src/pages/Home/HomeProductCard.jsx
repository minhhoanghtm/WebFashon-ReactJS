import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { fallbackProductImage } from "./homeMockData";

const HomeProductCard = ({ product, isFavorite, onToggleFavorite }) => {
  const productIdentifier = product.slug || product.id || product._id;
  const productPath = productIdentifier ? `/product/${productIdentifier}` : "/products";

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackProductImage;
  };

  return (
    <article className="home-product-card">
      <div className="home-product-card__media">
        <Link to={productPath} aria-label={`Xem ${product.name}`}>
          <img
            src={product.image || fallbackProductImage}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
          />
        </Link>
        <span className="home-product-card__badge">{product.badge}</span>
        <button
          type="button"
          className={`home-product-card__favorite${isFavorite ? " is-active" : ""}`}
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

      <div className="home-product-card__body">
        <span className="home-product-card__category">{product.category}</span>
        <Link to={productPath} className="home-product-card__name">
          {product.name}
        </Link>
        <div className="home-product-card__meta">
          <span className="home-product-card__rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            {product.rating.toLocaleString("vi-VN", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <div className="home-product-card__prices">
            <strong>{formatCurrency(product.price)}</strong>
            {product.oldPrice > product.price && (
              <del>{formatCurrency(product.oldPrice)}</del>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default HomeProductCard;
