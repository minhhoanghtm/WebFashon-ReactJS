import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`w-full overflow-hidden animate-pulse ${className}`}>
      <div className="h-10 bg-slate-100 dark:bg-slate-800/80 rounded-t-xl mb-2" />
      <div className="space-y-2 p-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-800/60">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md flex-1"
                style={{ width: `${Math.floor(Math.random() * 30 + 50)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const KPISkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-2 w-2/3">
            <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
            <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ height = 'h-48' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 animate-pulse ${height}`}
    >
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/4 mb-4" />
      <div className="h-full bg-slate-50 dark:bg-slate-800/40 rounded-xl" />
    </div>
  );
};

export default { TableSkeleton, KPISkeleton, CardSkeleton };
