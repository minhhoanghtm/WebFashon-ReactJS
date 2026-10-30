import { LoaderCircle, PackageSearch, RotateCcw } from "lucide-react";

const EmptyState = ({ type, onClear }) => {
  if (type === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] bg-white rounded-2xl border border-neutral-200/80 p-8 text-neutral-500 shadow-xs" role="status">
        <LoaderCircle
          className="animate-spin text-amber-800 mb-3"
          size={32}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-neutral-700">Đang tải sản phẩm thời trang...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 text-center shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800 mb-4 border border-amber-100">
        <PackageSearch size={32} aria-hidden="true" />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1.5">
        Không tìm thấy sản phẩm phù hợp
      </h2>
      <p className="text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
        Rất tiếc, không có sản phẩm nào khớp với bộ lọc hoặc từ khóa hiện tại. Hãy thử từ khóa khác hoặc xóa bớt tiêu chí lọc.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 shadow-xs transition cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Xóa tất cả bộ lọc</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
