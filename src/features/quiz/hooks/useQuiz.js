/**
 * FILE: src/features/quiz/hooks/useQuiz.js
 * PURPOSE: Fetches quiz questions (without answers) for taking the quiz.
 *
 * SIGNATURE: export function useQuiz(quizId) -> useQuery result
 *
 * STEPS:
 *    1. useQuery({
 *         queryKey: ['quiz', quizId],
 *         queryFn: () => quizApi.getQuiz(quizId).then(({data,error}) => {
 *            if(error) throw new Error('Failed to load quiz'); return data;
 *         }),
 *         enabled: !!quizId,
 *       })
 *
 * TESTING NOTES: returns quiz + questions + options (NO is_correct field
 * present anywhere in the returned mock shape — assert this explicitly in the
 * test as a safeguard against accidentally leaking it if the query/mock ever
 * changes), error state on failure.
 */