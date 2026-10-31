import React from "react";

export function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="atelier-eyebrow mb-1">Quản trị hệ thống · Atelier Portal</p>
        <h1 className="font-sans text-2xl font-normal tracking-tight text-[var(--color-text)] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default AdminPageHeader;
