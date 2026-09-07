/**
 * Standardized "something went wrong" UI — never a blank/broken screen.
 */
import { Button } from "../ui/Button/Button";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg
          role="presentation"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
        </svg>
      </div>
      <h3 className="text-subheading font-semibold text-carbon">{title}</h3>
      {message && <p className="max-w-sm text-body-sm text-ash">{message}</p>}
      {onRetry && (
        <Button variant="outlined" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
