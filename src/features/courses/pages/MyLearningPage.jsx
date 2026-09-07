/**
 * Route-level page for /my-learning. Local tab state (All / In Progress /
 * Completed) filters fetch-time via useMyEnrollments — deliberately NOT
 * URL-synced: simpler page than Courses Listing, no shareable filtered URLs.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyEnrollments } from "../hooks/useMyEnrollments";
import { CourseProgressCard } from "../components/CourseProgressCard";
import { CourseCardSkeleton } from "../components/CourseCardSkeleton";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Tabs } from "../../../components/ui/Tabs/Tabs";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { EmptyState } from "../../../components/feedback/EmptyState";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export function MyLearningPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: enrollments, isLoading, isError, refetch } = useMyEnrollments(
    statusFilter
  );

  return (
    <section className="px-6 py-10">
      <PageHeader title="My Learning" />

      <Tabs tabs={FILTER_TABS} activeTab={statusFilter} onChange={setStatusFilter} />

      <div className="mt-8">
        {isLoading && (
          <LoadingState
            variant="skeleton"
            SkeletonComponent={CourseCardSkeleton}
            skeletonCount={6}
          />
        )}

        {isError && <ErrorState onRetry={refetch} />}

        {!isLoading && !isError && enrollments.length === 0 && (
          <EmptyState
            title="No enrolled courses yet"
            message="Browse the catalog and enroll in a course to see it here."
            actionLabel="Browse Courses"
            onAction={() => navigate("/courses")}
          />
        )}

        {!isLoading && !isError && enrollments.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}