import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const RelatedProducts = ({ relatedProducts = [] }) => {
  const safeProducts = Array.isArray(relatedProducts) ? relatedProducts.slice(0, 4) : [];

  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <section className="related-products" aria-labelledby="related-products-title">
      <div className="product-detail-section-header">
        <div>
          <span>Sản phẩm liên quan</span>
          <h2 id="related-products-title">Có thể bạn cũng thích</h2>
        </div>
        <Link to="/products">Xem tất cả</Link>
      </div>

      {/* Products Grid */}
      <div className="pd-products-grid">
        {safeProducts.map((prod) => (
          <ProductCard key={prod._id || prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
