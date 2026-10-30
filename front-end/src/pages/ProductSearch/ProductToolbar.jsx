import React from "react";
import { ChevronDown, X, RotateCcw, LayoutGrid, Grid3X3, Sparkles, Search } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const ProductToolbar = ({
  count = 0,
  searchTerm = "",
  onSearchChange,
  sortBy = "default",
  onSortChange,
  isUsingFallback = false,
  hasApiError = false,
  filters = {},
  priceBounds = { min: 0, max: 0 },
  onRemoveFilter,
  onClearAll,
  gridDensity = "compact",
  onDensityChange,
  isSemantic = true,
  onSemanticChange,
}) => {
  // Build active filter chips
  const activeChips = [];

  if (searchTerm && searchTerm.trim()) {
    activeChips.push({
      id: "search",
      label: `Từ khóa: "${searchTerm.trim()}"`,
      onRemove: () => onSearchChange?.(""),
    });
  }

  (filters.categories || []).forEach((cat) => {
    activeChips.push({
      id: `cat-${cat}`,
      label: cat,
      onRemove: () => onRemoveFilter?.("categories", cat),
    });
  });

  (filters.sizes || []).forEach((size) => {
    activeChips.push({
      id: `size-${size}`,
      label: `Size: ${size}`,
      onRemove: () => onRemoveFilter?.("sizes", size),
    });
  });

  (filters.colors || []).forEach((color) => {
    activeChips.push({
      id: `color-${color}`,
      label: `Màu: ${color}`,
      onRemove: () => onRemoveFilter?.("colors", color),
    });
  });

  const isMinPriceSet =
    filters.minPrice !== null &&
    filters.minPrice !== undefined &&
    filters.minPrice > priceBounds.min;
  const isMaxPriceSet =
    filters.maxPrice !== null &&
    filters.maxPrice !== undefined &&
    filters.maxPrice < priceBounds.max;

  if (isMinPriceSet || isMaxPriceSet) {
    const minStr = isMinPriceSet ? formatCurrency(filters.minPrice) : "0đ";
    const maxStr = isMaxPriceSet ? formatCurrency(filters.maxPrice) : "Max";
    activeChips.push({
      id: "price-range",
      label: `Giá: ${minStr} - ${maxStr}`,
      onRemove: () => onRemoveFilter?.("price"),
    });
  }

  return (
    <div className="product-toolbar flex flex-col gap-3 pb-5 mb-6 border-b border-[#E8E5DF]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Count & Status */}
        <div className="flex items-center flex-wrap gap-2 text-xs uppercase tracking-wider text-[#77736E]">
          <span>HIỂN THỊ</span>
          <span className="font-extrabold text-[#171717] tabular-nums text-sm">
            {count}
          </span>
          <span>THIẾT KẾ</span>
          {isUsingFallback && (
            <span className="text-[10px] bg-[#05251C]/5 text-[#05251C] border border-[#05251C]/15 font-bold px-2 py-0.5 rounded-full">
              {hasApiError ? "GỢI Ý THỊNH HÀNH" : "BỘ SƯU TẬP"}
            </span>
          )}
        </div>

        {/* Right Controls: AI Semantic Search Input + Density Switcher + Sort */}
        <div className="flex items-center flex-wrap gap-3 self-end sm:self-auto">
          {onSearchChange && (
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-[#77736E] pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm theo ngữ nghĩa (VD: áo đi biển dưới 500k)..."
                className="bg-white border border-[#E8E5DF] focus:border-[#05251C] text-xs text-[#171717] rounded-lg pl-8 pr-3 py-1.5 w-56 sm:w-64 outline-none transition-colors shadow-2xs"
              />
            </div>
          )}

          {onSemanticChange && (
            <button
              type="button"
              onClick={() => onSemanticChange(!isSemantic)}
              title="Bật/tắt Tìm kiếm ngữ nghĩa Vector AI (Semantic Search)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                isSemantic
                  ? "bg-[#05251C] text-white border-[#05251C]"
                  : "bg-white text-[#77736E] border-[#E8E5DF] hover:text-[#171717]"
              }`}
            >
              <Sparkles size={12} />
              <span>AI Semantic</span>
            </button>
          )}

          {/* Grid Density Toggle (Hidden on small mobile) */}
          {onDensityChange && (
            <div className="hidden md:flex items-center bg-white border border-[#E8E5DF] rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => onDensityChange("spacious")}
                title="Chế độ xem lớn (3 cột)"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  gridDensity === "spacious"
                    ? "bg-[#171717] text-white shadow-2xs"
                    : "text-[#77736E] hover:text-[#171717]"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDensityChange("compact")}
                title="Chế độ xem gọn (4 cột)"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  gridDensity === "compact"
                    ? "bg-[#171717] text-white shadow-2xs"
                    : "text-[#77736E] hover:text-[#171717]"
                }`}
              >
                <Grid3X3 size={15} />
              </button>
            </div>
          )}

          {/* Minimalist Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#77736E] whitespace-nowrap hidden sm:inline">
              Sắp xếp:
            </span>
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none bg-white border border-[#E8E5DF] hover:border-[#171717]/50 focus:border-[#171717] focus:ring-0 text-xs font-semibold text-[#171717] rounded-lg pl-3 pr-7 py-2 cursor-pointer shadow-2xs transition-colors"
              >
                <option value="default">Mặc định</option>
                <option value="popular">Phổ biến nhất</option>
                <option value="newest">Hàng mới về</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="name_asc">Tên: A đến Z</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#77736E] pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-[10px] font-bold text-[#77736E] uppercase tracking-wider mr-1">
            Đang lọc:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E8E5DF] text-[#171717] text-xs font-medium pl-2.5 pr-1 py-1 rounded-full shadow-2xs transition-colors"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#171717] hover:text-white text-[#77736E] transition cursor-pointer"
                title="Xóa tiêu chí"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {activeChips.length >= 2 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#05251C] hover:underline ml-1 py-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductToolbar;
