import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getAllCategoriesService } from "@/services/category.service";
import { searchProductsService } from "@/services/product.service";
import trackingService from "@/services/tracking.service";
import { useFavoriteStore } from "@/store/favorite.store";
import EmptyState from "./EmptyState";
import ProductFilter from "./ProductFilter";
import ProductGrid from "./ProductGrid";
import ProductPagination from "./ProductPagination";
import ProductToolbar from "./ProductToolbar";
import {
  buildFilterOptions,
  calculatePriceBounds,
  normalizeProduct,
  normalizeSearchText,
} from "./productAdapter";
import "./product.css";

const initialFilters = {
  categories: [],
  brands: [],
  statuses: [],
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
};

const validSortOptions = [
  "default",
  "popular",
  "price_asc",
  "price_desc",
  "name_asc",
  "newest",
];

const ProductSearch = () => {
  const [searchParams] = useSearchParams();
  const [categoryMap, setCategoryMap] = useState({});
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || "",
  );
  const [isSemantic, setIsSemantic] = useState(true);
  const [sortBy, setSortBy] = useState(() => {
    const initialSort = searchParams.get("sort");
    return validSortOptions.includes(initialSort) ? initialSort : "default";
  });
  const [filters, setFilters] = useState(initialFilters);
  const [gridDensity, setGridDensity] = useState(() => {
    try {
      return localStorage.getItem("404studio_grid_density") || "compact";
    } catch {
      return "compact";
    }
  });

  const handleDensityChange = (density) => {
    setGridDensity(density);
    try {
      localStorage.setItem("404studio_grid_density", density);
    } catch {
      // ignore
    }
  };

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const categoryIds = useMemo(() => {
    return Object.entries(categoryMap)
      .filter(([id, name]) => filters.categories.includes(name))
      .map(([id]) => id)
      .join(",");
  }, [filters.categories, categoryMap]);

  const { data: apiProducts = [], isLoading, error } = useQuery({
    queryKey: [
      "products-search",
      searchTerm,
      isSemantic,
      categoryIds,
      filters.minPrice,
      filters.maxPrice,
      sortBy,
    ],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        semantic: searchTerm && isSemantic ? "true" : undefined,
        category: categoryIds || undefined,
        minPrice: filters.minPrice !== null && filters.minPrice !== undefined ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== null && filters.maxPrice !== undefined ? filters.maxPrice : undefined,
        sort: sortBy !== "default" ? sortBy : undefined,
        limit: 1000,
      };
      return await searchProductsService(params);
    },
    placeholderData: (keepPreviousData) => keepPreviousData,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id))),
    [favoriteItems],
  );

  useDocumentTitle("Sản phẩm — 404STUDIO");

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categories = await getAllCategoriesService();
        if (!isMounted) return;

        const nextMap = Object.fromEntries(
          categories
            .filter((category) => category?._id && category?.name)
            .map((category) => [String(category._id), category.name]),
        );
        setCategoryMap(nextMap);
      } catch (categoryError) {
        console.error("Không thể tải danh mục sản phẩm:", categoryError);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && Object.keys(categoryMap).length > 0) {
      const categoryName = categoryMap[categoryParam];
      if (categoryName) {
        trackingService.trackCategoryView(categoryParam, categoryName);
        setFilters((prev) => ({
          ...prev,
          categories: [categoryName],
        }));
      }
    }
  }, [searchParams, categoryMap]);

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    setSearchTerm(querySearch);
    setCurrentPage(1);
  }, [searchParams]);

  const normalizedProducts = useMemo(() => {
    const sourceProducts = Array.isArray(apiProducts)
      ? apiProducts
      : (apiProducts && typeof apiProducts === "object" && Array.isArray(apiProducts.products)
        ? apiProducts.products
        : []);

    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, categoryMap),
    );
  }, [apiProducts, categoryMap]);

  // Record a completed search only after its normalized result set exists.
  useEffect(() => {
    const cleanQuery = searchTerm.trim();
    if (!cleanQuery || isLoading || error) return;

    const count = normalizedProducts.length;
    if (isSemantic) {
      trackingService.trackSemanticSearchUsed(cleanQuery, count);
    }
    trackingService.trackSearch(cleanQuery, count);
  }, [searchTerm, isSemantic, isLoading, error, normalizedProducts.length]);

  const filterOptions = useMemo(
    () => buildFilterOptions(normalizedProducts),
    [normalizedProducts],
  );
  const priceBounds = useMemo(
    () => calculatePriceBounds(normalizedProducts),
    [normalizedProducts],
  );

  const filteredProducts = useMemo(() => {
    const keyword = normalizeSearchText(searchTerm);
    const minPrice = filters.minPrice ?? priceBounds.min;
    const maxPrice = filters.maxPrice ?? priceBounds.max;

    const matchesSelection = (selectedValues, productValues) => {
      if (selectedValues.length === 0) return true;
      const values = Array.isArray(productValues)
        ? productValues
        : [productValues].filter(Boolean);
      return selectedValues.some((value) => values.includes(value));
    };

    const searchWords = keyword.split(/\s+/).filter(Boolean);

    const result = normalizedProducts.filter((product) => {
      const matchesKeyword =
        isSemantic ||
        searchWords.length === 0 ||
        searchWords.every((word) =>
          [product.name, product.category, product.description, product.sku].some(
            (value) => normalizeSearchText(value).includes(word),
          ),
        );

      return (
        matchesKeyword &&
        matchesSelection(filters.categories, product.category) &&
        matchesSelection(filters.brands, product.brand) &&
        matchesSelection(filters.statuses, product.status) &&
        matchesSelection(filters.sizes, product.sizes) &&
        matchesSelection(filters.colors, product.colors) &&
        product.price >= minPrice &&
        product.price <= maxPrice
      );
    });

    return result.sort((firstProduct, secondProduct) => {
      switch (sortBy) {
        case "default":
          return firstProduct.sourceIndex - secondProduct.sourceIndex;
        case "price_asc":
          return firstProduct.price - secondProduct.price;
        case "price_desc":
          return secondProduct.price - firstProduct.price;
        case "name_asc":
          return firstProduct.name.localeCompare(secondProduct.name, "vi");
        case "newest":
          return (
            secondProduct.createdAtTime - firstProduct.createdAtTime ||
            firstProduct.sourceIndex - secondProduct.sourceIndex
          );
        case "popular":
        default:
          return (
            secondProduct.sold - firstProduct.sold ||
            secondProduct.rating - firstProduct.rating ||
            firstProduct.sourceIndex - secondProduct.sourceIndex
          );
      }
    });
  }, [filters, normalizedProducts, priceBounds, searchTerm, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize),
  );
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const clearAll = () => {
    setFilters(initialFilters);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleRemoveFilter = (type, value) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        minPrice: null,
        maxPrice: null,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: (prev[type] || []).filter((item) => item !== value),
      }));
    }
    setCurrentPage(1);
  };

  return (
    <div className="product-page min-h-screen bg-[#FBF9F5] py-8 sm:py-12 select-none">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 pb-6 border-b border-[#05251C]/10"
        >
          {/* Breadcrumb minimal */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B716E] mb-3">
            <a href="/" className="hover:text-[#05251C] transition-colors">404STUDIO</a>
            <span>/</span>
            <span className="text-[#05251C] font-bold">DISCOVERY</span>
            {searchTerm && (
              <>
                <span>/</span>
                <span className="text-[#05251C] font-black truncate max-w-[200px]">
                  "{searchTerm}"
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#F5DD20] shadow-sm" />
                <span className="micro-label text-[#6B716E]">
                  READY-TO-WEAR & ATELIER CATALOG
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#05251C] tracking-tighter uppercase font-display leading-[0.92]">
                ALL CREATIONS.
              </h1>
            </div>

            <div className="flex flex-col md:items-end text-xs text-[#6B716E]">
              <span className="font-display text-base text-[#05251C] font-black tracking-wider">
                [ {filteredProducts.length} DESIGNS ]
              </span>
              <span className="hidden sm:inline mt-0.5 text-xs text-[#6B716E]">
                Cấu trúc may đo độc bản kết hợp sự phóng khoáng đương đại
              </span>
            </div>
          </div>
        </motion.div>

        <div className="product-layout flex flex-col lg:flex-row gap-8 items-start">
          <ProductFilter
            options={filterOptions}
            priceBounds={priceBounds}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            totalResultsCount={filteredProducts.length}
          />

          <main className="product-content flex-1 min-w-0 w-full">
            <ProductToolbar
              count={filteredProducts.length}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              isUsingFallback={false}
              hasApiError={Boolean(error)}
              filters={filters}
              priceBounds={priceBounds}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearAll}
              gridDensity={gridDensity}
              onDensityChange={handleDensityChange}
              isSemantic={isSemantic}
              onSemanticChange={setIsSemantic}
            />

            {isLoading ? (
              <EmptyState type="loading" gridDensity={gridDensity} />
            ) : currentProducts.length > 0 ? (
              <>
                <ProductGrid
                  products={currentProducts}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  gridDensity={gridDensity}
                  searchTerm={searchTerm}
                />
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <EmptyState type="empty" onClear={clearAll} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
