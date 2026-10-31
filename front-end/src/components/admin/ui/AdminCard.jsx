import React from "react";

export function AdminCard({
  children,
  title,
  subtitle,
  extra,
  footer,
  className = "",
  bodyClassName = "",
  noPadding = false,
}) {
  return (
    <section
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors ${className}`}
    >
      {(title || extra) && (
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="font-serif text-lg font-medium tracking-tight text-[var(--color-text)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div className="flex items-center gap-2">{extra}</div>}
        </div>
      )}

      <div className={`${noPadding ? "" : "p-5"} ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 px-5 py-3">
          {footer}
        </div>
      )}
    </section>
  );
}

export default AdminCard;
