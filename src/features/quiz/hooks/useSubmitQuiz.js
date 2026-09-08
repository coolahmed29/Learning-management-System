/**
 * FILE: src/features/quiz/hooks/useSubmitQuiz.js
 * PURPOSE: Mutation hook for submitting quiz answers — the highest-stakes
 *          mutation in the app, since it also drives course progress.
 *
 * SIGNATURE: export function useSubmitQuiz() -> useMutation result
 *
 * STEPS:
 *    1. const { user } = useAuth()
 *    2. const queryClient = useQueryClient()
 *    3. useMutation({
 *         mutationFn: ({ quizId, answers }) =>
 *           quizApi.submitQuizAttempt(user.id, quizId, answers).then(({data,error}) => {
 *              if(error) throw new Error('Failed to submit quiz. Please try again.');
 *              return data;
 *           }),
 *         onSuccess: (result, { quizId, courseId }) => {
 *           if (result.passed) {
 *             // SAME invalidation family as Phase 5's useMarkComplete, since
 *             // passing a quiz has the exact same downstream effects as
 *             // completing a lesson (progress moves forward):
 *             queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId] });
 *             queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user.id] });
 *             queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
 *           }
 *           // if NOT passed, do NOT invalidate progress-related queries —
 *           // a failed attempt shouldn't be treated as course progress
 *         },
 *       })
 *
 * EDGE CASES:
 *    - courseId is passed EXPLICITLY as a mutation argument
 *      (mutate({ quizId, answers, courseId })) — QuizPage already has courseId
 *      from useParams, so the invalidation uses it directly instead of
 *      deriving it from cached quiz data, which is more fragile.
 *    - Submitting with incomplete answers — RECOMMENDATION is to block
 *      client-side with a clear message ("Please answer all questions"); that
 *      gating lives in the form layer, not this hook.
 *
 * TESTING NOTES: passing result invalidates the 3 query families (courseId
 * passed explicitly, assert correct courseId used in each invalidation);
 * failing result does NOT invalidate any of them; network/server error ->
 * isError true, friendly message, no invalidation.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as quizApi from "../api/quizApi";

export function useSubmitQuiz() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, answers }) =>
      quizApi
        .submitQuizAttempt(user.id, quizId, answers)
        .then(({ data, error }) => {
          if (error) throw new Error("Failed to submit quiz. Please try again.");
          return data;
        }),
    onSuccess: (result, { courseId }) => {
      // A PASSED attempt moves course progress forward — invalidate the exact
      // same query families useMarkComplete invalidates. A failed attempt is
      // NOT course progress and must leave all three caches untouched.
      if (!result.passed) return;

      queryClient.invalidateQueries({ queryKey: ["courseProgress", courseId] });
      queryClient.invalidateQueries({
        queryKey: ["enrollment", courseId, user.id],
      });
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
    },
  });
}