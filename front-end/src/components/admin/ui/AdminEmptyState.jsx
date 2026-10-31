import React from "react";
import { Inbox } from "lucide-react";

export function AdminEmptyState({
  icon: Icon = Inbox,
  title = "Không có dữ liệu",
  description = "Chưa có bản ghi nào phù hợp với điều kiện lọc hiện tại.",
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h4 className="font-serif text-lg font-medium text-[var(--color-text)]">
        {title}
      </h4>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default AdminEmptyState;
