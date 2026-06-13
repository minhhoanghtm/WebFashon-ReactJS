import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductPagination = ({
  currentPage,
  totalPages,
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
    <nav className="product-pagination" aria-label="Phân trang sản phẩm">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {visiblePages.map((page, index) => {
        const previousPage = visiblePages[index - 1];
        const hasGap = previousPage && page - previousPage > 1;

        return (
          <span className="product-pagination__item" key={page}>
            {hasGap && <span className="product-pagination__dots">...</span>}
            <button
              type="button"
              className={page === currentPage ? "is-active" : ""}
              onClick={() => onPageChange(page)}
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
        aria-label="Trang sau"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
};

export default ProductPagination;
