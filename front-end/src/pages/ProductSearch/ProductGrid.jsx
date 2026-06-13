import ProductCard from "../../components/ProductCard";

const ProductGrid = ({ products, favoriteIds, onToggleFavorite }) => {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
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
