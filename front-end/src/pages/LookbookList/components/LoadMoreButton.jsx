import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadMoreButton = ({ onClick, isLoadingMore, hasMore }) => {
  if (!hasMore) return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (isLoadingMore) return;
    onClick();
  };

  return (
    <nav className="flex justify-center items-center py-12" aria-label="Xem thêm trang">
      <button
        onClick={handleClick}
        disabled={isLoadingMore}
        className="px-10 py-3.5 border border-neutral-900 bg-transparent text-neutral-900 hover:bg-neutral-900 hover:text-white disabled:opacity-50 disabled:bg-transparent disabled:text-neutral-500 disabled:border-neutral-300 disabled:cursor-not-allowed text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer flex items-center gap-2 rounded-none"
        aria-label={isLoadingMore ? "Đang tải thêm bộ sưu tập" : "Tải thêm các bộ sưu tập tiếp theo"}
      >
        {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>{isLoadingMore ? "Đang tải..." : "Xem thêm"}</span>
      </button>
    </nav>
  );
};

export default React.memo(LoadMoreButton);
