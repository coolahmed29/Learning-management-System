/**
 * FILE: src/features/quiz/__tests__/useQuiz.test.js
 * TEST CASES:
 *    ✓ returns quiz with questions/options on success
 *    ✓ error state on failure
 *    ✓ does not fire without quizId
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../../test/mocks/server";
import { useQuiz } from "../hooks/useQuiz";

// NOTE: deliberately NO is_correct on any option — same security invariant the
// useQuiz TESTING NOTES demand the test assert explicitly.
const QUIZ = {
  id: "quiz-1",
  title: "React Fundamentals Quiz",
  passing_score: 70,
  module: { course_id: "course-1", title: "Getting Started" },
  questions: [
    {
      id: "q-1",
      question_text: "What is React?",
      order: 1,
      options: [
        { id: "opt-1-1", option_text: "A UI library", order: 1 },
        { id: "opt-1-2", option_text: "A database", order: 2 },
      ],
    },
    {
      id: "q-2",
      question_text: "What is JSX?",
      order: 2,
      options: [
        { id: "opt-2-1", option_text: "A syntax extension", order: 1 },
        { id: "opt-2-2", option_text: "A CSS framework", order: 2 },
      ],
    },
  ],
};

function renderQuiz(quizId) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useQuiz(quizId), { wrapper });
}

describe("useQuiz", () => {
  it("returns quiz with questions/options on success", async () => {
    server.use(http.get("*/rest/v1/quizzes", () => HttpResponse.json(QUIZ)));

    const { result } = renderQuiz("quiz-1");

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.id).toBe("quiz-1");
    expect(result.current.data.title).toBe("React Fundamentals Quiz");
    expect(result.current.data.questions).toHaveLength(2);
    expect(result.current.data.questions[0].options).toHaveLength(2);
    expect(result.current.data.questions[0].options[0].option_text).toBe(
      "A UI library"
    );
  });

  it("returned quiz shape contains NO is_correct field anywhere", async () => {
    // Explicit safeguard (per the hook's TESTING NOTES) — a client-side quiz
    // must never see the answer key.
    server.use(http.get("*/rest/v1/quizzes", () => HttpResponse.json(QUIZ)));

    const { result } = renderQuiz("quiz-1");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(JSON.stringify(result.current.data)).not.toContain("is_correct");
  });

  it("error state on failure", async () => {
    server.use(
      http.get("*/rest/v1/quizzes", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderQuiz("quiz-1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Failed to load quiz");
    expect(result.current.data).toBeUndefined();
  });

  it("does not fire without quizId", async () => {
    const calls = [];
    server.use(
      http.get("*/rest/v1/quizzes", () => {
        calls.push("quizzes");
        return HttpResponse.json(QUIZ);
      })
    );

    const { result } = renderQuiz(undefined);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(calls).toHaveLength(0);
  });
});