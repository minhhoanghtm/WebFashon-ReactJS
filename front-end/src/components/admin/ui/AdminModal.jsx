import React, { useEffect } from "react";
import { X } from "lucide-react";

const maxWidthMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
  full: "max-w-[95vw]",
};

export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  closeOnOverlay = true,
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Hộp thoại quản trị"}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={() => closeOnOverlay && onClose?.()}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className={`relative z-10 flex max-h-[90vh] w-full ${
          maxWidthMap[size] || maxWidthMap.lg
        } flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            {title && (
              <h3 className="font-serif text-xl font-normal tracking-tight text-[var(--color-text)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="touch-target inline-flex items-center justify-center border border-transparent text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-left">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminModal;
