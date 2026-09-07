/**
 * Route-level page for /courses/:id — orchestrates the detail-view pieces and
 * handles the THREE top-level states: loading, error (including the special
 * not-found case), success. Tab switching uses the generic ui/Tabs primitive.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NotFoundError } from "../../../lib/errors";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { Button } from "../../../components/ui/Button/Button";
import { Tabs } from "../../../components/ui/Tabs/Tabs";
import { useCourseDetails } from "../hooks/useCourseDetails";
import { useRelatedCourses } from "../hooks/useRelatedCourses";
import { useEnrollmentStatus } from "../hooks/useEnrollmentStatus";
import { CourseHeader } from "../components/CourseHeader";
import { EnrollmentCTA } from "../components/EnrollmentCTA";
import { LearningOutcomesSection } from "../components/LearningOutcomesSection";
import { CourseCurriculumAccordion } from "../components/CourseCurriculumAccordion";
import { InstructorCard } from "../components/InstructorCard";
import { RelatedCoursesSection } from "../components/RelatedCoursesSection";

const COURSE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "instructor", label: "Instructor" },
  { id: "reviews", label: "Reviews" },
];

export function CourseDetailsPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourseDetails(courseId);

  // Only fires once the course resolves and its category is known (the hook's
  // enabled: !!category handles that internally).
  const { data: relatedCourses } = useRelatedCourses(courseId, course?.category);

  // Same queryKey as EnrollmentCTA's internal call, so TanStack Query dedupes
  // this — no extra network cost from reading enrollment status here too.
  const { isEnrolled } = useEnrollmentStatus(courseId);

  if (isLoading) {
    // Simple centered spinner for Phase 3's first pass (per the phase notes, a
    // detailed skeleton shape is a later polish-pass enhancement).
    return <LoadingState message="Loading course details..." />;
  }

  if (isError && error instanceof NotFoundError) {
    // Distinct 404-style state — NOT the retryable ErrorState, since retrying
    // won't resurrect a course that doesn't exist.
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-heading-sm font-semibold text-carbon">
          Course not found
        </h1>
        <p className="max-w-sm text-body-sm text-ash">
          This course may have been removed or unpublished. Browse the catalog
          to keep exploring.
        </p>
        <Button variant="outlined" onClick={() => navigate("/courses")}>
          Browse all courses
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load this course"
        onRetry={refetch}
      />
    );
  }

  const learningOutcomes =
    course.learningOutcomes ?? course.learning_outcomes ?? [];

  return (
    <section className="px-6 py-10">
      <CourseHeader course={course} />

      <div className="mt-6 max-w-sm">
        <EnrollmentCTA courseId={courseId} />
      </div>

      <Tabs
        tabs={COURSE_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Course sections"
        className="mt-8"
      />

      {activeTab === "overview" && (
        <div className="mt-6 max-w-3xl">
          <p className="text-body text-carbon">{course.description}</p>
          <div className="mt-8">
            <LearningOutcomesSection outcomes={learningOutcomes} />
          </div>
        </div>
      )}

      {activeTab === "curriculum" && (
        <div className="mt-6">
          <CourseCurriculumAccordion
            modules={course.modules ?? []}
            isEnrolled={isEnrolled}
          />
        </div>
      )}

      {activeTab === "instructor" && (
        <div className="mt-6">
          <InstructorCard instructor={course.instructor} />
        </div>
      )}

      {activeTab === "reviews" && (
        <p className="mt-6 text-body-sm text-ash">
          Reviews are coming soon.
        </p>
      )}

      <RelatedCoursesSection courses={relatedCourses ?? []} />
    </section>
  );
}