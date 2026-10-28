import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductPagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 mb-4" aria-label="Phân trang sản phẩm">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>

      {visiblePages.map((page, index) => {
        const previousPage = visiblePages[index - 1];
        const hasGap = previousPage && page - previousPage > 1;

        return (
          <span className="flex items-center gap-1.5 sm:gap-2" key={page}>
            {hasGap && <span className="px-1 text-neutral-400 text-xs">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-xl font-bold text-xs transition cursor-pointer tabular-nums flex items-center justify-center ${
                page === currentPage
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default ProductPagination;
