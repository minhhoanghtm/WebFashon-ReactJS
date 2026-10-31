import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { getAllCategoriesService } from "@/services/category.service";
import { searchProductsService } from "@/services/product.service";
import trackingService from "@/services/tracking.service";
import { useFavoriteStore } from "@/store/favorite.store";
import { formatCurrency } from "@/utils/format";
import ProductCard from "@/components/ProductCard";
import {
  buildCategoryHierarchy,
  buildFilterOptions,
  calculatePriceBounds,
  getColorHex,
  normalizeProduct,
  normalizeSearchText,
} from "./productAdapter";

const VALID_SORT_OPTIONS = [
  { value: "default", label: "Mặc định" },
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "price_asc", label: "Giá: Thấp đến Cao" },
  { value: "price_desc", label: "Giá: Cao đến Thấp" },
  { value: "name_asc", label: "Tên: A → Z" },
];

const INITIAL_FILTERS = {
  parentGroupKey: null,
  childCategoryKey: "all",
  sizes: [],
  colors: [],
  minPrice: "",
  maxPrice: "",
};

const resolveUrlCategory = (urlCategoryParam, categoryGroups, categoryMap) => {
  if (!urlCategoryParam || categoryGroups.length === 0) {
    return { parentGroupKey: "all", childCategoryKey: "all", label: null };
  }
  const paramNorm = normalizeSearchText(
    categoryMap[urlCategoryParam] || urlCategoryParam
  );

  for (const group of categoryGroups) {
    if (
      group.key === paramNorm ||
      normalizeSearchText(group.name) === paramNorm ||
      group.ids.includes(urlCategoryParam)
    ) {
      const matchedChild = group.children.find(
        (ch) => ch.key === paramNorm || ch.ids.includes(urlCategoryParam)
      );
      return {
        parentGroupKey: group.key,
        childCategoryKey: matchedChild ? matchedChild.key : "all",
        label: matchedChild ? matchedChild.name : group.name,
      };
    }
  }
  return { parentGroupKey: "all", childCategoryKey: "all", label: null };
};

