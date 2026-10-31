import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { getAllProductService } from "@/services/product.service";
import { getAllCategoriesService } from "@/services/category.service";
import { useFavoriteStore } from "@/store/favorite.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useLenis from "@/hooks/useLenis";
import ProductCard from "@/components/ProductCard";
import CinematicHeader from "./components/CinematicHeader";
import CinematicHero from "./components/CinematicHero";
import BrandChapterSection from "./components/BrandChapterSection";
import ManifestoVideoSection from "./components/ManifestoVideoSection";
import CollageLookbookSection from "./components/CollageLookbookSection";
import {
  buildCategoryHierarchy,
  normalizeProduct,
  normalizeSearchText,
} from "./productAdapter";

const Home = () => {
  useDocumentTitle("404 STUDIO — Atelier Edition");
  useLenis(); // Smooth scrolling with Lenis + ScrollTrigger integration

  const exploreRef = useRef(null);
  const { homeSearchTerm = "", setHomeSearchTerm } = useOutletContext() || {};

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const [rawProducts, setRawProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedParentKey, setSelectedParentKey] = useState("all");
  const [selectedChildKey, setSelectedChildKey] = useState("all");

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id || item._id))),
    [favoriteItems]
  );

  const fetchHomeData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProductService(),
        getAllCategoriesService().catch(() => []),
      ]);
      setRawProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      categories
        .filter((cat) => (cat?._id || cat?.id) && cat?.name)
        .map((cat) => [String(cat._id || cat.id), cat.name])
    );
  }, [categories]);

  const categoryGroups = useMemo(
    () => buildCategoryHierarchy(categories),
    [categories]
  );

  const activeParentGroup = useMemo(
    () => categoryGroups.find((g) => g.key === selectedParentKey) || null,
    [categoryGroups, selectedParentKey]
  );

  const activeChildItem = useMemo(
    () =>
      activeParentGroup?.children?.find((c) => c.key === selectedChildKey) ||
      null,
    [activeParentGroup, selectedChildKey]
  );

  const normalizedProducts = useMemo(() => {
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];
    return rawProducts.map((product, index) =>
      normalizeProduct(product, index, categoryMap)
    );
  }, [rawProducts, categoryMap]);

  const filteredProducts = useMemo(() => {
    let result = normalizedProducts;

    const keyword = normalizeSearchText(homeSearchTerm);
    if (keyword) {
      result = result.filter((product) =>
        [product.name, product.category, product.description].some((val) =>
          normalizeSearchText(val).includes(keyword)
        )
      );
    }

    if (activeChildItem) {
      const allowedIds = new Set(activeChildItem.ids.map(String));
      result = result.filter(
        (product) =>
          allowedIds.has(String(product.category_id)) ||
          normalizeSearchText(product.category) === activeChildItem.key
      );
    } else if (activeParentGroup) {
      const allowedIds = new Set(activeParentGroup.ids.map(String));
      result = result.filter((product) =>
        allowedIds.has(String(product.category_id))
      );
    }

    return result;
  }, [
    normalizedProducts,
    homeSearchTerm,
    activeParentGroup,
    activeChildItem,
  ]);

  const activeCategoryName = activeChildItem
    ? `${activeParentGroup?.name} · ${activeChildItem.name}`
    : activeParentGroup
    ? activeParentGroup.name
    : "Tất cả thiết kế";

  const handleSelectParent = (groupKey) => {
    setSelectedParentKey(groupKey);
    setSelectedChildKey("all");
  };

  const handleScrollToExplore = () => {
    if (exploreRef.current) {
      exploreRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex flex-col bg-neutral-950 text-foreground">
      {/* 1 & 2. Cinematic Transparent Header + Menu Overlay + Cart Drawer */}
      <CinematicHeader
        searchTerm={homeSearchTerm}
        onSearchTermChange={setHomeSearchTerm}
        isHomePage={true}
      />

      {/* 1. Cinematic Hero (100svh, dark, sticky, auto-crossfade, condensed 2-line title, thin button) */}
      <CinematicHero onExploreClick={handleScrollToExplore} />

      {/* Subsequent Content (Slides up over sticky Hero on scroll) */}
      <div
        ref={exploreRef}
        id="home-content"
        className="relative z-10 min-h-screen bg-[#FBF9F5] text-[#05251C] shadow-[0_-25px_50px_rgba(0,0,0,0.5)] transition-colors duration-500"
      >
        {/* Section 3: "CHƯƠNG THƯƠNG HIỆU" (nền trắng, ảnh 3:4 so le, clip-path reveal, parallax) */}
        <BrandChapterSection />

        {/* Section 4: "CÂU KHẨU HIỆU + VIDEO" (nền đen, chữ sáng dần theo cuộn, video mở rộng full-bleed) */}
        <ManifestoVideoSection />

        {/* Section 5: "COLLAGE LOOKBOOK" (nền trắng, ảnh rải quanh hội tụ, nút chuyển trang trắng <= 0.6s) */}
        <CollageLookbookSection />

        {/* Curated Product Collection Section */}
        <section
          aria-labelledby="home-collection-heading"
          className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 sm:py-24 lg:px-10"
        >
          {/* Section Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-[#05251C]/10 pb-8 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-[#05251C]/60">
                Chương Mở Đầu · Curated Atelier Edit
              </p>
              <h2
                id="home-collection-heading"
                className="mt-2 font-condensed text-4xl font-extrabold tracking-tight text-[#05251C] uppercase sm:text-5xl"
              >
                {activeCategoryName}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {!isLoading && !hasError && (
                <span className="text-xs tabular-nums tracking-[0.14em] uppercase text-[#05251C]/60 font-mono">
                  {filteredProducts.length} thiết kế
                </span>
              )}
              <Link
                to="/products"
                className="touch-target inline-flex items-center gap-1.5 border border-[#05251C]/20 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5]"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Grouped & Deduplicated Parent-Child Category Chips */}
          {categoryGroups.length > 0 && (
            <div className="mt-8 space-y-3">
              {/* Level 1: Parent Groups */}
              <div
                role="tablist"
                aria-label="Nhóm danh mục chính"
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedParentKey === "all"}
                  onClick={() => handleSelectParent("all")}
                  className={`min-h-[44px] px-4 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${
                    selectedParentKey === "all"
                      ? "bg-[#05251C] text-[#FBF9F5]"
                      : "border border-[#05251C]/15 bg-transparent text-[#05251C]/70 hover:border-[#05251C] hover:text-[#05251C]"
                  }`}
                >
                  Tất cả
                </button>
                {categoryGroups.map((group) => {
                  const isSelected = selectedParentKey === group.key;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleSelectParent(group.key)}
                      className={`min-h-[44px] px-4 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${
                        isSelected
                          ? "bg-[#05251C] text-[#FBF9F5]"
                          : "border border-[#05251C]/15 bg-transparent text-[#05251C]/70 hover:border-[#05251C] hover:text-[#05251C]"
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>

              {/* Level 2: Sub-categories for the selected Parent Group */}
              {activeParentGroup && activeParentGroup.children.length > 0 && (
                <div
                  role="tablist"
                  aria-label={`Danh mục con của ${activeParentGroup.name}`}
                  className="flex flex-wrap items-center gap-2 border-l-2 border-[#05251C]/30 pl-3 pt-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedChildKey === "all"}
                    onClick={() => setSelectedChildKey("all")}
                    className={`min-h-[38px] px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
                      selectedChildKey === "all"
                        ? "border border-[#05251C] bg-[#05251C]/10 text-[#05251C]"
                        : "border border-[#05251C]/15 text-[#05251C]/60 hover:text-[#05251C]"
                    }`}
                  >
                    Tất cả {activeParentGroup.name}
                  </button>
                  {activeParentGroup.children.map((child) => {
                    const isChildSelected = selectedChildKey === child.key;
                    return (
                      <button
                        key={child.key}
                        type="button"
                        role="tab"
                        aria-selected={isChildSelected}
                        onClick={() => setSelectedChildKey(child.key)}
                        className={`min-h-[38px] px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
                          isChildSelected
                            ? "border border-[#05251C] bg-[#05251C]/10 text-[#05251C]"
                            : "border border-[#05251C]/15 text-[#05251C]/60 hover:text-[#05251C]"
                        }`}
                      >
                        {child.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active Search Filter Chip */}
          {homeSearchTerm && (
            <div className="mt-6 flex items-center gap-2 text-xs">
              <span className="text-[#05251C]/60">Đang lọc theo từ khóa:</span>
              <span className="bg-[#05251C]/10 px-2.5 py-1 font-semibold text-[#05251C]">
                &ldquo;{homeSearchTerm}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setHomeSearchTerm("")}
                className="text-[#05251C]/50 underline hover:text-[#05251C] ml-1"
              >
                Xóa lọc
              </button>
            </div>
          )}

          {/* Product Grid State */}
          <div className="mt-10">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex flex-col space-y-3"
                  >
                    <div className="aspect-[3/4] w-full animate-pulse bg-[#05251C]/5" />
                    <div className="h-4 w-3/4 animate-pulse bg-[#05251C]/5" />
                    <div className="h-3 w-1/2 animate-pulse bg-[#05251C]/5" />
                  </div>
                ))}
              </div>
            ) : hasError ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-[#05251C]/20 py-20 text-center">
                <p className="text-sm font-medium text-[#05251C]/70">
                  Không thể tải danh sách thiết kế lúc này.
                </p>
                <button
                  type="button"
                  onClick={fetchHomeData}
                  className="mt-4 inline-flex items-center gap-2 border border-[#05251C]/30 px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#05251C] hover:text-[#FBF9F5] transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-[#05251C]/20 py-20 text-center">
                <p className="font-condensed text-2xl font-bold uppercase tracking-wider text-[#05251C]">
                  Không tìm thấy thiết kế phù hợp
                </p>
                <p className="mt-2 text-xs text-[#05251C]/60">
                  Vui lòng chọn danh mục khác hoặc đặt lại từ khóa tìm kiếm.
                </p>
                {(selectedParentKey !== "all" ||
                  selectedChildKey !== "all" ||
                  homeSearchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParentKey("all");
                      setSelectedChildKey("all");
                      if (setHomeSearchTerm) setHomeSearchTerm("");
                    }}
                    className="mt-6 border border-[#05251C]/30 px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#05251C] hover:text-[#FBF9F5] transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {filteredProducts.slice(0, 12).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favoriteIds.has(String(product.id))}
                    onToggleFavorite={toggleFavorite}
                    trackingMeta={{
                      position: index + 1,
                      source: "home_collection",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
