/**
 * FILE: src/features/quiz/__tests__/useSubmitQuiz.test.js
 * PURPOSE: The highest-value unit test in this phase — verifies the
 *          pass-vs-fail invalidation branching precisely.
 *
 * TEST CASES:
 *    ✓ passing result (MSW mocks passed:true) -> invalidates all 3 query key
 *      families (courseProgress, enrollment, myEnrollments) using the
 *      explicitly-passed courseId
 *    ✓ failing result (MSW mocks passed:false) -> resolves successfully
 *      (isError false — a fail is a valid outcome, not an error) but
 *      invalidates NONE of the 3 query families
 *    ✓ server/network error -> isError true, friendly message, no invalidation
 *    ✓ result data shape includes score/correctAnswers/totalQuestions/
 *      answerBreakdown as expected by QuizResultScreen
 */
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { server } from "../../../test/mocks/server";
import { useSubmitQuiz } from "../hooks/useSubmitQuiz";

const user = { id: "user-1", email: "test@example.com" };
const courseId = "course-1";
const quizId = "quiz-1";

const passResult = {
  score: 100,
  passed: true,
  correctAnswers: 2,
  totalQuestions: 2,
  answerBreakdown: [
    {
      questionId: "q-1",
      questionText: "What is React?",
      selectedAnswer: "A UI library",
      correctAnswer: "A UI library",
      isCorrect: true,
    },
    {
      questionId: "q-2",
      questionText: "What is JSX?",
      selectedAnswer: "A syntax extension",
      correctAnswer: "A syntax extension",
      isCorrect: true,
    },
  ],
};

const failResult = {
  ...passResult,
  score: 50,
  passed: false,
  correctAnswers: 1,
  answerBreakdown: [
    passResult.answerBreakdown[0],
    { ...passResult.answerBreakdown[1], selectedAnswer: "A CSS framework", isCorrect: false },
  ],
};

function createStore(authUser = user) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authUser, isLoading: false } },
  });
}

function renderSubmitQuiz() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
  const store = createStore();
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return {
    result: renderHook(() => useSubmitQuiz(), { wrapper }).result,
    queryClient,
  };
}

function useSubmitHandler({ result = passResult, error = false } = {}) {
  return server.use(
    http.post("*/rest/v1/rpc/submit_quiz_attempt", () => {
      if (error) return HttpResponse.json({ message: "boom" }, { status: 500 });
      return HttpResponse.json(result);
    })
  );
}

function mutate(result, payload) {
  act(() => {
    result.current.mutate({
      quizId,
      answers: [
        { questionId: "q-1", selectedOptionId: "opt-1-1" },
        { questionId: "q-2", selectedOptionId: "opt-2-1" },
      ],
      ...payload,
      courseId,
    });
  });
}

describe("useSubmitQuiz", () => {
  it("passing result invalidates ALL THREE query key families with the explicitly-passed courseId", async () => {
    useSubmitHandler({ result: passResult });
    const { result, queryClient } = renderSubmitQuiz();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mutate(result);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["courseProgress", courseId],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["enrollment", courseId, user.id],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["myEnrollments"] });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it("failing result resolves successfully (not an error) but invalidates NOTHING", async () => {
    useSubmitHandler({ result: failResult });
    const { result, queryClient } = renderSubmitQuiz();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mutate(result);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A fail is a valid outcome — NOT an error state.
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.passed).toBe(false);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("server/network error -> isError true, friendly message, no invalidation", async () => {
    useSubmitHandler({ error: true });
    const { result, queryClient } = renderSubmitQuiz();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mutate(result);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe(
      "Failed to submit quiz. Please try again."
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("result data shape matches what QuizResultScreen expects", async () => {
    useSubmitHandler({ result: passResult });
    const { result } = renderSubmitQuiz();

    mutate(result);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect(data.score).toBe(100);
    expect(data.passed).toBe(true);
    expect(data.correctAnswers).toBe(2);
    expect(data.totalQuestions).toBe(2);
    expect(data.answerBreakdown).toHaveLength(2);
    expect(data.answerBreakdown[0].questionText).toBe("What is React?");
    expect(data.answerBreakdown[0].isCorrect).toBe(true);

    // reset() clears the mutation data — the retry path in QuizPage relies on
    // this so the result screen un-mounts and the question flow shows again.
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.data).toBeUndefined());
  });
});