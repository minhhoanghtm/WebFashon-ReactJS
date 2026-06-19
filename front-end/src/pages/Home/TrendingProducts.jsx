import React, { useState } from "react";
import { PackageSearch, ArrowDown } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import SectionHeader from "./SectionHeader";

const TrendingProducts = ({
  products = [],
  limit = 8,
  isLoading,
  hasError,
  isUsingFallback,
  favoriteIds,
  onToggleFavorite,
  title = "Sản phẩm nổi bật",
}) => {
  const [visibleCount, setVisibleCount] = useState(limit);

  const displayedProducts = Array.isArray(products)
    ? products.slice(0, visibleCount)
    : [];

  const hasMore = Array.isArray(products) && products.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  return (
    <section
      id="san-pham-noi-bat"
      className="home-section home-products"
      aria-labelledby="home-products-title"
    >
      <div className="home-products__heading">
        <SectionHeader
          id="home-products-title"
          eyebrow="Được yêu thích"
          title={title}
          subtitle="Những lựa chọn được yêu thích nhất dành cho phong cách hằng ngày"
        />
        {isUsingFallback && (
          <span className="home-products__source" role="status">
            {hasError
              ? "Đang hiển thị bộ sưu tập gợi ý"
              : "Bộ sưu tập gợi ý"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="home-products__state" role="status">
          <span className="home-products__loader" aria-hidden="true" />
          Đang tải sản phẩm...
        </div>
      ) : displayedProducts.length > 0 ? (
        <div className="space-y-8">
          <div className="home-products__grid">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteIds.has(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <span>Xem thêm sản phẩm</span>
                <ArrowDown size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-products__state home-products__state--empty">
          <PackageSearch size={28} aria-hidden="true" />
          <span>Không tìm thấy sản phẩm phù hợp</span>
        </div>
      )}
    </section>
  );
};

export default TrendingProducts;
