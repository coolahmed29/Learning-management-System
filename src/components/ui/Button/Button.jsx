/**
 * Single generic button component covering all button styles used across the app.
 */
import clsx from "clsx";
import { Spinner } from "../Spinner/Spinner";

const VARIANT_CLASSES = {
  filled: "bg-apple-blue text-ice rounded-pill hover:opacity-90",
  outlined: "border border-link-blue text-link-blue bg-transparent rounded-pill hover:bg-link-blue/5",
  ghost: "text-link-blue underline-offset-4 hover:underline",
};

const SIZE_CLASSES = {
  sm: "text-body-sm px-3 py-1.5",
  md: "text-body px-[15px] py-[11px]",
  lg: "text-subheading px-6 py-3",
};

export function Button({
  variant = "filled",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  children,
  className,
  ...rest
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {isLoading && (
        <Spinner size="sm" />
      )}
      {children}
    </button>
  );
}
