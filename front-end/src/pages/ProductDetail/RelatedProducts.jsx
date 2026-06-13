import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { fallbackImages } from "./productDetailMockData";

const RelatedProducts = ({ products = [] }) => {
  if (!products.length) return null;

  return (
    <section className="related-products" aria-labelledby="related-products-title">
      <div className="product-detail-section-header">
        <div>
          <span>Sản phẩm liên quan</span>
          <h2 id="related-products-title">Có thể bạn cũng thích</h2>
        </div>
        <Link to="/products">Xem tất cả</Link>
      </div>

      <div className="related-products__grid">
        {products.map((product) => (
          <Link
            to={`/product/${product.slug || product.id}`}
            className="related-product-card"
            key={product.id}
          >
            <div className="related-product-card__image">
              <img
                src={product.image || fallbackImages[0]}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImages[0];
                }}
              />
              <button
                type="button"
                aria-label="Yêu thích"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <Heart size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="related-product-card__body">
              <span>{product.category}</span>
              <strong>{product.name}</strong>
              <div>
                <small>
                  <Star size={13} fill="currentColor" aria-hidden="true" />
                  {product.rating.toLocaleString("vi-VN", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </small>
                <em>{product.price > 0 ? formatCurrency(product.price) : "Liên hệ"}</em>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
