import React from "react";
import { AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader";

const CategoryShowcase = ({
  categories = [],
  loading = false,
  error = false,
  onRetry,
  selectedCategoryId = "all",
  onSelectCategory,
}) => {
  if (!loading && !error && categories.length === 0) {
    return null; // Gracefully hide section if no categories exist
  }

  return (
    <section className="home-section home-categories" aria-labelledby="home-categories-title">
      <SectionHeader
        id="home-categories-title"
        eyebrow="Danh mục nổi bật"
        title="Khám phá danh mục"
        subtitle="Lựa chọn hoàn hảo cho phong cách thời trang của bạn"
      />

      {loading ? (
        // Pulsing skeleton loader for category cards
        <div className="flex gap-6 overflow-x-auto pb-4 pt-4 scrollbar-none">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-36 sm:w-44 h-48 sm:h-56 bg-slate-150/70 rounded-2xl animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 h-4 bg-slate-250/70 rounded-md"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state with retry action
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-rose-50/30 border border-dashed border-rose-200/40 rounded-2xl text-center mt-6">
          <AlertCircle className="h-9 w-9 text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-rose-600">Không thể tải danh mục sản phẩm</p>
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        // Horizontal Scrollable Cards
        <div className="relative group/scroll mt-6">
          <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory">
            {/* "Tất cả" (All) Category Card */}
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory("all")}
              className={`flex-shrink-0 w-36 sm:w-44 h-48 sm:h-56 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border bg-gray-900 snap-start cursor-pointer text-left focus:outline-none ${
                selectedCategoryId === "all"
                  ? "border-amber-500 ring-2 ring-amber-500/50 scale-[1.02] shadow-md"
                  : "border-gray-150/50"
              }`}
            >
              {/* Background image */}
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500"
                alt="Tất cả sản phẩm"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              />

              {/* Dark Vignette Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />

              {/* Active Badge / Indicator */}
              {selectedCategoryId === "all" && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm uppercase">
                  Đang chọn
                </span>
              )}

              {/* Content */}
              <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm select-none">
                  Tất cả
                </h3>
              </div>
            </button>

            {/* Dynmic Category Cards */}
            {categories.map((cat) => {
              const isSelected = String(cat._id) === String(selectedCategoryId);
              return (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => onSelectCategory && onSelectCategory(cat._id)}
                  className={`flex-shrink-0 w-36 sm:w-44 h-48 sm:h-56 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border bg-gray-900 snap-start cursor-pointer text-left focus:outline-none ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/50 scale-[1.02] shadow-md"
                      : "border-gray-150/50"
                  }`}
                >
                  {/* Background image */}
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500"}
                    alt={cat.name}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500";
                    }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />

                  {/* Dark Vignette Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />

                  {/* Active Badge / Indicator */}
                  {isSelected && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm uppercase">
                      Đang chọn
                    </span>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm select-none">
                      {cat.name}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryShowcase;
