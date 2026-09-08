/**
 * FILE: src/features/quiz/components/QuizResultScreen.jsx
 * PURPOSE: Post-submission results view — score, pass/fail, per-question
 *          review, retry option.
 *
 * PROPS:
 *    result: { score, passed, correctAnswers, totalQuestions, answerBreakdown }
 *    onRetry: () => void
 *    onContinue: () => void  (navigates back to learning page / next content)
 *
 * STRUCTURE:
 *    <ScoreSummary> — large score percentage, pass/fail badge (success/danger
 *       Badge variant from Phase 0), "{correctAnswers}/{totalQuestions} correct"
 *    <AnswerReview> — answerBreakdown.map(item => shows the question, the
 *       user's selected answer, the correct answer, marked ✓/✗ — this is safe
 *       to show now since it's POST-submission data from the server
 *    if (!passed) -> <Button onClick={onRetry}>Retry Quiz</Button>
 *    if (passed) -> <Button onClick={onContinue}>Continue</Button>
 *
 * EDGE CASES:
 *    - Since retries are unlimited (per quizApi's documented assumption),
 *      RetryButton simply re-mounts/resets the quiz-taking flow (clear
 *      selected answers, go back to question 1) rather than needing any
 *      attempt-count logic — keep this simple unless a max-attempts rule is
 *      confirmed as a real requirement.
 *
 * TESTING NOTES: renders correct score/pass-fail state, renders answer review
 * with correct ✓/✗ per question, shows Retry button when failed (not
 * Continue), shows Continue button when passed (not Retry), clicking each
 * calls the correct handler.
 */
import { Badge } from "../../../components/ui/Badge/Badge";
import { Button } from "../../../components/ui/Button/Button";

// The answerBreakdown items the RPC returns (POST-submission only, safe to
// reveal): { questionText, selectedAnswer, correctAnswer, isCorrect }.
export function QuizResultScreen({ result, onRetry, onContinue }) {
  if (!result) return null;

  const passed = Boolean(result.passed);
  const score = result.score ?? 0;
  const correctAnswers = result.correctAnswers ?? 0;
  const totalQuestions = result.totalQuestions ?? 0;
  const breakdown = Array.isArray(result.answerBreakdown)
    ? result.answerBreakdown
    : [];

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-mist/40 bg-white p-6 text-center">
        <p className="text-caption uppercase tracking-wide text-ash">Your score</p>
        <p className="mt-2 text-4xl font-semibold text-carbon">{score}%</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Badge variant={passed ? "success" : "danger"} size="md">
            {passed ? "Passed" : "Failed"}
          </Badge>
          <span className="text-body-sm text-ash">
            {correctAnswers}/{totalQuestions} correct
          </span>
        </div>
      </section>

      {breakdown.length > 0 && (
        <section aria-label="Answer review">
          <h3 className="mb-3 text-heading-sm font-semibold text-carbon">
            Answer review
          </h3>
          <ul className="space-y-4">
            {breakdown.map((item, index) => (
              <AnswerReviewItem key={item.questionId ?? item.question_id ?? index} item={item} index={index} />
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-end">
        {passed ? (
          <Button onClick={onContinue}>Continue</Button>
        ) : (
          <Button onClick={onRetry}>Retry Quiz</Button>
        )}
      </div>
    </div>
  );
}

function AnswerReviewItem({ item, index }) {
  const isCorrect = Boolean(item.isCorrect);
  const questionText =
    item.questionText ?? item.question_text ?? `Question ${index + 1}`;
  const selectedAnswer =
    item.selectedAnswer ??
    item.selected_answer ??
    item.selectedOptionText ??
    item.selected_option_text;
  const correctAnswer =
    item.correctAnswer ??
    item.correct_answer ??
    item.correctOptionText ??
    item.correct_option_text;

  return (
    <li className="rounded-card border border-mist/40 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body font-semibold text-carbon">
          {index + 1}. {questionText}
        </p>
        <span
          aria-hidden="true"
          className={
            isCorrect ? "text-apple-blue" : "text-red-600"
          }
        >
          {isCorrect ? "\u2713" : "\u2717"}
        </span>
      </div>
      <div className="mt-2 space-y-1 text-body-sm text-ash">
        {selectedAnswer !== undefined && (
          <p>
            Your answer: <span className="text-carbon">{selectedAnswer}</span>
          </p>
        )}
        {correctAnswer !== undefined && (
          <p className={isCorrect ? "text-carbon" : "text-red-600"}>
            Correct answer: {correctAnswer}
          </p>
        )}
      </div>
    </li>
  );
}