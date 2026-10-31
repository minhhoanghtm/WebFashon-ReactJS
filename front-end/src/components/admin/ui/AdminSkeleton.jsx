import React from "react";

const SKELETON_WIDTHS = ["62%", "78%", "54%", "84%", "68%", "72%", "58%"];

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div
      className="w-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]"
      aria-busy="true"
      aria-label="Đang tải bảng dữ liệu"
    >
      <div className="flex gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <div
            key={idx}
            className="h-3 flex-1 animate-pulse bg-[var(--color-border)]"
          />
        ))}
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, colIdx) => {
              const width =
                SKELETON_WIDTHS[(rowIdx * cols + colIdx) % SKELETON_WIDTHS.length];
              return (
                <div key={colIdx} className="flex-1">
                  <div
                    className="h-3.5 animate-pulse bg-[var(--color-border)]"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPISkeleton({ count = 4 }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Đang tải chỉ số thống kê"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="flex-1 space-y-2.5">
            <div className="h-3 w-24 animate-pulse bg-[var(--color-border)]" />
            <div className="h-7 w-32 animate-pulse bg-[var(--color-border)]" />
            <div className="h-2.5 w-20 animate-pulse bg-[var(--color-border)]" />
          </div>
          <div className="h-11 w-11 shrink-0 animate-pulse bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 1 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse space-y-4"
        >
          <div className="h-4 w-32 bg-[var(--color-border)]" />
          <div className="h-10 w-full bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}
