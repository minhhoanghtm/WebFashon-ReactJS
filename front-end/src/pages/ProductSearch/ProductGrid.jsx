import ProductSearchCard from "./ProductSearchCard";

const ProductGrid = ({ products, favoriteIds, onToggleFavorite }) => {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductSearchCard
          key={product.id}
          product={product}
          isFavorite={favoriteIds.has(product.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
