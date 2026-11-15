import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAllProductService } from "@/services/product.service";
import { getAllCategoriesService } from "@/services/category.service";
import { useFavoriteStore } from "@/store/favorite.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useLenis, { scrollToLenis } from "@/hooks/useLenis";
import { useGSAP } from "@/hooks/useGSAP";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import ProductCard from "@/components/ProductCard";
import CinematicHeader from "./components/CinematicHeader";
import CinematicHero from "./components/CinematicHero";
import BrandChapterSection from "./components/BrandChapterSection";
import ManifestoVideoSection from "./components/ManifestoVideoSection";
import CollageLookbookSection from "./components/CollageLookbookSection";
import HomeDotNavigation from "./components/HomeDotNavigation";
import {
  buildCategoryHierarchy,
  normalizeProduct,
  normalizeSearchText,
} from "./productAdapter";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_SECTIONS = [
  { id: "section-hero", label: "Khám phá Atelier" },
  { id: "section-collection", label: "Tất cả thiết kế" },
  { id: "section-brand", label: "Chương thương hiệu" },
  { id: "section-manifesto", label: "Tuyên ngôn bản sắc" },
  { id: "section-lookbook", label: "Collage Lookbook" },
];

const Home = () => {
  useDocumentTitle("404 STUDIO — Atelier Edition");
  useLenis(); // Smooth scrolling with Lenis + ScrollTrigger integration

  const exploreRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { homeSearchTerm = "", setHomeSearchTerm } = useOutletContext() || {};

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const [rawProducts, setRawProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedParentKey, setSelectedParentKey] = useState("all");
  const [selectedChildKey, setSelectedChildKey] = useState("all");
  const [productCarouselPage, setProductCarouselPage] = useState(0);

  useEffect(() => {
    setProductCarouselPage(0);
  }, [selectedParentKey, selectedChildKey, homeSearchTerm]);

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

  // Refresh GSAP ScrollTrigger on resize and after data loads
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
      scrollToLenis(exploreRef.current, { duration: 1.1 });
    }
  };

  // GSAP: Home Sections Reveal on Scroll (Opacity + translateY, runs only once)
  useGSAP(
    () => {
      if (prefersReducedMotion || typeof window === "undefined") return;

      const sections = exploreRef.current?.querySelectorAll("[data-scroll-section]");
      if (!sections || sections.length === 0) return;

      sections.forEach((sec) => {
        gsap.fromTo(
          sec,
          {
            opacity: 0,
            y: 32,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sec,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    },
    { scope: exploreRef, dependencies: [prefersReducedMotion] }
  );

  return (
    <div className="relative flex flex-col bg-neutral-950 text-foreground">
      {/* 1 & 2. Cinematic Transparent Header + Menu Overlay + Cart Drawer */}
      <CinematicHeader
        searchTerm={homeSearchTerm}
        onSearchTermChange={setHomeSearchTerm}
        isHomePage={true}
      />

      {/* Desktop Dot Navigation */}
      <HomeDotNavigation sections={HOME_SECTIONS} />

      {/* 1. Cinematic Hero */}
      <CinematicHero onExploreClick={handleScrollToExplore} />

      {/* Subsequent Content (Slides up over sticky Hero on scroll) */}
      <div
        ref={exploreRef}
        id="home-content"
        className="relative z-10 min-h-screen bg-[#FBF9F5] text-[#05251C] shadow-[0_-25px_50px_rgba(0,0,0,0.5)] transition-colors duration-500"
      >
        {/* Section 1: "TẤT CẢ THIẾT KẾ" (ngay sau Hero) */}
        <section
          id="section-collection"
          data-scroll-section
          aria-labelledby="home-collection-heading"
          className="mx-auto w-full max-w-[1440px] px-4 pt-20 pb-8 sm:px-6 lg:px-10 min-h-[100svh] flex flex-col justify-between"
        >
          {/* Section Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#05251C]/10 pb-4 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-[#05251C]/60">
                Tất cả thiết kế · Curated Atelier Edit
              </p>
              <h2
                id="home-collection-heading"
                className="mt-1 font-condensed text-3xl font-bold tracking-tight text-[#05251C] uppercase sm:text-4xl lg:text-5xl"
              >
                {activeCategoryName}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {!isLoading && !hasError && (
                <span className="text-xs tabular-nums tracking-[0.14em] uppercase text-[#05251C]/60 font-mono">
                  {filteredProducts.length} thiết kế
                </span>
              )}

              {/* Carousel Pagination Controls */}
              {Math.ceil(filteredProducts.length / 4) > 1 && (
                <div className="flex items-center gap-1.5 bg-[#05251C]/5 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setProductCarouselPage((p) => Math.max(0, p - 1))}
                    disabled={productCarouselPage === 0}
                    className="p-1.5 hover:bg-[#05251C]/10 rounded text-[#05251C] disabled:opacity-30 disabled:pointer-events-none transition-colors touch-target flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                    aria-label="Trang sản phẩm trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-medium px-2 text-[#05251C]/80 tabular-nums">
                    {String(productCarouselPage + 1).padStart(2, "0")} / {String(Math.max(1, Math.ceil(filteredProducts.length / 4))).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductCarouselPage((p) => Math.min(Math.ceil(filteredProducts.length / 4) - 1, p + 1))}
                    disabled={productCarouselPage >= Math.ceil(filteredProducts.length / 4) - 1}
                    className="p-1.5 hover:bg-[#05251C]/10 rounded text-[#05251C] disabled:opacity-30 disabled:pointer-events-none transition-colors touch-target flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                    aria-label="Trang sản phẩm kế tiếp"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <Link
                to="/products"
                className="btn-cta touch-target inline-flex items-center gap-1.5 border border-[#05251C]/20 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#05251C] transition-colors hover:border-[#05251C] hover:bg-[#05251C] hover:text-[#FBF9F5] min-h-[44px]"
              >
                <span>Toàn bộ</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Grouped & Deduplicated Parent-Child Category Chips */}
          {categoryGroups.length > 0 && (
            <div className="mt-8 space-y-3">
              {/* Level 1: Parent Groups (horizontally scrollable on mobile) */}
              <div
                role="tablist"
                aria-label="Nhóm danh mục chính"
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:pb-0"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedParentKey === "all"}
                  onClick={() => handleSelectParent("all")}
                  className={`min-h-[44px] shrink-0 px-4 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${
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
                      className={`min-h-[44px] shrink-0 px-4 text-xs font-semibold tracking-[0.18em] uppercase transition-colors ${
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
                  className="flex items-center gap-2 overflow-x-auto no-scrollbar border-l-2 border-[#05251C]/30 pl-3 pt-1 pb-1 sm:flex-wrap sm:pb-0"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedChildKey === "all"}
                    onClick={() => setSelectedChildKey("all")}
                    className={`min-h-[38px] shrink-0 px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
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
                        className={`min-h-[38px] shrink-0 px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors ${
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
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 items-stretch my-auto py-2">
                  {filteredProducts
                    .slice(productCarouselPage * 4, (productCarouselPage + 1) * 4)
                    .map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isFavorite={favoriteIds.has(String(product.id))}
                        onToggleFavorite={toggleFavorite}
                        trackingMeta={{
                          position: productCarouselPage * 4 + index + 1,
                          source: "home_collection",
                        }}
                      />
                    ))}
                </div>

                {/* Bottom CTA to view all products */}
                <div className="mt-4 flex justify-center pb-2">
                  <Link
                    to="/products"
                    className="btn-cta touch-target inline-flex min-h-[44px] items-center gap-2 border border-[#05251C] bg-[#05251C] px-8 py-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#FBF9F5] transition-all duration-300 hover:bg-transparent hover:text-[#05251C]"
                  >
                    <span>Xem toàn bộ thiết kế</span>
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: "CHƯƠNG THƯƠNG HIỆU" */}
        <div id="section-brand" data-scroll-section className="min-h-[100svh] flex flex-col justify-center">
          <BrandChapterSection />
        </div>

        {/* Section 3: "CÂU KHẨU HIỆU + VIDEO" */}
        <div id="section-manifesto" data-scroll-section className="min-h-[100svh] flex flex-col justify-center">
          <ManifestoVideoSection />
        </div>

        {/* Section 4: "COLLAGE LOOKBOOK" */}
        <div id="section-lookbook" data-scroll-section className="min-h-[100svh] flex flex-col justify-center">
          <CollageLookbookSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
