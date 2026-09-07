/**
 * Standardized loading UI — spinner or skeleton mode, never a blank screen.
 */
import { Spinner } from "../ui/Spinner/Spinner";
import { Skeleton } from "../ui/Skeleton/Skeleton";

export function LoadingState({
  variant = "spinner",
  message,
  skeletonCount = 6,
  SkeletonComponent,
}) {
  if (variant === "skeleton") {
    const Item = SkeletonComponent ?? DefaultSkeletonItem;
    return (
      <div
        role="status"
        aria-label="Loading"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <Item key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex min-h-[240px] flex-col items-center justify-center gap-4"
    >
      <Spinner size="lg" />
      {message && <p className="text-body-sm text-ash">{message}</p>}
    </div>
  );
}

function DefaultSkeletonItem() {
  return (
    <div className="rounded-card border border-mist/40 p-card-padding">
      <Skeleton variant="rectangular" height="160px" width="100%" className="mb-4" />
      <Skeleton variant="text" height="20px" width="70%" className="mb-2" />
      <Skeleton variant="text" height="16px" width="90%" />
    </div>
  );
}