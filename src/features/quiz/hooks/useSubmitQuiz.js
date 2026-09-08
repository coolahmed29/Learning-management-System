// /**
//  * FILE: src/features/quiz/hooks/useSubmitQuiz.js
//  * PURPOSE: Mutation hook for submitting quiz answers — the highest-stakes
//  *          mutation in the app, since it also drives course progress.
//  *
//  * SIGNATURE: export function useSubmitQuiz() -> useMutation result
//  *
//  * STEPS:
//  *    1. const { user } = useAuth()
//  *    2. const queryClient = useQueryClient()
//  *    3. useMutation({
//  *         mutationFn: ({ quizId, answers }) =>
//  *           quizApi.submitQuizAttempt(user.id, quizId, answers).then(({data,error}) => {
//  *              if(error) throw new Error('Failed to submit quiz. Please try again.');
//  *              return data;
//  *           }),
//  *         onSuccess: (result, { quizId }) => {
//  *           if (result.passed) {
//  *             // SAME invalidation family as Phase 5's useMarkComplete, since
//  *             // passing a quiz has the exact same downstream effects as
//  *             // completing a lesson (progress moves forward):
//  *             const courseId = /* derive from quiz data, passed in or looked
//  *                up from the quiz query cache */;
//  *             queryClient.invalidateQueries({ queryKey: ['courseProgress', courseId] });
//  *             queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user.id] });
//  *             queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
//  *           }
//  *           // if NOT passed, do NOT invalidate progress-related queries —
//  *           // a failed attempt shouldn't be treated as course progress
//  *         },
//  *       })
//  *
//  * EDGE CASES:
//  *    - Getting `courseId` for the invalidation calls requires either passing
//  *      it explicitly as a mutation argument (cleanest — QuizPage already has
//  *      courseId from useParams, just include it: mutate({ quizId, answers,
//  *      courseId })) rather than trying to derive it from cached quiz data,
//  *      which is more fragile. RECOMMENDATION: pass courseId explicitly.
//  *    - Submitting with incomplete answers (some questions unanswered) — decide
//  *      whether to block submission client-side (SubmitQuizButton disabled
//  *      until all answered) or allow it and let unanswered = automatically
//  *      wrong server-side. RECOMMENDATION: block client-side with a clear
//  *      message ("Please answer all questions") for better UX, simpler than
//  *      handling partial-submission semantics server-side.
//  *
//  * TESTING NOTES: passing result invalidates the 3 query families (courseId
//  * passed explicitly, assert correct courseId used in each invalidation);
//  * failing result does NOT invalidate any of them; network/server error ->
//  * isError true, friendly message, no invalidation.
//  */