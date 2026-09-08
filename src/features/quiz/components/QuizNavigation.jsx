/**
 * FILE: src/features/quiz/components/QuizNavigation.jsx
 * PURPOSE: Question-to-question navigation within the quiz (dots or numbered
 *          buttons showing answered/current/unanswered state).
 *
 * PROPS:
 *    totalQuestions: number
 *    currentIndex: number
 *    answeredIndices: Set<number>
 *    onNavigate: (index: number) => void
 *
 * STRUCTURE: row of small circular buttons, one per question — filled
 * apple-blue if current, outlined if answered-but-not-current, plain/ash if
 * unanswered — clicking any jumps directly to that question (non-linear
 * navigation, standard quiz UX)
 *
 * TESTING NOTES: renders correct number of dots, current dot has distinct
 * styling, answered dots show answered styling, clicking a dot calls
 * onNavigate with correct index.
 */
import clsx from "clsx";

export function QuizNavigation({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onNavigate,
}) {
  const answered = answeredIndices instanceof Set ? answeredIndices : new Set();

  return (
    <nav
      aria-label="Question navigation"
      className="flex flex-wrap items-center gap-2"
    >
      {Array.from({ length: totalQuestions }, (_, index) => {
        const isCurrent = index === currentIndex;
        const isAnswered = answered.has(index);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`Question ${index + 1}`}
            aria-current={isCurrent ? "step" : undefined}
            className={clsx(
              "h-9 w-9 rounded-full text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue focus-visible:ring-offset-2",
              isCurrent
                ? "bg-apple-blue text-ice"
                : isAnswered
                  ? "border border-apple-blue bg-apple-blue/5 text-apple-blue"
                  : "border border-mist/40 bg-white text-ash hover:bg-frost"
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </nav>
  );
}