/**
 * Generic surface container — 8px radius, hairline border, no shadow.
 */
import clsx from "clsx";

const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-card-padding",
};

const SURFACE_CLASSES = {
  default: "bg-white border-mist/40",
  elevated: "bg-frost border-mist/40",
};

export function Card({
  children,
  padding = "md",
  surface = "default",
  className,
  onClick,
  ...rest
}) {
  const interactive = typeof onClick === "function";

  const baseClasses = clsx(
    "rounded-card border",
    SURFACE_CLASSES[surface],
    PADDING_CLASSES[padding],
    interactive &&
      "cursor-pointer transition-colors hover:border-link-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue",
    className
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={baseClasses}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={baseClasses} {...rest}>
      {children}
    </div>
  );
}
