/**
 * Horizontal grid of related course suggestions at the bottom of Course
 * Details — reuses CourseCard (Phase 2 component) directly, no duplication.
 * Optional enhancement content: renders nothing when there are no related
 * courses (no EmptyState needed here, unlike a primary content area).
 */
import { CourseCard } from "./CourseCard";

export function RelatedCoursesSection({ courses = [] }) {
  if (courses.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-heading-sm font-semibold text-carbon">
        You might also like
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}