import { PackageSearch } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import SectionHeader from "./SectionHeader";

const TrendingProducts = ({
  products,
  isLoading,
  hasError,
  isUsingFallback,
  favoriteIds,
  onToggleFavorite,
}) => {
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
          title="Sản phẩm nổi bật"
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
      ) : products.length > 0 ? (
        <div className="home-products__grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
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
