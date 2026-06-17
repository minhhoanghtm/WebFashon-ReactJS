import React, { useState } from "react";
import { Heart, Star } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useFavoriteStore } from "@/store/favorite.store";
import ProductActions from "./ProductActions";

const ProductInfo = ({ product, variants }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);
  const isFavorite = favoriteItems.some((item) => String(item.id) === String(product.id));

  return (
    <div className="product-info">
      <div className="product-info__eyebrow">Chi tiết sản phẩm</div>

      <div className="product-info__heading">
        <div>
          {product.badge && <span className="product-info__badge">{product.badge}</span>}
          <h1>{product.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          className={`product-info__favorite ${isFavorite ? "is-active" : ""}`}
          aria-label="Yêu thích"
        >
          <Heart
            size={20}
            fill={isFavorite ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="product-info__meta">
        <span className="product-info__rating">
          <Star size={16} fill="currentColor" aria-hidden="true" />
          {product.rating.toLocaleString("vi-VN", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </span>
        <span>({product.reviewCount} đánh giá)</span>
        {product.category && <span>{product.category}</span>}
        {product.stockLabel && (
          <span className={product.isSoldOut ? "is-sold-out" : "is-in-stock"}>
            {product.stockLabel}
          </span>
        )}
      </div>

      <div className="product-info__price">
        <strong>
          {product.price > 0 ? formatCurrency(product.price) : "Liên hệ"}
        </strong>
        {product.oldPrice > product.price && product.price > 0 && (
          <del>{formatCurrency(product.oldPrice)}</del>
        )}
      </div>

      {/* <div className="product-info__description-wrapper">
        <p className="product-info__description">
          {isExpanded ? product.description : product.shortDescription}
        </p>
        {product.description && product.description.length > 190 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="product-info__read-more"
          >
            {isExpanded ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div> */}

      <ProductActions product={product} variants={variants} />

      <div className="product-info__benefits" aria-label="Cam kết mua hàng">
        <div>
          <strong>Đổi trả dễ dàng</strong>
          <span>Hỗ trợ đổi trả theo chính sách của cửa hàng.</span>
        </div>
        <div>
          <strong>Thanh toán an toàn</strong>
          <span>Bảo mật thông tin trong suốt quá trình đặt hàng.</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
