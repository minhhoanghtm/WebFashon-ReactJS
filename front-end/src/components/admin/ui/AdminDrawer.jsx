import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/**
 * Helper to lock background scrolling while compensating for scrollbar width
 * to avoid layout shifts / content jumping when the drawer opens and closes.
 */
function useScrollLock(isOpen) {
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
}

const DRAWER_WIDTH_MAP = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-[560px]",
  xl: "sm:max-w-2xl",
  "max-w-[560px]": "sm:max-w-[560px]",
  journey: "w-full sm:w-[520px] md:w-[65vw] lg:w-[540px] lg:max-w-[45vw] xl:w-[560px]",
  full: "sm:max-w-full",
};

/**
 * Standard Admin Drawer Component (Portal to document.body)
 * - Renders at document.body level via React Portal to avoid ancestor transform/overflow clipping.
 * - Backdrop: position fixed, inset: 0, z-index 60 (covers entire viewport, AdminHeader & Sidebar).
 * - Drawer Panel: position fixed, top 0, right 0, bottom 0, height 100dvh, width min(560px, 100vw) on desktop, 100vw on mobile.
 * - Slide-in from right (translateX 100% -> 0) with Motion / AnimatePresence.
 * - WCAG 2.2 AA compliant: Focus trap, Esc to close, touch target >= 44px, aria-modal, aria-labelledby.
 * - Independent of page scroll position.
 */
export function AdminDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-[560px]",
  closeOnOverlay = true,
  titleId = "admin-drawer-title",
  actions = null,
}) {
  const mounted = typeof document !== "undefined";
  const prefersReduced = usePrefersReducedMotion();
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerElementRef = useRef(null);
  const maxWidthClass = DRAWER_WIDTH_MAP[width] || "sm:max-w-[560px]";

  useScrollLock(isOpen);

  // Focus management & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on close
    triggerElementRef.current = document.activeElement;

    // Initial focus on close button or first focusable
    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector(
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

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll(
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
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !drawerRef.current.contains(document.activeElement)
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* 1. Backdrop Overlay (Fixed inset-0, covers entire screen including Header and Sidebar) */}
          <motion.div
            data-testid="admin-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReduced ? 0 : 0.25,
              ease: "easeOut",
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => closeOnOverlay && onClose?.()}
            aria-hidden="true"
          />

          {/* 2. Slide-over Drawer Container */}
          <motion.div
            ref={drawerRef}
            data-testid="admin-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              duration: prefersReduced ? 0 : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`fixed top-0 right-0 bottom-0 z-[61] h-[100dvh] w-full ${maxWidthClass} flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] border-l border-[var(--color-border)] shadow-2xl overscroll-contain pb-safe motion-reduce:transition-none`}
          >
        {/* Drawer Header (Fixed/Sticky at top of drawer) */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6 py-4">
          <div className="min-w-0 pr-3">
            {typeof title === "string" ? (
              <h2
                id={titleId}
                className="font-sans text-base sm:text-lg font-semibold tracking-tight text-[var(--color-text)] truncate"
              >
                {title}
              </h2>
            ) : (
              <div id={titleId}>{title}</div>
            )}
            {subtitle && (
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">
                {subtitle}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              ref={closeButtonRef}
              type="button"
              data-testid="admin-drawer-close-btn"
              onClick={onClose}
              aria-label="Đóng ngăn kéo"
              className="touch-target inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Scrollable inside drawer only) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 text-left">
          {children}
        </div>

        {/* Optional Drawer Footer (Fixed at bottom of drawer) */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6 py-3.5">
            {footer}
          </div>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default AdminDrawer;
