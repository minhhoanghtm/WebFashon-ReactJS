import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import HeroBanner from "./HeroBanner";
import LookbookSection from "./LookbookSection";
import TrendingProducts from "./TrendingProducts";
import { mockProducts } from "./homeMockData";
import { normalizeProduct, normalizeSearchText } from "./productAdapter";
import "./home.css";

const Home = () => {
  const { products: apiProducts, isLoading, error } = useProducts();
  const { homeSearchTerm = "" } = useOutletContext() || {};
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const normalizedProducts = useMemo(() => {
    const hasApiProducts = Array.isArray(apiProducts) && apiProducts.length > 0;
    const sourceProducts = hasApiProducts ? apiProducts : mockProducts;

    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, !hasApiProducts),
    );
  }, [apiProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = normalizeSearchText(homeSearchTerm);

    if (!keyword) return normalizedProducts;

    return normalizedProducts.filter((product) =>
      [product.name, product.category, product.description].some((value) =>
        normalizeSearchText(value).includes(keyword),
      ),
    );
  }, [normalizedProducts, homeSearchTerm]);

  const toggleFavorite = (productId) => {
    setFavoriteIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(productId)) {
        nextIds.delete(productId);
      } else {
        nextIds.add(productId);
      }

      return nextIds;
    });
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <HeroBanner />

        <TrendingProducts
          products={filteredProducts.slice(0, 8)}
          isLoading={isLoading}
          hasError={Boolean(error)}
          isUsingFallback={
            !isLoading && (!Array.isArray(apiProducts) || apiProducts.length === 0)
          }
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />

        <LookbookSection />
      </div>
    </div>
  );
};

export default Home;
