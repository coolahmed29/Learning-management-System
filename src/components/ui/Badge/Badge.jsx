/**
 * Small status/label pill — course difficulty, course status, role labels, category chips.
 */
import clsx from "clsx";

const VARIANTS = {
  default: {
    background: "#e8e8ed",
    text: "#1d1d1f",
  },
  success: {
    background: "#e5f4e8",
    text: "#1d6b2f",
  },
  warning: {
    background: "#fff4df",
    text: "#9a6b00",
  },
  danger: {
    background: "#fdeaea",
    text: "#b3261e",
  },
  info: {
    background: "#e7f0ff",
    text: "#0066cc",
  },
};

const SIZES = {
  sm: "text-caption px-2 py-0.5",
  md: "text-body-sm px-2.5 py-1",
};

export function Badge({ variant = "default", size = "sm", children, className }) {
  const colors = VARIANTS[variant] ?? VARIANTS.default;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill font-medium",
        SIZES[size],
        className
      )}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {children}
    </span>
  );
}
