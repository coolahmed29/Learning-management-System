/**
 * Search input for course discovery — wraps the generic <Input> primitive,
 * owns its own raw text state, and exposes the DEBOUNCED value upward via
 * onSearchChange.
 */
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { Input } from "../../../components/ui/Input/Input";

export function SearchBar({
  onSearchChange,
  placeholder = "Search courses...",
  initialValue = "",
}) {
  const [inputValue, setInputValue] = useState(initialValue ?? "");
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue ?? "");
  const debouncedValue = useDebounce(inputValue, 300);
  const didMount = useRef(false);

  // Notify parent only when the debounced value actually changes after mount —
  // skips the initial no-op fire so landing on a bookmarked URL doesn't reset
  // its query params.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    onSearchChange(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Sync with external changes (e.g. "Clear filters" elsewhere resets the URL) —
  // React's "adjust state during render" pattern, avoiding setState in an effect.
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setInputValue(initialValue ?? "");
  }

  return (
    <div className="relative">
      <svg
        role="presentation"
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mist"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <Input
        id="course-search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search courses"
        className="pl-10 pr-9"
      />
      {inputValue && (
        <button
          type="button"
          onClick={() => setInputValue("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-pill px-2 py-1 text-body-sm text-ash hover:bg-frost hover:text-carbon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
        >
          &times;
        </button>
      )}
    </div>
  );
}