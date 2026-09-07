/**
 * Generic accessible modal/dialog — confirmations, certificate viewer, overlays.
 * Centralizes focus-trap, backdrop, escape-key handling, and entry/exit animation.
 */
import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useTheme } from "../../../providers/ThemeProvider";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
}) {
  const { prefersReducedMotion } = useTheme();
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    document.body.classList.add("overflow-hidden");

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const panel = panelRef.current;

    function getFocusable() {
      if (!panel) return [];
      return Array.from(panel.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled")
      );
    }

    const initialFocus = getFocusable()[0];
    if (initialFocus) initialFocus.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (closeOnEscape) onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-onyx/40"
            onClick={closeOnBackdropClick ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={clsx(
              "relative w-full rounded-card border border-mist/50 bg-white p-card-padding shadow-none",
              SIZE_CLASSES[size],
              className
            )}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {title && (
              <div className="mb-4 flex items-start justify-between">
                <h2 id={titleId} className="text-heading-sm font-semibold text-carbon">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-card px-2 py-1 text-body-lg text-ash hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
                >
                  &times;
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
