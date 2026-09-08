/**
 * Left-side persistent navigation within the Learning Interface — the full
 * module/lesson tree with ✓ completed / → current / quiz-item indicators, and
 * direct navigation to any lesson. NOTE: unlike Course Details' preview-only
 * locking, an ENROLLED learner has all lessons unlocked (the whole course was
 * paid for) — strict sequential gating is NOT implemented unless explicitly
 * requested; free non-linear browsing matches most LMS platforms.
 *
 * The current lesson's module auto-expands with others collapsed. This is done
 * WITH no effect: each ModuleGroup owns local `open` state seeded from
 * `defaultOpen`, and the group's `key` includes the current module id — so
 * navigating to a lesson in another module remounts groups with fresh state
 * (new module open, others collapsed), while navigating within the same module
 * keeps the learner's manual expand/collapse choice intact.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function getQuizId(module) {
  // Module/quiz association shape is not finalized in the schema yet, so
  // tolerate both a nested object and a plain id column.
  if (module.quiz && module.quiz.id) return module.quiz.id;
  if (module.quiz_id) return module.quiz_id;
  return null;
}

function getLessonStatus(lesson, completedLessonIds, currentLessonId) {
  if (completedLessonIds?.has(lesson.id)) return "completed";
  if (lesson.id === currentLessonId) return "current";
  return "available";
}

export function CourseCurriculumSidebar({
  modules = [],
  completedLessonIds,
  currentLessonId,
  courseId,
}) {
  const navigate = useNavigate();
  const currentModuleId = modules.find((module) =>
    (module.lessons ?? []).some((lesson) => lesson.id === currentLessonId)
  )?.id;

  return (
    <nav aria-label="Course curriculum" className="space-y-3">
      {modules.map((module) => (
        <ModuleGroup
          key={`${module.id}:${currentModuleId ?? "none"}`}
          module={module}
          defaultOpen={module.id === currentModuleId}
          completedLessonIds={completedLessonIds}
          currentLessonId={currentLessonId}
          goToLesson={(lessonId) => navigate(`/learn/${courseId}/${lessonId}`)}
          goToQuiz={(quizId) => navigate(`/learn/${courseId}/quiz/${quizId}`)}
        />
      ))}
    </nav>
  );
}

function ModuleGroup({
  module,
  defaultOpen,
  completedLessonIds,
  currentLessonId,
  goToLesson,
  goToQuiz,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const quizId = getQuizId(module);

  return (
    <div className="overflow-hidden rounded-card border border-mist/40 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
      >
        <span className="text-body font-semibold text-carbon">{module.title}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="border-t border-mist/40">
          {(module.lessons ?? []).map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              status={getLessonStatus(
                lesson,
                completedLessonIds,
                currentLessonId
              )}
              onClick={() => goToLesson(lesson.id)}
            />
          ))}
          {quizId && <QuizListItem onClick={() => goToQuiz(quizId)} />}
        </ul>
      )}
    </div>
  );
}

function LessonListItem({ lesson, status, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={status === "current" ? "true" : undefined}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-carbon hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue ${
          status === "current" ? "bg-frost" : ""
        }`}
      >
        <StatusIndicator status={status} />
        <span className="min-w-0 truncate text-body-sm">{lesson.title}</span>
      </button>
    </li>
  );
}

function StatusIndicator({ status }) {
  if (status === "completed") {
    return <span className="text-apple-blue" aria-hidden="true">&check;</span>;
  }
  if (status === "current") {
    return <span className="font-semibold text-link-blue" aria-hidden="true">&rarr;</span>;
  }
  return <PlayIcon />;
}

function QuizListItem({ onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-carbon hover:bg-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
      >
        <QuizIcon />
        <span className="min-w-0 truncate text-body-sm">Quiz</span>
      </button>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-link-blue" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function QuizIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-link-blue"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}