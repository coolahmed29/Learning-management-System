/**
 * CourseProgressCard — CourseCard variant showing enrollment progress, used
 * by My Learning and the Student Dashboard's "Continue Learning" section.
 * Composes Card + ProgressBar (Rule 7) instead of re-laying-out from scratch.
 *
 * Data arrives from getMyEnrollments in PostgREST raw shape, so like Phase 3's
 * CourseCurriculumAccordion this tolerates both the camelCase display shape
 * ({ progressPercent, course.thumbnailUrl, course.instructorName }) and the
 * snake_case raw shape ({ progress_percent, course.thumbnail_url,
 * course.instructor.name }).
 */
import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card/Card";
import { Button } from "../../../components/ui/Button/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar/ProgressBar";

export function CourseProgressCard({ enrollment }) {
  const navigate = useNavigate();

  const course = enrollment.course;
  const progressPercent = enrollment.progressPercent ?? enrollment.progress_percent ?? 0;
  const instructorName = course.instructorName ?? course.instructor?.name;
  const thumbnailUrl = course.thumbnailUrl ?? course.thumbnail_url;

  return (
    <Card padding="none" onClick={() => navigate(`/learn/${course.id}`)}>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-pebble" aria-hidden="true" />
      )}

      <div className="p-card-padding">
        <h3 className="text-subheading font-semibold text-carbon">{course.title}</h3>
        <p className="mt-1 text-body-sm text-ash">{instructorName}</p>

        <ProgressBar value={progressPercent} className="mt-3" />
        <span className="mt-1.5 block text-caption text-ash">
          {progressPercent}% complete
        </span>

        <Button size="sm" className="mt-3">
          {progressPercent === 100 ? "Review" : "Continue"}
        </Button>
      </div>
    </Card>
  );
}