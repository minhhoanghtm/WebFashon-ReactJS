import React from 'react';
import { PackageOpen } from 'lucide-react';

/**
 * Standard Empty State component for Admin Tables and Lists
 */
export const AdminEmptyState = ({
  icon,
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào hoặc không tìm thấy kết quả phù hợp với bộ lọc.',
  action,
  className = '',
}) => {
  const EmptyIcon = icon || PackageOpen;
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4 border border-slate-200/60 dark:border-slate-700/60">
        <EmptyIcon className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default AdminEmptyState;
