import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const maxWidthMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
  full: "max-w-[95vw]",
};

/**
 * Standard Admin Modal Component (Portal to document.body)
 * - Renders at document.body level via React Portal to avoid ancestor transform/overflow clipping.
 * - Backdrop: position fixed, inset: 0, z-index 60 (covers entire viewport, AdminHeader & Sidebar).
 * - Scroll lock with padding compensation to avoid layout shift.
 * - WCAG 2.2 AA compliant: Focus trap, Esc to close, touch target >= 44px, aria-modal, aria-labelledby.
 */
export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  closeOnOverlay = true,
  titleId = "admin-modal-title",
}) {
  const mounted = typeof document !== "undefined";
  const modalPanelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerElementRef = useRef(null);

  // Scroll lock with scrollbar width compensation
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow || "";
      document.body.style.paddingRight = originalPaddingRight || "";
    };
  }, [isOpen]);

  // Focus management & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    triggerElementRef.current = document.activeElement;

    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (modalPanelRef.current) {
        const firstFocusable = modalPanelRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === "Tab" && modalPanelRef.current) {
        const focusables = Array.from(
          modalPanelRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !modalPanelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !modalPanelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (
        triggerElementRef.current &&
        typeof triggerElementRef.current.focus === "function"
      ) {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        data-testid="admin-modal-overlay"
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => closeOnOverlay && onClose?.()}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={modalPanelRef}
        data-testid="admin-modal"
        className={`relative z-10 flex max-h-[90vh] w-full ${
          maxWidthMap[size] || maxWidthMap.lg
        } flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            {title && (
              <h3
                id={titleId}
                className="font-sans text-xl font-normal tracking-tight text-[var(--color-text)]"
              >
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
            ref={closeButtonRef}
            type="button"
            data-testid="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="touch-target inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-transparent text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 text-left">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default AdminModal;
