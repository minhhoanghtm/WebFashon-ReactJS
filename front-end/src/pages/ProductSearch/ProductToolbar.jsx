import React from "react";
import { ChevronDown, X, RotateCcw } from "lucide-react";
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
}) => {
  // Tạo danh sách các Active Filter Chips
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
      onRemove: () =>
        onRemoveFilter?.("categories", cat),
    });
  });

  (filters.sizes || []).forEach((size) => {
    activeChips.push({
      id: `size-${size}`,
      label: `Size: ${size}`,
      onRemove: () =>
        onRemoveFilter?.("sizes", size),
    });
  });

  (filters.colors || []).forEach((color) => {
    activeChips.push({
      id: `color-${color}`,
      label: `Màu: ${color}`,
      onRemove: () =>
        onRemoveFilter?.("colors", color),
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
      onRemove: () =>
        onRemoveFilter?.("price"),
    });
  }

  return (
    <div className="product-toolbar flex flex-col gap-3 pb-5 mb-6 border-b border-neutral-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Số lượng sản phẩm */}
        <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-600">
          <span>
            Tìm thấy{" "}
            <strong className="text-neutral-950 font-bold text-base tabular-nums">
              {count}
            </strong>{" "}
            sản phẩm
          </span>
          {isUsingFallback && (
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold px-2.5 py-0.5 rounded-full">
              {hasApiError ? "Gợi ý thịnh hành" : "Bộ sưu tập gợi ý"}
            </span>
          )}
        </div>

        {/* Bộ chọn Sắp xếp */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-medium text-neutral-500 whitespace-nowrap hidden sm:inline">
            Sắp xếp theo:
          </span>
          <div className="relative inline-block">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-white border border-neutral-200/90 hover:border-neutral-400 focus:border-neutral-900 focus:ring-0 text-xs font-semibold text-neutral-800 rounded-xl pl-3.5 pr-8 py-2 cursor-pointer shadow-2xs transition-colors"
            >
              <option value="default">Mặc định</option>
              <option value="popular">Phổ biến nhất</option>
              <option value="newest">Hàng mới về</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="name_asc">Tên: A đến Z</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
            Đang lọc:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full transition-colors"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-neutral-300 text-neutral-600 hover:text-neutral-950 transition cursor-pointer"
                title="Xóa tiêu chí này"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {activeChips.length >= 2 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline ml-1 py-1 cursor-pointer"
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