const ProductSearch = () => {
  const [searchParams] = useSearchParams();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Bộ sưu tập — ${siteName}`);

  const urlSearchParam = searchParams.get("search") || "";
  const urlCategoryParam = searchParams.get("category") || "";

  const [rawCategories, setRawCategories] = useState([]);
  const [searchOverride, setSearchOverride] = useState(null);
  const searchTerm = searchOverride !== null ? searchOverride : urlSearchParam;

  const [isSemantic, setIsSemantic] = useState(true);
  const [sortBy, setSortBy] = useState(() => {
    const initialSort = searchParams.get("sort");
    return VALID_SORT_OPTIONS.some((o) => o.value === initialSort)
      ? initialSort
      : "default";
  });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id || item._id))),
    [favoriteItems]
  );

  // Load categories
  useEffect(() => {
    let isMounted = true;
    getAllCategoriesService()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setRawCategories(data);
        }
      })
      .catch((err) => console.error("Không thể tải danh mục:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      rawCategories
        .filter((c) => (c?._id || c?.id) && c?.name)
        .map((c) => [String(c._id || c.id), c.name])
    );
  }, [rawCategories]);

  const categoryGroups = useMemo(
    () => buildCategoryHierarchy(rawCategories),
    [rawCategories]
  );

  // Derive URL ?category= match without calling setState in useEffect
  const urlResolvedCategory = useMemo(
    () => resolveUrlCategory(urlCategoryParam, categoryGroups, categoryMap),
    [urlCategoryParam, categoryGroups, categoryMap]
  );

  // Track category view as an external side-effect only
  useEffect(() => {
    if (urlCategoryParam && urlResolvedCategory.label) {
      trackingService.trackCategoryView(
        urlCategoryParam,
        urlResolvedCategory.label
      );
    }
  }, [urlCategoryParam, urlResolvedCategory.label]);

  const effectiveParentGroupKey =
    filters.parentGroupKey !== null
      ? filters.parentGroupKey
      : urlResolvedCategory.parentGroupKey;

  const effectiveChildCategoryKey =
    filters.parentGroupKey !== null
      ? filters.childCategoryKey
      : urlResolvedCategory.childCategoryKey;

  const activeParentGroup = useMemo(
    () =>
      categoryGroups.find((g) => g.key === effectiveParentGroupKey) || null,
    [categoryGroups, effectiveParentGroupKey]
  );

  const activeChildCategory = useMemo(
    () =>
      activeParentGroup?.children?.find(
        (c) => c.key === effectiveChildCategoryKey
      ) || null,
    [activeParentGroup, effectiveChildCategoryKey]
  );

  const selectedCategoryIdsParam = useMemo(() => {
    if (activeChildCategory) return activeChildCategory.ids.join(",");
    if (activeParentGroup) return activeParentGroup.ids.join(",");
    return "";
  }, [activeParentGroup, activeChildCategory]);

  const {
    data: apiProducts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "products-search",
      searchTerm,
      isSemantic,
      selectedCategoryIdsParam,
      filters.minPrice,
      filters.maxPrice,
      sortBy,
    ],
    queryFn: async () => {
      const params = {
        search: searchTerm.trim() || undefined,
        semantic: searchTerm.trim() && isSemantic ? "true" : undefined,
        category: selectedCategoryIdsParam || undefined,
        minPrice: filters.minPrice !== "" ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice !== "" ? Number(filters.maxPrice) : undefined,
        sort: sortBy !== "default" ? sortBy : undefined,
        limit: 1000,
      };
      return await searchProductsService(params);
    },
    placeholderData: (keepPreviousData) => keepPreviousData,
  });

  const normalizedProducts = useMemo(() => {
    const list = Array.isArray(apiProducts) ? apiProducts : [];
    return list.map((p, idx) => normalizeProduct(p, idx, categoryMap));
  }, [apiProducts, categoryMap]);

  const filterOptions = useMemo(
    () => buildFilterOptions(normalizedProducts),
    [normalizedProducts]
  );

  const priceBounds = useMemo(
    () => calculatePriceBounds(normalizedProducts),
    [normalizedProducts]
  );

  // Client-side refinement (sizes, colors, price, category fallback, sort)
  const filteredProducts = useMemo(() => {
    let list = normalizedProducts.filter((product) => {
      if (activeChildCategory) {
        const matchId = activeChildCategory.ids.includes(
          String(product.category_id)
        );
        const matchName =
          normalizeSearchText(product.category) === activeChildCategory.key;
        if (!matchId && !matchName) return false;
      } else if (activeParentGroup) {
        const matchId = activeParentGroup.ids.includes(
          String(product.category_id)
        );
        if (!matchId) return false;
      }

      if (
        filters.sizes.length > 0 &&
        !filters.sizes.some((s) => product.sizes.includes(s))
      ) {
        return false;
      }

      if (
        filters.colors.length > 0 &&
        !filters.colors.some((c) => product.colors.includes(c))
      ) {
        return false;
      }

      if (
        filters.minPrice !== "" &&
        product.price < Number(filters.minPrice)
      ) {
        return false;
      }

      if (
        filters.maxPrice !== "" &&
        product.price > Number(filters.maxPrice)
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sortBy === "price_asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name_asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else if (sortBy === "popular") {
      sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => (b.createdAtTime || 0) - (a.createdAtTime || 0));
    }

    return sorted;
  }, [
    normalizedProducts,
    activeParentGroup,
    activeChildCategory,
    filters.sizes,
    filters.colors,
    filters.minPrice,
    filters.maxPrice,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage]);

  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((item) => item !== value)
          : [...prev[key], value],
      };
    });
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setFilters({
      ...INITIAL_FILTERS,
      parentGroupKey: "all",
      childCategoryKey: "all",
    });
    setSearchOverride("");
    setSortBy("default");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    effectiveParentGroupKey !== "all" ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    Boolean(searchTerm.trim());

  const renderFilterSections = () => (
    <div className="space-y-7">
      {/* 1. Grouped Parent-Child Categories */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">
          Danh mục thiết kế
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setFilters((prev) => ({
                ...prev,
                parentGroupKey: "all",
                childCategoryKey: "all",
              }));
              setCurrentPage(1);
            }}
            className={`flex min-h-[38px] w-full items-center justify-between px-3 text-left text-xs transition-colors ${
              effectiveParentGroupKey === "all"
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span>Tất cả thiết kế</span>
          </button>

          {categoryGroups.map((group) => {
            const isParentActive = effectiveParentGroupKey === group.key;
            return (
              <div key={group.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      parentGroupKey: group.key,
                      childCategoryKey: "all",
                    }));
                    setCurrentPage(1);
                  }}
                  className={`flex min-h-[38px] w-full items-center justify-between px-3 text-left text-xs transition-colors ${
                    isParentActive
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span>{group.name}</span>
                  {group.children.length > 0 && (
                    <span className="text-[10px] opacity-70">
                      ({group.children.length})
                    </span>
                  )}
                </button>

                {isParentActive && group.children.length > 0 && (
                  <div className="ml-3 space-y-1 border-l border-border pl-2.5 pt-1">
                    {group.children.map((child) => {
                      const isChildActive =
                        effectiveChildCategoryKey === child.key;
                      return (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              parentGroupKey: group.key,
                              childCategoryKey: isChildActive
                                ? "all"
                                : child.key,
                            }));
                            setCurrentPage(1);
                          }}
                          className={`flex min-h-[34px] w-full items-center justify-between px-2.5 text-left text-xs transition-colors ${
                            isChildActive
                              ? "border border-foreground bg-secondary font-semibold text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range */}
      <div className="border-t border-border pt-6">
        <h3 className="mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">
          Khoảng giá (VNĐ)
        </h3>
        {priceBounds.max > 0 && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            Từ {formatCurrency(priceBounds.min)} —{" "}
            {formatCurrency(priceBounds.max)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min-price" className="sr-only">
              Giá tối thiểu
            </label>
            <input
              id="filter-min-price"
              type="number"
              min="0"
              step="10000"
              value={filters.minPrice}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, minPrice: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Từ..."
              className="h-10 w-full border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="sr-only">
              Giá tối đa
            </label>
            <input
              id="filter-max-price"
              type="number"
              min="0"
              step="10000"
              value={filters.maxPrice}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, maxPrice: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Đến..."
              className="h-10 w-full border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Sizes (only if real sizes exist in products) */}
      {filterOptions.sizes.length > 0 && (
        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">
            Kích cỡ
          </h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sizes.map((size) => {
              const selected = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleArrayFilter("sizes", size)}
                  className={`touch-target px-3 text-xs font-medium uppercase transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Colors (only if real colors exist in products) */}
      {filterOptions.colors.length > 0 && (
        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">
            Màu sắc
          </h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.colors.map((color) => {
              const selected = filters.colors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleArrayFilter("colors", color)}
                  className={`min-h-[38px] inline-flex items-center gap-2 border px-3 text-xs transition-colors ${
                    selected
                      ? "border-foreground bg-secondary font-semibold text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: getColorHex(color) }}
                    aria-hidden="true"
                  />
                  <span>{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="border-t border-border pt-6">
          <button
            type="button"
            onClick={handleClearAll}
            className="touch-target w-full border border-border text-xs font-medium tracking-[0.16em] uppercase text-foreground transition-colors hover:bg-secondary"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Page Header & Breadcrumb */}
        <div className="mb-8 border-b border-border pb-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Bộ sưu tập</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
                {activeChildCategory
                  ? `${activeParentGroup?.name} · ${activeChildCategory.name}`
                  : activeParentGroup
                  ? activeParentGroup.name
                  : "Tất cả Thiết kế Giám tuyển"}
              </h1>
            </div>
            <p className="text-xs tabular-nums tracking-[0.16em] uppercase text-muted-foreground">
              Hiển thị {filteredProducts.length} thiết kế
            </p>
          </div>
        </div>

        {/* Main 2-Column Catalog Layout */}
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Left Sidebar Filter (Desktop) */}
          <aside
            aria-label="Bộ lọc sản phẩm"
            className="hidden w-64 shrink-0 border border-border bg-card p-5 lg:block"
          >
            {renderFilterSections()}
          </aside>

          {/* Right Content Area */}
          <div className="min-w-0 flex-1 w-full">
            {/* Toolbar: Search, AI Semantic Toggle, Sort, Mobile Filter Button */}
            <div className="mb-6 flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchOverride(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm theo tên, phom dáng, mô tả..."
                    aria-label="Tìm kiếm trong bộ sưu tập"
                    className="h-11 w-full border border-border bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOverride("");
                        setCurrentPage(1);
                      }}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Xóa từ khóa"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* AI Semantic Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSemantic((prev) => !prev)}
                  aria-pressed={isSemantic}
                  title="Tìm kiếm ngữ nghĩa AI Vector"
                  className={`touch-target inline-flex shrink-0 items-center gap-1.5 border px-3 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${
                    isSemantic
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles size={13} />
                  <span className="hidden sm:inline">AI Search</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                {/* Mobile Filter Trigger */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="touch-target inline-flex items-center gap-2 border border-border bg-background px-4 text-xs font-medium tracking-[0.14em] uppercase text-foreground lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  <span>Bộ lọc</span>
                </button>

                {/* Sort Select */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="catalog-sort-select"
                    className="hidden text-[11px] tracking-[0.14em] uppercase text-muted-foreground sm:inline"
                  >
                    Sắp xếp:
                  </label>
                  <select
                    id="catalog-sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-11 border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-foreground focus:outline-none"
                  >
                    {VALID_SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="mb-6 border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
                Không thể kết nối máy chủ tìm kiếm. Vui lòng kiểm tra kết nối và
                thử lại.
              </div>
            )}

            {/* Product Grid */}
            {isLoading ? (
              <div
                className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3"
                aria-busy="true"
              >
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col border border-border bg-card"
                  >
                    <div className="aspect-[3/4] w-full animate-pulse bg-secondary" />
                    <div className="space-y-2.5 p-4">
                      <div className="h-2.5 w-1/3 animate-pulse bg-secondary" />
                      <div className="h-4 w-4/5 animate-pulse bg-secondary" />
                      <div className="h-4 w-1/2 animate-pulse bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-border bg-card px-6 py-20 text-center">
                <p className="font-serif text-2xl text-foreground">
                  Không tìm thấy thiết kế phù hợp
                </p>
                <p className="mt-2 max-w-md text-xs text-muted-foreground">
                  Hãy thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại bộ lọc danh
                  mục, kích cỡ và khoảng giá.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="touch-target mt-6 bg-primary px-6 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground"
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={favoriteIds.has(String(product.id))}
                      onToggleFavorite={toggleFavorite}
                      trackingMeta={{
                        position: (safePage - 1) * pageSize + index + 1,
                        search_query: searchTerm.trim() || undefined,
                        source: "product_search",
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Phân trang danh sách sản phẩm"
                    className="mt-10 flex items-center justify-center gap-2 border-t border-border pt-8"
                  >
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="touch-target inline-flex items-center justify-center border border-border px-3 text-xs text-foreground transition-colors hover:bg-secondary disabled:opacity-35"
                      aria-label="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNumber = idx + 1;
                      const isCurrent = pageNumber === safePage;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          aria-current={isCurrent ? "page" : undefined}
                          onClick={() => {
                            setCurrentPage(pageNumber);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`touch-target inline-flex items-center justify-center px-3.5 text-xs font-medium tabular-nums transition-colors ${
                            isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-foreground hover:bg-secondary"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="touch-target inline-flex items-center justify-center border border-border px-3 text-xs text-foreground transition-colors hover:bg-secondary disabled:opacity-35"
                      aria-label="Trang tiếp theo"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc sản phẩm"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-10 flex w-full max-w-xs flex-col justify-between overflow-y-auto border-l border-border bg-background p-6 shadow-2xl">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <span className="font-serif text-lg uppercase tracking-[0.14em] text-foreground">
                  Bộ lọc Giám tuyển
                </span>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="touch-target inline-flex items-center justify-center text-foreground hover:bg-secondary"
                  aria-label="Đóng bộ lọc"
                >
                  <X size={18} />
                </button>
              </div>
              {renderFilterSections()}
            </div>
            <div className="mt-8 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="touch-target w-full bg-primary text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground"
              >
                Xem {filteredProducts.length} thiết kế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
