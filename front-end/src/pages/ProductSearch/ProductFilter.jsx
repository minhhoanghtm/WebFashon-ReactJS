import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X, RotateCcw, Check } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { getColorHex } from "./productAdapter";

const ProductFilter = ({
  options,
  priceBounds,
  filters,
  onChange,
  onClear,
  totalResultsCount = 0,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Khóa scroll khi mở mobile drawer
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const toggleValue = (filterKey, value) => {
    const currentValues = filters[filterKey] || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    onChange({ ...filters, [filterKey]: nextValues });
  };

  const effectiveMinPrice = filters.minPrice ?? priceBounds.min;
  const effectiveMaxPrice = filters.maxPrice ?? priceBounds.max;

  // Đếm tổng số tiêu chí đang active
  const activeCount =
    (filters.categories?.length || 0) +
    (filters.sizes?.length || 0) +
    (filters.colors?.length || 0) +
    (filters.minPrice !== null && filters.minPrice > priceBounds.min ? 1 : 0) +
    (filters.maxPrice !== null && filters.maxPrice < priceBounds.max ? 1 : 0);

  const filterBody = (
    <div className="product-filter-body flex flex-col gap-6">
      {/* 1. Danh mục */}
      {options.categories && options.categories.length > 0 && (
        <fieldset className="product-filter-group border-b border-black/[0.06] pb-5">
          <legend className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase mb-3 flex items-center justify-between w-full">
            <span>Danh mục</span>
            {filters.categories.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-800 lowercase">
                ({filters.categories.length} đã chọn)
              </span>
            )}
          </legend>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {options.categories.map((cat) => {
              const isChecked = filters.categories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-amber-50/80 text-amber-900 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleValue("categories", cat)}
                      className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-0 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-[13px] leading-tight select-none">{cat}</span>
                  </div>
                  {isChecked && <Check size={14} className="text-amber-800 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 2. Kích thước (Size Box Pills) */}
      {options.sizes && options.sizes.length > 0 && (
        <fieldset className="product-filter-group border-b border-black/[0.06] pb-5">
          <legend className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase mb-3 flex items-center justify-between w-full">
            <span>Kích thước</span>
            {filters.sizes.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-800 lowercase">
                ({filters.sizes.length})
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {options.sizes.map((size) => {
              const isChecked = filters.sizes.includes(size);
              return (
                <button
                  type="button"
                  key={size}
                  onClick={() => toggleValue("sizes", size)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                      : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 3. Màu sắc (Color Swatches) */}
      {options.colors && options.colors.length > 0 && (
        <fieldset className="product-filter-group border-b border-black/[0.06] pb-5">
          <legend className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase mb-3 flex items-center justify-between w-full">
            <span>Màu sắc</span>
            {filters.colors.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-800 lowercase">
                ({filters.colors.length})
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.colors.map((color) => {
              const isChecked = filters.colors.includes(color);
              const hex = getColorHex(color);
              const isLightColor = ["#ffffff", "#f5ebe1", "#e5d9c5", "#e2e8f0"].includes(
                hex.toLowerCase(),
              );

              return (
                <button
                  type="button"
                  key={color}
                  title={color}
                  onClick={() => toggleValue("colors", color)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                    isChecked
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${
                      isLightColor ? "border-neutral-300" : "border-black/10"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate max-w-[85px] capitalize text-[12px]">{color}</span>
                  {isChecked && <Check size={12} className="ml-0.5 text-white" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 4. Khoảng giá (Price Bounds) */}
      {priceBounds.max > priceBounds.min && (
        <fieldset className="product-filter-group pb-2">
          <legend className="text-[13px] font-bold text-neutral-900 tracking-wide uppercase mb-3">
            Khoảng giá
          </legend>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-neutral-700 bg-neutral-100/80 px-3 py-2 rounded-lg border border-neutral-200/60">
              <span>{formatCurrency(effectiveMinPrice)}</span>
              <span className="text-neutral-400">—</span>
              <span>{formatCurrency(effectiveMaxPrice)}</span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex flex-col gap-1 text-[11px] text-neutral-500 font-medium">
                <div className="flex justify-between">
                  <span>Giá từ</span>
                  <strong className="text-neutral-800 font-bold tabular-nums">
                    {formatCurrency(effectiveMinPrice)}
                  </strong>
                </div>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={effectiveMinPrice}
                  onChange={(event) =>
                    onChange({
                      ...filters,
                      minPrice: Math.min(Number(event.target.value), effectiveMaxPrice),
                    })
                  }
                  className="w-full accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] text-neutral-500 font-medium">
                <div className="flex justify-between">
                  <span>Đến</span>
                  <strong className="text-neutral-800 font-bold tabular-nums">
                    {formatCurrency(effectiveMaxPrice)}
                  </strong>
                </div>
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={effectiveMaxPrice}
                  onChange={(event) =>
                    onChange({
                      ...filters,
                      maxPrice: Math.max(Number(event.target.value), effectiveMinPrice),
                    })
                  }
                  className="w-full accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                />
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {/* Nút Xóa bộ lọc */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 font-semibold text-xs transition duration-200 cursor-pointer mt-1"
        >
          <RotateCcw size={14} />
          Xóa tất cả bộ lọc ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Trigger Button */}
      <div className="lg:hidden w-full mb-4">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-neutral-200 rounded-xl shadow-xs text-neutral-900 font-bold text-sm cursor-pointer hover:border-neutral-400 transition"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-amber-800" />
            <span>Bộ lọc sản phẩm</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] flex items-center justify-center font-extrabold">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-neutral-500 font-normal">Tùy chỉnh & sắp xếp</span>
        </button>
      </div>

      {/* Desktop Sidebar (hiển thị trên màn hình lớn) */}
      <aside className="hidden lg:block w-[260px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
              <SlidersHorizontal size={18} className="text-amber-800" />
              <span>Bộ lọc</span>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                Xóa tất cả ({activeCount})
              </button>
            )}
          </div>
          {filterBody}
        </div>
      </aside>

      {/* Mobile Slide-over Drawer (hiển thị khi isMobileOpen trên mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-in fade-in duration-200">
          {/* Backdrop mờ */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-base">
                <SlidersHorizontal size={18} className="text-amber-800" />
                <span>Bộ lọc ({activeCount})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
                aria-label="Đóng bộ lọc"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
              {filterBody}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClear();
                }}
                className="flex-1 py-3 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-bold text-xs hover:bg-neutral-100 transition cursor-pointer"
              >
                Xóa bộ lọc
              </button>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex-[2] py-3 px-4 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 shadow-md transition cursor-pointer"
              >
                Áp dụng {totalResultsCount > 0 ? `(${totalResultsCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilter;
