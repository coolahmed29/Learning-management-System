/**
 * Generic loading placeholder (shimmer block) — skeleton grids, dashboard stat placeholders.
 */
import clsx from "clsx";
import { useTheme } from "../../../providers/ThemeProvider";

const VARIANT_CLASSES = {
  text: "rounded-card",
  rectangular: "rounded-card",
  circular: "rounded-full",
};

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className,
}) {
  const { prefersReducedMotion } = useTheme();

  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        "bg-pebble",
        VARIANT_CLASSES[variant],
        !prefersReducedMotion && "animate-pulse",
        className
      )}
      style={{ width, height }}
    />
  );
}
