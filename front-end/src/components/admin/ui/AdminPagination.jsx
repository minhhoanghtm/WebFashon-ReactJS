import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5 sm:flex-row">
      <div className="text-xs text-[var(--color-text-muted)]">
        Hiển thị{" "}
        <span className="font-semibold text-[var(--color-text)]">
          {startItem}
        </span>
        –
        <span className="font-semibold text-[var(--color-text)]">
          {endItem}
        </span>{" "}
        trên tổng{" "}
        <span className="font-semibold text-[var(--color-text)]">
          {totalItems}
        </span>{" "}
        mục
      </div>

      <nav
        aria-label="Phân trang bảng dữ liệu"
        className="flex items-center gap-1.5"
      >
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          className="touch-target inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPages().map((page) => {
          const active = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={active ? "page" : undefined}
              className={`touch-target inline-flex items-center justify-center border px-3.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-text)]"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang tiếp theo"
          className="touch-target inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}

export default AdminPagination;
