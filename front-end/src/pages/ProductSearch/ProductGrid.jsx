import React from "react";
import ProductCard from "../../components/ProductCard";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";

const ProductGrid = ({
  products = [],
  favoriteIds = new Set(),
  onToggleFavorite,
  gridDensity = "compact",
  searchTerm = "",
}) => {
  const gridClass =
    gridDensity === "spacious"
      ? "grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 w-full"
      : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full";

  return (
    <StaggerContainer
      key={gridDensity}
      staggerDelay={0.035}
      className={gridClass}
    >
      {products.map((product, index) => (
        <StaggerItem key={product.id}>
          <ProductCard
            product={product}
            isFavorite={favoriteIds.has(product.id)}
            onToggleFavorite={onToggleFavorite}
            trackingMeta={searchTerm ? { search_query: searchTerm, position: index + 1 } : null}
          />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
};

export default ProductGrid;
