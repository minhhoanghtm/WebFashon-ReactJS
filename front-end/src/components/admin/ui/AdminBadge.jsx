import React from "react";

const variantStyles = {
  success:
    "bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]",
  warning:
    "bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-text)] border-dashed",
  danger:
    "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/40",
  info:
    "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]",
  neutral:
    "bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)]",
  brand:
    "bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px] tracking-[0.14em]",
  md: "px-2.5 py-1 text-[11px] tracking-[0.14em]",
};

export function AdminBadge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold uppercase transition-colors ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default AdminBadge;
