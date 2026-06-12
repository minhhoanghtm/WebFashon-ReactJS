import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const RelatedProducts = ({ relatedProducts = [] }) => {
  const safeProducts = Array.isArray(relatedProducts) ? relatedProducts.slice(0, 4) : [];

  if (safeProducts.length === 0) {
    return null;
  }

  // Format currency
  const formatPrice = (val) => {
    if (val > 1000) {
      return val.toLocaleString("vi-VN") + "đ";
    }
    return "$" + val;
  };

  const handleWishlistClick = (e, productName) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`Đã thêm "${productName}" vào danh sách yêu thích!`);
  };

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Section Header */}
      <div className="pd-section-header">
        <span className="pd-section-title text-slate-900 dark:text-white">Có thể bạn cũng thích</span>
        <Link to="/products" className="pd-see-all">
          Xem tất cả
        </Link>
      </div>

      {/* Products Grid */}
      <div className="pd-products-grid">
        {safeProducts.map((prod) => {
          const mainImg = prod.image || prod.displayProduct?.[0] || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
          const hasDiscount = prod.old_price > prod.new_price;

          return (
            <Link
              key={prod._id || prod.id}
              to={`/product/${prod.slug}`}
              className="pd-prod-card group"
            >
              <div className="pd-prod-img">
                <img
                  src={mainImg}
                  alt={prod.name}
                  className="group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
                  }}
                />
                
                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => handleWishlistClick(e, prod.name)}
                  className="pd-wishlist-btn font-sans hover:bg-red-50 dark:hover:bg-slate-800"
                  title="Yêu thích"
                >
                  ♡
                </button>
              </div>
              
              {/* Product Info */}
              <div className="pd-prod-name text-slate-800 dark:text-slate-200 mt-2">
                {prod.name}
              </div>
              
              <div className="pd-prod-price mt-1">
                <span className="text-slate-950 dark:text-slate-100 font-bold">
                  {formatPrice(prod.new_price)}
                </span>
                {hasDiscount && (
                  <s className="text-slate-400 dark:text-slate-600">
                    {formatPrice(prod.old_price)}
                  </s>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
