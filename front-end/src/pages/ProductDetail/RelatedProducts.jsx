import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import AnimatedSection from "../../components/motion/AnimatedSection";
import { StaggerContainer, StaggerItem } from "../../components/motion/StaggerContainer";

const RelatedProducts = ({ products = [], relatedProducts = [] }) => {
  const source = products.length > 0 ? products : relatedProducts;
  const safeProducts = Array.isArray(source) ? source.slice(0, 4) : [];

  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <AnimatedSection
      variant="fade-up"
      className="related-products pt-12 mt-12 border-t border-neutral-200/80"
      aria-labelledby="related-products-title"
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-[11px] font-bold text-[#05251C] uppercase tracking-widest block mb-1">
            Gợi ý thời trang
          </span>
          <h2 id="related-products-title" className="text-xl sm:text-2xl font-black text-[#05251C] tracking-tight font-display uppercase">
            Có thể bạn cũng thích
          </h2>
        </div>
        <Link
          to="/products"
          className="text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:underline transition"
        >
          Xem tất cả sản phẩm →
        </Link>
      </div>

      {/* Lưới sản phẩm liên quan */}
      <StaggerContainer
        staggerDelay={0.05}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full"
      >
        {safeProducts.map((prod) => (
          <StaggerItem key={prod._id || prod.id}>
            <ProductCard product={prod} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </AnimatedSection>
  );
};

export default RelatedProducts;
