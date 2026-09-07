/**
 * Loading placeholder matching CourseCard's exact layout shape — used by
 * LoadingState (skeleton mode) on the courses listing while data is fetching.
 */
import { Card } from "../../../components/ui/Card/Card";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";

export function CourseCardSkeleton() {
  return (
    <Card padding="none">
      <Skeleton variant="rectangular" height="160px" width="100%" />
      <div className="p-card-padding">
        <Skeleton variant="text" width="60px" height="20px" />
        <div className="mt-3 space-y-2">
          <Skeleton variant="text" width="80%" height="18px" />
          <Skeleton variant="text" width="50%" height="16px" />
        </div>
      </div>
    </Card>
  );
}