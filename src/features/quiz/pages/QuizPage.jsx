/**
 * FILE: src/features/quiz/pages/QuizPage.jsx
 * PURPOSE: Route-level page for /learn/:courseId/quiz/:quizId — orchestrates
 *          question flow, submission, and results.
 *
 * STATE (local UI state, this whole page is a self-contained flow):
 *    - currentQuestionIndex: number (starts at 0)
 *    - answers: Record<questionId, optionId>  (accumulated as user answers)
 *    - showResults: boolean (false until submission resolves)
 *
 * STEPS:
 *    1. const { courseId, quizId } = useParams()
 *    2. const { data: quiz, isLoading, isError } = useQuiz(quizId)
 *    3. const { mutate: submitQuiz, data: result, isPending: isSubmitting } = useSubmitQuiz()
 *    4. Access-control guard: same pattern as LearningPage — verify enrollment
 *       before allowing quiz access (reuse useEnrollmentStatus), redirect to
 *       course details if not enrolled
 *    5. Render:
 *       - isLoading -> <LoadingState />
 *       - isError -> <ErrorState onRetry={refetch} />
 *       - !showResults && quiz loaded ->
 *          <QuizHeader title={quiz.title} questionCounter={`${currentQuestionIndex+1}/${quiz.questions.length}`} />
 *          <QuizQuestion question={quiz.questions[currentQuestionIndex]}
 *             selectedOptionId={answers[quiz.questions[currentQuestionIndex].id]}
 *             onSelect={(optId) => setAnswers(prev => ({...prev, [currentQ.id]: optId}))} />
 *          <QuizNavigation totalQuestions={...} currentIndex={currentQuestionIndex}
 *             answeredIndices={new Set(indices whose question id is in answers)}
 *             onNavigate={setCurrentQuestionIndex} />
 *          <SubmitQuizButton allAnswered={Object.keys(answers).length === quiz.questions.length}
 *             isSubmitting={isSubmitting}
 *             onSubmit={() => submitQuiz({ courseId, quizId,
 *                answers: Object.entries(answers).map(([questionId, selectedOptionId]) =>
 *                   ({questionId, selectedOptionId})) })} />
 *       - result present (post-submission) ->
 *          <QuizResultScreen result={result}
 *             onRetry={() => { setAnswers({}); setCurrentQuestionIndex(0);
 *                // also need to reset useSubmitQuiz's mutation state via its
 *                // .reset() method so `result` clears and the question flow
 *                // shows again instead of the result screen persisting }}
 *             onContinue={() => navigate(`/learn/${courseId}`)} />
 *
 * EDGE CASES:
 *    - Navigating away mid-quiz (browser back, clicking a sidebar link if the
 *      sidebar is even present on this minimal QuizLayout) loses unsaved
 *      answers — acceptable for a first pass (no draft-saving requirement in
 *      spec), but consider a simple "are you sure you want to leave?" browser
 *      confirm as a lightweight guard if this becomes a real user complaint —
 *      not required for Phase 6's initial scope (avoid over-engineering).
 *
 * TESTING NOTES (integration test):
 *    - full flow: load quiz -> answer all questions (navigating between them
 *      non-linearly via QuizNavigation) -> submit -> see correct pass result
 *      with answer review
 *    - failing flow: submit with wrong answers (MSW mocks a failing score) ->
 *      see fail result -> click Retry -> question flow resets to question 1
 *      with cleared answers -> can re-submit
 *    - submit button stays disabled until all questions answered
 *    - passing the quiz triggers the SAME cross-feature invalidation chain
 *      verification as Phase 5's Mark Complete test: assert sidebar/progress
 *      elsewhere in the app would reflect updated progress (test this at the
 *      hook level via useSubmitQuiz.test.js primarily, with at least one
 *      confirming assertion here too)
 *    - non-enrolled user redirected away from quiz page
 */
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuiz } from "../hooks/useQuiz";
import { useSubmitQuiz } from "../hooks/useSubmitQuiz";
import { useEnrollmentStatus } from "../../courses/hooks/useEnrollmentStatus";
import { QuizQuestion } from "../components/QuizQuestion";
import { QuizNavigation } from "../components/QuizNavigation";
import { SubmitQuizButton } from "../components/SubmitQuizButton";
import { QuizResultScreen } from "../components/QuizResultScreen";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { ErrorState } from "../../../components/feedback/ErrorState";

export function QuizPage() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const {
    data: quiz,
    isLoading: quizLoading,
    isError: quizError,
    refetch: refetchQuiz,
  } = useQuiz(quizId);
  const {
    mutate: submitQuiz,
    data: result,
    isPending: isSubmitting,
    reset: resetSubmission,
  } = useSubmitQuiz();
  const { isEnrolled, isLoading: enrollmentStatusLoading } = useEnrollmentStatus(courseId);

  const showResults = Boolean(result);

  // ACCESS GUARD: same pattern as LearningPage — never serve content to
  // unenrolled users who type the quiz URL directly.
  if (enrollmentStatusLoading) {
    return <LoadingState />;
  }
  if (!isEnrolled) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }

  if (quizLoading) {
    return <LoadingState />;
  }
  if (quizError) {
    return <ErrorState title="Couldn't load quiz" onRetry={refetchQuiz} />;
  }

  if (showResults && result) {
    return (
      <div className="bg-ice/40 px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <QuizResultScreen
            result={result}
            onRetry={() => {
              setAnswers({});
              setCurrentQuestionIndex(0);
              resetSubmission();
            }}
            onContinue={() => navigate(`/learn/${courseId}`)}
          />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <LoadingState />;
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const currentQuestion = questions[currentQuestionIndex];

  const answeredIndices = new Set(
    questions.reduce((acc, question, index) => {
      if (answers[question.id] !== undefined) acc.push(index);
      return acc;
    }, [])
  );

  return (
    <div className="bg-ice/40 px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-subheading font-semibold text-carbon">
            {quiz.title}
          </h1>
          <span className="text-body-sm text-ash">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </header>

        {currentQuestion && (
          <QuizQuestion
            question={currentQuestion}
            selectedOptionId={answers[currentQuestion.id]}
            onSelect={(optionId) =>
              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }))
            }
          />
        )}

        <QuizNavigation
          totalQuestions={questions.length}
          currentIndex={currentQuestionIndex}
          answeredIndices={answeredIndices}
          onNavigate={setCurrentQuestionIndex}
        />

        <SubmitQuizButton
          allAnswered={Object.keys(answers).length === questions.length}
          isSubmitting={isSubmitting}
          onSubmit={() =>
            submitQuiz({
              courseId,
              quizId,
              answers: Object.entries(answers).map(
                ([questionId, selectedOptionId]) => ({
                  questionId,
                  selectedOptionId,
                })
              ),
            })
          }
        />
      </div>
    </div>
  );
}