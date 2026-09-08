/**
 * FILE: src/features/quiz/api/quizApi.js
 * PURPOSE: NEW feature folder (features/quiz/) — quiz-taking is a distinct
 *          enough domain (question navigation, scoring, pass/fail, retries)
 *          from both courses/ and learning/ to warrant its own folder, even
 *          though it's tightly linked to a course's curriculum.
 *
 * EXPORTS:
 *    export async function getQuiz(quizId)
 *       - supabase.from('quizzes').select(`
 *           id, title, passing_score, module:course_modules(course_id, title),
 *           questions:quiz_questions(id, question_text, order,
 *             options:quiz_options(id, option_text, order))
 *         `).eq('id', quizId).single()
 *       - CRITICAL SECURITY NOTE: this query must NEVER include which option
 *         is_correct — that field must be excluded from the select entirely
 *         for a taking-the-quiz context, otherwise a user could read the
 *         answer key directly from the network tab. Correct-answer checking
 *         happens SERVER-SIDE (see submitQuiz below), never client-side.
 *
 *    export async function submitQuizAttempt(userId, quizId, answers)
 *       // answers: Array<{ questionId, selectedOptionId }>
 *       STEPS:
 *         1. This MUST be a server-side operation — call a Supabase RPC/Edge
 *            Function: supabase.rpc('submit_quiz_attempt', { p_user_id: userId,
 *            p_quiz_id: quizId, p_answers: answers })
 *         2. The RPC (backend responsibility, not this frontend file) does:
 *            - looks up correct option ids server-side
 *            - computes score = correct/total
 *            - compares against passing_score -> pass/fail boolean
 *            - inserts a quiz_attempts row (user_id, quiz_id, score, passed, answers)
 *            - if passed, ALSO marks the associated module/lesson-equivalent as
 *              complete in lesson_progress (or however quiz-completion maps
 *              into the same progress system Phase 5 built) and recalculates
 *              enrollment progress_percent — same "do it atomically server-
 *              side" principle as Phase 5's markLessonComplete RPC
 *         3. Returns { data: { score, passed, correctAnswers, totalQuestions,
 *            answerBreakdown }, error }
 *            (answerBreakdown: per-question correct/incorrect + which option
 *            WAS correct, for QuizResultScreen's review view — safe to reveal
 *            AFTER submission, unlike before)
 *
 *    export async function getQuizAttemptHistory(userId, quizId)
 *       - fetch past attempts (for retry-limit logic if the product has a
 *         max-attempts rule — spec doesn't explicitly mandate one, so treat
 *         retries as UNLIMITED unless told otherwise, keep this simple per
 *         Rule 8, just fetch the most recent attempt if any exists to show
 *         "last score: X%" context on quiz entry)
 *
 * EDGE CASES:
 *    - Reiterate: correct-answer data must NEVER reach the client before
 *      submission. This is a genuine security requirement, not just a code-
 *      quality nicety — a client-side-graded quiz is trivially cheatable.
 *      This is the single most important architectural decision in this phase.
 */
import { supabase } from "../../../services/apiClient";

export async function getQuiz(quizId) {
  // Deliberately NEVER selects quiz_options.is_correct — the answer key must
  // not be readable from the network tab by someone taking the quiz.
  return supabase
    .from("quizzes")
    .select(
      `id, title, passing_score, module:course_modules(course_id, title),
       questions:quiz_questions(id, question_text, order,
         options:quiz_options(id, option_text, order))`
    )
    .eq("id", quizId)
    .single();
}

export async function submitQuizAttempt(userId, quizId, answers) {
  // Grading is server-side (the RPC looks up correct option ids, computes the
  // score/pass, writes the attempt, and updates course progress atomically) —
  // the client never sees the answer key, only the POST-submission result.
  return supabase.rpc("submit_quiz_attempt", {
    p_user_id: userId,
    p_quiz_id: quizId,
    p_answers: answers,
  });
}

export async function getQuizAttemptHistory(userId, quizId) {
  // Retries are unlimited, so the only history needed is the most recent
  // attempt for "last score: X%" context on quiz entry. maybeSingle: no
  // attempts at all -> data null, not an error.
  return supabase
    .from("quiz_attempts")
    .select("id, score, passed, created_at")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}