import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Filter,
  SlidersHorizontal,
  Search,
  LayoutGrid,
  Grid2X2,
  List,
  Check,
  ShoppingBag,
  Eye,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { productApi, categoryApi } from "../../api/endpoints";
import { ProductCard } from "../../components/shared/ProductCard";
import { Button } from "../../components/ui/Button";
import { SafeImage } from "../../components/ui/SafeImage";
import { useCartStore } from "../../stores/cartStore";

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "editorial" | "list"
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [quickViewAdded, setQuickViewAdded] = useState(false);

  const [priceFilter, setPriceFilter] = useState("all"); // "all" | "under_1m" | "1m_2m" | "above_2m"
  const [inStockOnly, setInStockOnly] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const selectedCategory = searchParams.get("category") || "";
  const selectedSort = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("search") || "";

  // 1. Fetch categories
  useEffect(() => {
    let active = true;
    async function fetchCategories() {
      try {
        const catRes = await categoryApi.getAll();
        const cats = catRes?.data || catRes || [];
        if (active && Array.isArray(cats)) {
          setCategories(cats);
        }
      } catch (err) {
        console.warn("Categories fetch error:", err);
      }
    }
    fetchCategories();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch products
  useEffect(() => {
    let active = true;
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const queryParams = { limit: 24 };
        if (selectedCategory) queryParams.category = selectedCategory;
        if (selectedSort && selectedSort !== "newest") queryParams.sort = selectedSort;
        if (searchQuery) queryParams.search = searchQuery;

        const prodRes = await productApi.getAll(queryParams);
        if (active) {
          const list = prodRes?.data || prodRes || [];
          if (Array.isArray(list) && list.length > 0) {
            setProducts(list);
          } else {
            const fallbackRes = await productApi.getAll({ limit: 12 }).catch(() => null);
            const fbList = fallbackRes?.data || fallbackRes || [];
            setProducts(Array.isArray(fbList) ? fbList : []);
          }
        }
      } catch (err) {
        console.error("Products fetch error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchProducts();
    return () => {
      active = false;
    };
  }, [selectedCategory, selectedSort, searchQuery]);

  const handleCategorySelect = (catId) => {
    if (selectedCategory === catId) {
      searchParams.delete("category");
    } else {
      searchParams.set("category", catId);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (e) => {
    searchParams.set("sort", e.target.value);
    setSearchParams(searchParams);
  };

  // Client-side sub-filtering for price & stock
  const filteredProducts = products.filter((p) => {
    const price = p.price || p.new_price || 0;
    if (priceFilter === "under_1m" && price >= 1000000) return false;
    if (priceFilter === "1m_2m" && (price < 1000000 || price > 2000000)) return false;
    if (priceFilter === "above_2m" && price <= 2000000) return false;
    if (inStockOnly && p.stock === 0) return false;
    return true;
  });

  const selectedCategoryObj = categories.find((c) => c._id === selectedCategory);

  const handleQuickViewAdd = () => {
    if (!quickViewProduct) return;
    const img =
      quickViewProduct.displayProduct?.[0] ||
      quickViewProduct.displayProduct ||
      quickViewProduct.images?.[0] ||
      quickViewProduct.image ||
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";

    addItem({
      id: quickViewProduct._id,
      productId: quickViewProduct._id,
      name: quickViewProduct.name,
      price: quickViewProduct.price || quickViewProduct.new_price || 0,
      image: img,
      quantity: quickViewQty,
    });
    setQuickViewAdded(true);
    setTimeout(() => {
      setQuickViewAdded(false);
      setQuickViewProduct(null);
    }, 1500);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[#9a989f] mb-6">
        <Link to="/" className="hover:text-[#f4f0e8] transition-colors">
          Trang Chủ
        </Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-[#f4f0e8] transition-colors">
          Bộ Sưu Tập
        </Link>
        {selectedCategoryObj && (
          <>
            <ChevronRight size={12} />
            <span className="text-[#ff6d00] font-bold">{selectedCategoryObj.name}</span>
          </>
        )}
      </nav>

      {/* 2. Editorial Category Hero Banner */}
      <div className="relative mb-10 p-8 sm:p-12 bg-gradient-to-r from-[#121215] via-[#161619] to-[#121215] border border-[rgba(244,240,232,0.12)] overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#e65100] uppercase">
            <Sparkles size={12} />
            <span>CATALOGUE MAY ĐO 2026/27</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f0e8]">
            {selectedCategoryObj
              ? selectedCategoryObj.name.toUpperCase()
              : searchQuery
              ? `TÌM KIẾM: "${searchQuery}"`
              : "TẤT CẢ THIẾT KẾ ATELIER"}
          </h1>
          <p className="text-xs sm:text-sm text-[#9a989f] leading-relaxed">
            {selectedCategoryObj?.description ||
              "Khám phá các dòng sản phẩm thời trang may đo đơn sắc, sử dụng chất liệu vải len Ý, lụa tự nhiên và bông Ai Cập được cắt may tỉ mỉ."}
          </p>
        </div>
      </div>

      {/* 3. Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(244,240,232,0.1)] mb-8">
        <div className="flex items-center gap-4 text-xs font-mono text-[#9a989f]">
          <span className="font-bold text-[#f4f0e8]">
            {filteredProducts.length} Thiết kế
          </span>
          <span>•</span>
          <span>Bản sắc đơn sắc Atelier</span>
        </div>

        {/* View Switcher & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Buttons (Desktop) */}
          <div className="hidden sm:flex items-center p-1 bg-[#161619] border border-white/10 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-[#e65100] text-white" : "text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
              title="Lưới 3 cột chuẩn"
              aria-label="Lưới 3 cột chuẩn"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("editorial")}
              className={`p-1.5 transition-colors ${
                viewMode === "editorial" ? "bg-[#e65100] text-white" : "text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
              title="Lưới 2 cột phóng lớn"
              aria-label="Lưới 2 cột phóng lớn"
            >
              <Grid2X2 size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${
                viewMode === "list" ? "bg-[#e65100] text-white" : "text-[#9a989f] hover:text-[#f4f0e8]"
              }`}
              title="Danh sách hàng ngang"
              aria-label="Danh sách hàng ngang"
            >
              <List size={15} />
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label="Mở bộ lọc sản phẩm"
            className="lg:hidden min-h-[40px] px-3.5 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs font-display tracking-wider uppercase text-[#f4f0e8] flex items-center gap-2"
          >
            <Filter size={14} />
            <span>Bộ Lọc</span>
          </button>

          {/* Sort Select */}
          <select
            value={selectedSort}
            onChange={handleSortChange}
            aria-label="Sắp xếp sản phẩm"
            className="min-h-[40px] px-3 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs font-display tracking-wider uppercase text-[#f4f0e8] focus:border-[#e65100]"
          >
            <option value="newest">Mới Nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="rating">Đánh Giá Cao</option>
          </select>
        </div>
      </div>

      {/* 4. Main Body: Sidebar Filters + Products Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside
          className={`lg:col-span-1 ${
            isFilterOpen ? "block" : "hidden lg:block"
          } space-y-8 bg-[#121215] p-6 border border-[rgba(244,240,232,0.1)] h-fit`}
        >
          {/* Category Filter */}
          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] mb-4 pb-2 border-b border-white/10 flex items-center gap-2 font-bold">
              <SlidersHorizontal size={14} className="text-[#e65100]" />
              <span>Danh Mục Thiết Kế</span>
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCategorySelect("")}
                className={`w-full text-left px-3 py-2 text-xs font-medium tracking-wide transition-colors ${
                  !selectedCategory
                    ? "bg-[#e65100] text-white font-bold"
                    : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                }`}
              >
                Tất Cả Danh Mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat._id)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium tracking-wide transition-colors ${
                    selectedCategory === cat._id
                      ? "bg-[#e65100] text-white font-bold"
                      : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] mb-4 pb-2 border-b border-white/10 font-bold">
              Khoảng Giá (VND)
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { id: "all", label: "Tất cả mức giá" },
                { id: "under_1m", label: "Dưới 1.000.000 ₫" },
                { id: "1m_2m", label: "1.000.000 ₫ - 2.000.000 ₫" },
                { id: "above_2m", label: "Trên 2.000.000 ₫" },
              ].map((tier) => (
                <label
                  key={tier.id}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors text-[#9a989f]"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={priceFilter === tier.id}
                    onChange={() => setPriceFilter(tier.id)}
                    className="accent-[#e65100]"
                  />
                  <span>{tier.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-2 border-t border-white/10">
            <label className="flex items-center justify-between cursor-pointer text-xs font-display uppercase tracking-wider text-[#f4f0e8]">
              <span>Chỉ còn hàng</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#e65100]"
              />
            </label>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || priceFilter !== "all" || inStockOnly) && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                setSearchParams({});
                setPriceFilter("all");
                setInStockOnly(false);
              }}
            >
              Đặt Lại Toàn Bộ Lọc
            </Button>
          )}

          {/* Brand Promise Callout */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <h4 className="font-display text-xs uppercase text-[#f4f0e8] font-bold">
              Chính Sách May Đo
            </h4>
            <p className="text-[11px] text-[#9a989f] leading-relaxed">
              Mọi sản phẩm của Atelier đều được đóng gói trong hộp đen cao cấp với bảo hành đường chỉ trọn đời và đổi size miễn phí trong 7 ngày.
            </p>
          </div>
        </aside>

        {/* Right Products Content */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#161619] animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div
              className={`grid gap-4 sm:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3"
                  : viewMode === "editorial"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {filteredProducts.map((p) => {
                if (viewMode === "list") {
                  const img =
                    p.displayProduct?.[0] ||
                    p.displayProduct ||
                    p.images?.[0] ||
                    p.image ||
                    "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80";

                  return (
                    <div
                      key={p._id}
                      className="p-4 bg-[#161619] border border-[rgba(244,240,232,0.1)] flex flex-col sm:flex-row items-center gap-6 hover:border-[#e65100]/60 transition-colors"
                    >
                      <div className="w-full sm:w-36 aspect-[3/4] bg-[#0c0c0e] shrink-0 overflow-hidden">
                        <SafeImage src={img} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#e65100]">
                          {p.category?.name || "ATELIER SIGNATURE"}
                        </span>
                        <h3 className="font-display text-base font-bold text-[#f4f0e8]">
                          <Link to={`/product/${p.slug || p._id}`}>{p.name}</Link>
                        </h3>
                        <p className="text-xs text-[#9a989f] line-clamp-2">
                          {p.description || "Thiết kế may đo thủ công đương đại từ bộ sưu tập mới."}
                        </p>
                        <div className="font-mono text-sm text-[#ff6d00] font-bold">
                          {(p.price || p.new_price || 0).toLocaleString("vi-VN")} ₫
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <Button
                          variant="signal"
                          size="sm"
                          onClick={() => setQuickViewProduct(p)}
                          className="flex-1 sm:flex-none gap-1.5"
                        >
                          <Eye size={13} />
                          <span>Xem Nhanh</span>
                        </Button>
                        <Link to={`/product/${p.slug || p._id}`} className="flex-1 sm:flex-none">
                          <Button variant="secondary" size="sm" className="w-full">
                            Chi Tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={p._id} className="relative group">
                    <ProductCard product={p} />
                    {/* Quick View Floating Pill */}
                    <button
                      onClick={() => setQuickViewProduct(p)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-18 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0c0c0e]/90 hover:bg-[#e65100] text-[#f4f0e8] text-[10px] font-display uppercase tracking-widest border border-white/20 flex items-center gap-1.5 shadow-xl z-20"
                    >
                      <Eye size={12} />
                      <span>Xem Nhanh</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#121215] border border-[rgba(244,240,232,0.1)] space-y-4">
              <Search size={32} className="mx-auto text-[#6b6973]" />
              <h3 className="font-display text-lg text-[#f4f0e8] uppercase">
                Không tìm thấy thiết kế phù hợp
              </h3>
              <p className="text-xs text-[#9a989f] max-w-sm mx-auto">
                Vui lòng thử từ khóa khác hoặc xóa bộ lọc danh mục để khám phá tất cả các thiết kế trong bộ sưu tập.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchParams({});
                  setPriceFilter("all");
                  setInStockOnly(false);
                }}
              >
                Xóa Bộ Lọc
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* 5. Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#121215] border border-[rgba(244,240,232,0.15)] p-6 sm:p-8 shadow-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 text-[#9a989f] hover:text-[#f4f0e8] transition-colors p-1"
              aria-label="Đóng cửa sổ"
            >
              <X size={18} />
            </button>

            {/* Left Image */}
            <div className="aspect-[3/4] bg-[#0c0c0e] border border-white/10 overflow-hidden">
              <SafeImage
                src={
                  quickViewProduct.displayProduct?.[0] ||
                  quickViewProduct.displayProduct ||
                  quickViewProduct.images?.[0] ||
                  quickViewProduct.image ||
                  "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80"
                }
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Details */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e65100]">
                  XEM NHANH THIẾT KẾ
                </span>
                <h3 className="font-display text-lg font-bold text-[#f4f0e8] leading-snug">
                  {quickViewProduct.name}
                </h3>
                <div className="text-base font-mono text-[#ff6d00] font-bold">
                  {(quickViewProduct.price || quickViewProduct.new_price || 0).toLocaleString("vi-VN")} ₫
                </div>
                <p className="text-xs text-[#9a989f] line-clamp-3 leading-relaxed">
                  {quickViewProduct.description ||
                    "Thiết kế may đo đương đại, tôn vinh đường nét cơ thể với các chất liệu vải thượng hạng tuyển chọn."}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono uppercase text-[#9a989f]">Số lượng:</span>
                  <div className="flex items-center border border-white/20 bg-[#161619]">
                    <button
                      onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      className="px-2.5 py-1 text-xs hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-mono">{quickViewQty}</span>
                    <button
                      onClick={() => setQuickViewQty(quickViewQty + 1)}
                      className="px-2.5 py-1 text-xs hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  variant="signal"
                  size="md"
                  onClick={handleQuickViewAdd}
                  className="w-full gap-2"
                >
                  {quickViewAdded ? (
                    <>
                      <Check size={16} />
                      <span>Đã Thêm Vào Giỏ</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      <span>Thêm Vào Giỏ Ngay</span>
                    </>
                  )}
                </Button>

                <Link
                  to={`/product/${quickViewProduct.slug || quickViewProduct._id}`}
                  onClick={() => setQuickViewProduct(null)}
                  className="text-center block text-xs font-mono text-[#9a989f] hover:text-[#f4f0e8] uppercase tracking-wider"
                >
                  Xem chi tiết đầy đủ & các biến thể →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
