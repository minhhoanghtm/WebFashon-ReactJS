import React from "react";
import { PackageSearch, RotateCcw } from "lucide-react";

const EmptyState = ({ type, onClear, gridDensity = "compact" }) => {
  if (type === "loading") {
    const skeletonClass =
      gridDensity === "spacious"
        ? "grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 w-full"
        : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full";

    return (
      <div className={skeletonClass} role="status" aria-label="Đang tải danh sách thiết kế">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col bg-white border border-[#E8E5DF] rounded-2xl overflow-hidden p-3"
          >
            {/* Image Placeholder with Shimmer */}
            <div className="w-full aspect-[3/4] rounded-xl skeleton-shimmer mb-3" />

            {/* Typography Placeholders */}
            <div className="w-1/3 h-3 rounded skeleton-shimmer mb-2" />
            <div className="w-3/4 h-4 rounded skeleton-shimmer mb-2" />
            <div className="w-1/2 h-4 rounded skeleton-shimmer mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] bg-white rounded-2xl border border-[#E8E5DF] p-8 sm:p-14 text-center shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-[#05251C]/5 border border-[#05251C]/15 flex items-center justify-center text-[#05251C] mb-5 shadow-2xs">
        <PackageSearch size={28} aria-hidden="true" />
      </div>
      <span className="text-[11px] font-mono tracking-widest text-[#6B716E] uppercase mb-1">
        NO PIECES FOUND
      </span>
      <h2 className="text-xl sm:text-2xl font-black text-[#05251C] tracking-tight mb-2 font-display uppercase">
        Không tìm thấy sản phẩm phù hợp
      </h2>
      <p className="text-sm text-[#6B716E] max-w-md mb-6 leading-relaxed">
        Không có thiết kế nào khớp với các tiêu chí lọc hoặc từ khóa hiện tại. Hãy thử tìm kiếm bằng từ khóa khác hoặc làm mới bộ lọc.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#05251C] text-white font-bold text-xs tracking-wider uppercase hover:bg-[#073D2A] hover:text-[#F5DD20] transition duration-200 cursor-pointer shadow-sm active:scale-95"
        >
          <RotateCcw size={13} />
          <span>XÓA BỘ LỌC ĐỂ XEM TẤT CẢ</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
