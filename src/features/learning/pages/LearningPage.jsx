/**
 * LearningPage — the route-level page for /learn/:courseId/:lessonId? and the
 * most state-heavy page in the app: it orchestrates curriculum, lesson content,
 * the resume-behavior redirect, prev/next navigation, and the mark-complete
 * invalidation chain. Layout is a minimal top bar (course name, Exit to "My
 * Learning", ProgressIndicator) over a two-column body (curriculum sidebar +
 * lesson pane).
 */
import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCourseProgress } from "../hooks/useCourseProgress";
import { useLessonContent } from "../hooks/useLessonContent";
import { useMarkComplete } from "../hooks/useMarkComplete";
import { useUpdateLastAccessed } from "../hooks/useUpdateLastAccessed";
import { useEnrollmentStatus } from "../../courses/hooks/useEnrollmentStatus";
import { CourseCurriculumSidebar } from "../components/CourseCurriculumSidebar";
import { LessonContentPanel } from "../components/LessonContentPanel";
import { LessonInfoPanel } from "../components/LessonInfoPanel";
import { LearningControlsBar } from "../components/LearningControlsBar";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { Button } from "../../../components/ui/Button/Button";

function getPrevNext(modules, currentLessonId) {
  if (!currentLessonId) return { prevLesson: null, nextLesson: null };
  // Flat ordered lesson list across all modules; find the current lesson's
  // neighbors. prev/next are { id, ... } objects (controls only need .id).
  const lessons = (modules ?? []).flatMap((module) => module.lessons ?? []);
  const index = lessons.findIndex((lesson) => lesson.id === currentLessonId);
  if (index === -1) return { prevLesson: null, nextLesson: null };
  return {
    prevLesson: index > 0 ? lessons[index - 1] : null,
    nextLesson: index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

export function LearningPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const {
    data: progressData,
    isLoading: progressLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useCourseProgress(courseId);
  const { isEnrolled, isLoading: enrollmentStatusLoading } = useEnrollmentStatus(courseId);
  const {
    data: lesson,
    isLoading: lessonLoading,
    isError: lessonError,
    refetch: refetchLesson,
  } = useLessonContent(lessonId);
  const { mutate: markComplete, isPending: isMarking } = useMarkComplete();
  const { mutate: updateLastAccessed } = useUpdateLastAccessed();

  const { prevLesson, nextLesson } = useMemo(
    () => getPrevNext(progressData?.modules, lessonId),
    [progressData?.modules, lessonId]
  );

  useEffect(() => {
    if (!courseId || !lessonId) return;
    // SINGLE source of truth for the "update last accessed" side effect — both
    // the sidebar and the Prev/Next buttons navigate freely, and this effect
    // owns the bookkeeping for every navigation entry point.
    updateLastAccessed({ courseId, lessonId });
  }, [courseId, lessonId, updateLastAccessed]);

  // ACCESS GUARD: the page assumes an enrolled user, but the URL can be typed
  // directly — once the enrollment check resolves and shows not-enrolled,
  // redirect to the course details page instead of serving paid content.
  if (enrollmentStatusLoading) {
    return <LoadingState />;
  }
  if (!isEnrolled) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }

  if (progressLoading) {
    return <LoadingState />;
  }
  if (progressError) {
    return <ErrorState title="Couldn't load course" onRetry={refetchProgress} />;
  }

  // RESUME: bare /learn/:courseId -> last-accessed lesson, else first lesson.
  if (!lessonId) {
    const firstLessonId = progressData?.modules?.[0]?.lessons?.[0]?.id;
    const targetLessonId = progressData?.lastLessonId ?? firstLessonId;
    if (!targetLessonId) return <LoadingState />;
    return <Navigate to={`/learn/${courseId}/${targetLessonId}`} replace />;
  }

  const isCompleted = Boolean(progressData?.completedLessonIds?.has(lessonId));

  return (
    <div className="flex h-screen flex-col bg-ice/40">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-mist/40 bg-white px-6 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <h1 className="truncate text-subheading font-semibold text-carbon">
            {progressData?.courseTitle}
          </h1>
          <ProgressIndicator progressPercent={progressData?.progressPercent ?? 0} />
        </div>
        <Button variant="outlined" size="sm" onClick={() => navigate("/my-learning")}>
          Exit
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-mist/40 bg-white p-4 lg:block">
          <CourseCurriculumSidebar
            modules={progressData?.modules ?? []}
            completedLessonIds={progressData?.completedLessonIds}
            currentLessonId={lessonId}
            courseId={courseId}
          />
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-3xl min-h-full flex-col">
            {lessonLoading && <LoadingState />}

            {lessonError && (
              <ErrorState title="Couldn't load lesson" onRetry={refetchLesson} />
            )}

            {!lessonLoading && !lessonError && lesson && (
              <div className="space-y-6">
                <LessonContentPanel lesson={lesson} />
                <LessonInfoPanel lesson={lesson} />
              </div>
            )}

            <div className="mt-8">
              <LearningControlsBar
                prevLesson={prevLesson}
                nextLesson={nextLesson}
                isCompleted={isCompleted}
                onMarkComplete={() => markComplete({ courseId, lessonId })}
                isMarking={isMarking}
                courseId={courseId}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}