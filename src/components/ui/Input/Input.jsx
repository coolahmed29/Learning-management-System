/**
 * Generic form input matching DESIGN.md's "Form Input" spec. No form-library
 * dependency — works with React Hook Form's register/Controller via forwardRef.
 */
import { forwardRef, useState } from "react";
import clsx from "clsx";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    type = "text",
    id,
    name,
    className,
    disabled,
    ...rest
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-body-sm font-medium text-smoke"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-card border bg-frost px-4 py-2.5 text-body text-carbon placeholder:text-mist",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:border-apple-blue",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-colors",
            error
              ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
              : "border-mist",
            isPassword && "pr-11",
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-card px-2 py-1 text-body-sm text-link-blue hover:bg-link-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-body-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
