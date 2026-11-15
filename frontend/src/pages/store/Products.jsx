import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, Search, RefreshCw } from "lucide-react";
import { productApi, categoryApi } from "../../api/endpoints";
import { ProductCard } from "../../components/shared/ProductCard";
import { Button } from "../../components/ui/Button";

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const selectedCategory = searchParams.get("category") || "";
  const selectedSort = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setIsLoading(true);
      try {
        const queryParams = { limit: 12 };
        if (selectedCategory) queryParams.category = selectedCategory;
        if (selectedSort && selectedSort !== "newest") queryParams.sort = selectedSort;
        if (searchQuery) queryParams.search = searchQuery;

        const [prodRes, catRes] = await Promise.allSettled([
          productApi.getAll(queryParams),
          categoryApi.getAll(),
        ]);

        if (active) {
          if (prodRes.status === "fulfilled") {
            const list = prodRes.value?.data || prodRes.value || [];
            if (Array.isArray(list) && list.length > 0) {
              setProducts(list);
            } else {
              const fallbackRes = await productApi.getAll({ limit: 8 }).catch(() => null);
              const fbList = fallbackRes?.data || fallbackRes || [];
              setProducts(Array.isArray(fbList) ? fbList : []);
            }
          }
          if (catRes.status === "fulfilled") {
            const cats = catRes.value?.data || catRes.value || [];
            setCategories(Array.isArray(cats) ? cats : []);
          }
        }
      } catch (err) {
        console.error("Products fetch error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchData();
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

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[rgba(244,240,232,0.1)] mb-8">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            DANH MỤC THIẾT KẾ
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            {searchQuery ? `KẾT QUẢ TÌM KIẾM: "${searchQuery}"` : "TẤT CẢ THIẾT KẾ"}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden min-h-[40px] px-3.5 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs font-display tracking-wider uppercase text-[#f4f0e8] flex items-center gap-2"
          >
            <Filter size={14} />
            <span>Bộ Lọc</span>
          </button>

          <select
            value={selectedSort}
            onChange={handleSortChange}
            className="min-h-[40px] px-3 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs font-display tracking-wider uppercase text-[#f4f0e8] focus:border-[#e65100]"
          >
            <option value="newest">Mới Nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="rating">Đánh Giá Cao</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside
          className={`lg:col-span-1 ${
            isFilterOpen ? "block" : "hidden lg:block"
          } space-y-8 bg-[#121215] p-6 border border-[rgba(244,240,232,0.1)] h-fit`}
        >
          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[#e65100]" />
              <span>Phân Loại Danh Mục</span>
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCategorySelect("")}
                className={`w-full text-left px-3 py-2 text-xs font-medium tracking-wide transition-colors ${
                  !selectedCategory ? "bg-[#e65100] text-white font-bold" : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                }`}
              >
                Tất Cả Danh Mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat._id)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium tracking-wide transition-colors ${
                    selectedCategory === cat._id ? "bg-[#e65100] text-white font-bold" : "text-[#9a989f] hover:text-[#f4f0e8] hover:bg-white/5"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] mb-4 pb-2 border-b border-white/10">
              Cam Kết Chất Lượng
            </h3>
            <p className="text-xs text-[#9a989f] leading-relaxed">
              Mọi sản phẩm của Atelier đều được may đo trực tiếp tại xưởng với chính sách đổi trả miễn phí trong vòng 7 ngày.
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
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
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
                }}
              >
                Xóa Bộ Lọc
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
