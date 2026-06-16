import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getAllCategoriesService } from "@/services/category.service";
import { searchProductsService } from "@/services/product.service";
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
  const [sortBy, setSortBy] = useState(() => {
    const initialSort = searchParams.get("sort");
    return validSortOptions.includes(initialSort) ? initialSort : "popular";
  });
  const [filters, setFilters] = useState(initialFilters);

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
      categoryIds,
      filters.minPrice,
      filters.maxPrice,
      sortBy,
    ],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        category: categoryIds || undefined,
        minPrice: filters.minPrice !== null && filters.minPrice !== undefined ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== null && filters.maxPrice !== undefined ? filters.maxPrice : undefined,
        sort: sortBy,
        limit: 1000,
      };
      return await searchProductsService(params);
    },
    placeholderData: (keepPreviousData) => keepPreviousData,
  });

  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useDocumentTitle("Sản phẩm");

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
    const sourceProducts = Array.isArray(apiProducts) ? apiProducts : [];

    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, categoryMap, false),
    );
  }, [apiProducts, categoryMap]);

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

    const result = normalizedProducts.filter((product) => {
      const matchesKeyword =
        !keyword ||
        [product.name, product.category, product.description, product.sku].some(
          (value) => normalizeSearchText(value).includes(keyword),
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

  return (
    <div className="product-page">
      <div className="product-page__container">
        <div className="product-page__intro">
          <span>Cửa hàng thời trang</span>
          <h1>Khám phá sản phẩm</h1>
          <p>
            Lựa chọn những thiết kế phù hợp với phong cách của bạn.
          </p>
        </div>

        <div className="product-layout">
          <ProductFilter
            options={filterOptions}
            priceBounds={priceBounds}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />

          <main className="product-content">
            <ProductToolbar
              count={filteredProducts.length}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              isUsingFallback={false}
              hasApiError={Boolean(error)}
            />

            {isLoading ? (
              <EmptyState type="loading" />
            ) : currentProducts.length > 0 ? (
              <>
                <ProductGrid
                  products={currentProducts}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
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
