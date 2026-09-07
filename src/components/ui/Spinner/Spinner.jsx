/**
 * Generic loading indicator — buttons (isLoading), inline "working" states.
 * CSS-animated border-spin; no Framer Motion needed for this simple continuous case.
 */
import clsx from "clsx";

const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ size = "md", className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        "inline-block animate-spin rounded-full border-current border-t-transparent align-middle",
        SIZE_CLASSES[size],
        className
      )}
    />
  );
}
