/**
 * Generic page-number navigation control — courses listing and paginated tables.
 */
import clsx from "clsx";

function getPageRange(currentPage, totalPages, siblingCount = 1) {
  const totalPageNumbers = siblingCount * 2 + 3;

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(
    currentPage + siblingCount,
    totalPages
  );

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [
      ...range(1, leftItemCount),
      "ellipsis-right",
      totalPages,
    ];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [
      1,
      "ellipsis-left",
      ...range(totalPages - rightItemCount + 1, totalPages),
    ];
  }

  return [
    1,
    "ellipsis-left",
    ...range(leftSiblingIndex, rightSiblingIndex),
    "ellipsis-right",
    totalPages,
  ];
}

function range(start, end) {
  const result = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}) {
  if (totalPages <= 1) return null;

  const pageItems = getPageRange(currentPage, totalPages, siblingCount);

  return (
    <nav
      className={clsx("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-pill px-3 py-1.5 text-body-sm text-smoke hover:bg-frost disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
      >
        Prev
      </button>

      {pageItems.map((item, index) => {
        if (item === "ellipsis-left" || item === "ellipsis-right") {
          return (
            <span
              key={`${item}-${index}`}
              className="px-2 py-1.5 text-body-sm text-mist"
              aria-hidden="true"
            >
              &hellip;
            </span>
          );
        }

        const isActive = item === currentPage;
        return (
          <button
            key={item}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={clsx(
              "min-w-9 rounded-pill px-3 py-1.5 text-body-sm",
              isActive
                ? "bg-apple-blue text-ice"
                : "text-smoke hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
            )}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-pill px-3 py-1.5 text-body-sm text-smoke hover:bg-frost disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
      >
        Next
      </button>
    </nav>
  );
}
