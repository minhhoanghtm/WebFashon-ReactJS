import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X, RotateCcw, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    sizes: true,
    colors: true,
    price: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Lock scroll when mobile drawer is open
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

  const minPercent = priceBounds.max > priceBounds.min
    ? Math.max(0, Math.min(100, ((effectiveMinPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100))
    : 0;
  const maxPercent = priceBounds.max > priceBounds.min
    ? Math.max(0, Math.min(100, ((effectiveMaxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100))
    : 100;

  const activeCount =
    (filters.categories?.length || 0) +
    (filters.sizes?.length || 0) +
    (filters.colors?.length || 0) +
    (filters.minPrice !== null && filters.minPrice > priceBounds.min ? 1 : 0) +
    (filters.maxPrice !== null && filters.maxPrice < priceBounds.max ? 1 : 0);

  const filterBody = (
    <div className="product-filter-body flex flex-col gap-5 text-sm">
      {/* 1. DANH MỤC (CATEGORIES) */}
      {options.categories && options.categories.length > 0 && (
        <div className="border-b border-[#E8E5DF] pb-4">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full py-1 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">
                Danh mục
              </span>
              {filters.categories.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#05251C]/10 text-[#05251C] text-[10px] font-bold">
                  {filters.categories.length}
                </span>
              )}
            </div>
            <ChevronDown
              size={15}
              className={`text-[#77736E] transition-transform duration-300 ${
                expandedSections.categories ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.categories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 pt-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {options.categories.map((cat) => {
                    const isChecked = filters.categories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? "bg-[#171717] text-white font-medium"
                            : "text-[#171717]/80 hover:bg-[#F3EFEA]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleValue("categories", cat)}
                            className="sr-only"
                          />
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              isChecked
                                ? "bg-[#05251C] border-[#05251C] text-[#F5DD20]"
                                : "border-[#D1CCC4] bg-white group-hover:border-[#171717]"
                            }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <span className="select-none tracking-tight">{cat}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. KÍCH THƯỚC (SIZES) */}
      {options.sizes && options.sizes.length > 0 && (
        <div className="border-b border-[#E8E5DF] pb-4">
          <button
            type="button"
            onClick={() => toggleSection("sizes")}
            className="flex items-center justify-between w-full py-1 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">
                Kích cỡ
              </span>
              {filters.sizes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#05251C]/10 text-[#05251C] text-[10px] font-bold">
                  {filters.sizes.length}
                </span>
              )}
            </div>
            <ChevronDown
              size={15}
              className={`text-[#77736E] transition-transform duration-300 ${
                expandedSections.sizes ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.sizes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {options.sizes.map((size) => {
                    const isChecked = filters.sizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleValue("sizes", size)}
                        className={`min-w-[36px] h-8 px-2.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-[#171717] text-white border-[#171717] shadow-xs"
                            : "bg-white text-[#171717] border-[#E8E5DF] hover:border-[#171717]/60 hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. MÀU SẮC (COLORS) */}
      {options.colors && options.colors.length > 0 && (
        <div className="border-b border-[#E8E5DF] pb-4">
          <button
            type="button"
            onClick={() => toggleSection("colors")}
            className="flex items-center justify-between w-full py-1 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">
                Màu sắc
              </span>
              {filters.colors.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#05251C]/10 text-[#05251C] text-[10px] font-bold">
                  {filters.colors.length}
                </span>
              )}
            </div>
            <ChevronDown
              size={15}
              className={`text-[#77736E] transition-transform duration-300 ${
                expandedSections.colors ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.colors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-1.5 pt-3">
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
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isChecked
                            ? "border-[#171717] bg-[#171717] text-white shadow-xs"
                            : "border-[#E8E5DF] bg-white text-[#171717] hover:border-[#171717]/40 hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${
                            isLightColor ? "border-neutral-300" : "border-black/20"
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                        <span className="truncate capitalize text-[11px]">{color}</span>
                        {isChecked && <Check size={11} className="ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. KHOẢNG GIÁ (PRICE RANGE) */}
      {priceBounds.max > priceBounds.min && (
        <div className="pb-1">
          <button
            type="button"
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full py-1 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#171717] uppercase tracking-wider">
                Khoảng giá
              </span>
              {(filters.minPrice !== null || filters.maxPrice !== null) && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#05251C]/10 text-[#05251C] text-[10px] font-bold">
                  Active
                </span>
              )}
            </div>
            <ChevronDown
              size={15}
              className={`text-[#77736E] transition-transform duration-300 ${
                expandedSections.price ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-[#171717] bg-[#F4F1EA] px-3 py-2 rounded-lg border border-[#E8E5DF]">
                    <span>{formatCurrency(effectiveMinPrice)}</span>
                    <span className="text-[#77736E]">—</span>
                    <span>{formatCurrency(effectiveMaxPrice)}</span>
                  </div>

                  {/* Dual Range Track */}
                  <div className="range-slider-container my-1 px-1">
                    <div className="range-slider-track" />
                    <div
                      className="range-slider-highlight"
                      style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(0, maxPercent - minPercent)}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceBounds.step}
                      value={effectiveMinPrice}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), effectiveMaxPrice);
                        onChange({ ...filters, minPrice: val });
                      }}
                      className="range-slider-input"
                    />
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceBounds.step}
                      value={effectiveMaxPrice}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), effectiveMinPrice);
                        onChange({ ...filters, maxPrice: val });
                      }}
                      className="range-slider-input"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Clear all active filters */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[#E8E5DF] text-[#171717] hover:bg-[#F3EFEA] font-semibold text-xs transition duration-200 cursor-pointer mt-1"
        >
          <RotateCcw size={13} className="text-[#05251C]" />
          <span>Xóa tất cả bộ lọc ({activeCount})</span>
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
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E8E5DF] rounded-xl shadow-xs text-[#171717] font-bold text-sm cursor-pointer hover:border-[#171717] transition"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={17} className="text-[#05251C]" />
            <span className="tracking-tight">BỘ LỌC TÌM KIẾM</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#05251C] text-[#F5DD20] text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-[#77736E] font-medium">Tùy chỉnh</span>
        </button>
      </div>

      {/* Desktop Fashion Control Panel Sidebar */}
      <aside className="hidden lg:block w-[270px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-[#E8E5DF] p-5 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E8E5DF]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#05251C]" />
              <span className="font-extrabold text-[13px] tracking-wider uppercase text-[#05251C]">
                CONTROL PANEL
              </span>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-[#05251C] hover:underline font-bold cursor-pointer"
              >
                Đặt lại ({activeCount})
              </button>
            )}
          </div>
          {filterBody}
        </div>
      </aside>

      {/* Mobile Slide-over Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E5DF]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={17} className="text-[#05251C]" />
                  <span className="font-bold text-[#05251C] text-sm uppercase tracking-wider">
                    BỘ LỌC ({activeCount})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#77736E] hover:bg-[#F3EFEA] hover:text-[#171717] transition cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                {filterBody}
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-[#E8E5DF] bg-[#FAF8F5] flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClear}
                  className="flex-1 py-3 px-3 rounded-xl border border-[#E8E5DF] bg-white text-[#171717] font-bold text-xs hover:bg-[#F3EFEA] transition cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex-[2] py-3 px-4 rounded-xl bg-[#171717] text-white font-bold text-xs hover:bg-neutral-800 shadow-md transition cursor-pointer"
                >
                  Xem {totalResultsCount > 0 ? `${totalResultsCount} sản phẩm` : "kết quả"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductFilter;
