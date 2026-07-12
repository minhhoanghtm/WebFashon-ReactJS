import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";

const OrderItem = ({ item }) => {
  const getProductSlug = (item) => item.product_slug || item.product?.slug;
  const slug = getProductSlug(item);
  const href = slug ? `/product/${slug}` : "#";

  const color = item.variant?.color;
  const size = item.variant?.size;

  const normalizeImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("example.com")) return "";
    if (url.includes("webfashon-reactjs.onrender.com")) {
      const localOrigin = "http://localhost:5000";
      return url.replace(/https?:\/\/webfashon-reactjs\.onrender\.com/, localOrigin);
    }
    return url;
  };

  const variantImage = normalizeImageUrl(item.variant?.image_url);
  const productImage = normalizeImageUrl(item.product_image);
  const fallbackImg = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=60";
  const imageUrl = variantImage || productImage || fallbackImg;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0 animate-fadeIn">
      {/* Product Image */}
      <Link to={href} className="block w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
        <img
          src={imageUrl}
          alt={item.product_name}
          className="w-full h-full object-contain object-center hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=60";
          }}
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={href} className="block group">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {item.product_name}
          </h4>
        </Link>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
          {color && (
            <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              Phân loại: {color}
            </span>
          )}
          {size && (
            <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              Size: {size}
            </span>
          )}
          <span className="text-gray-400 self-center">
            SL: x{item.quantity}
          </span>
        </div>
      </div>

      {/* Product Price */}
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(item.price)}
        </span>
      </div>
    </div>
  );
};

export default OrderItem;
