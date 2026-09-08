/**
 * FILE: src/features/quiz/__tests__/quiz.integration.test.jsx
 * PURPOSE: Full QuizPage flow — the gate for this phase.
 *
 * TEST CASES:
 *    ✓ loads quiz, answers all questions via non-linear navigation (jumping
 *      via QuizNavigation dots, not just sequential), submits, sees PASS result
 *      with correct answer review
 *    ✓ FAIL flow: submit with a mocked failing score -> sees FAIL result ->
 *      click Retry -> question flow fully resets (answers cleared, back to
 *      question 1) -> can answer again and re-submit successfully
 *    ✓ Submit button remains disabled until every question has an answer
 *    ✓ confirmation modal appears before actual submission fires
 *    ✓ passing the quiz -> assert (at minimum via a spy/mock on
 *      queryClient.invalidateQueries, or by checking a related cached query's
 *      staleness) that the SAME cross-feature invalidation chain as Phase 5
 *      fires correctly
 *    ✓ non-enrolled user visiting the quiz URL directly is redirected to
 *      course details, never sees quiz content
 *
 * ⚠️ GATE: Phase 6 complete only once quizApi (security smoke test),
 * useQuiz/useSubmitQuiz (unit), QuizQuestion/SubmitQuizButton/QuizResultScreen
 * (component), and this integration file all pass — with SPECIAL attention to
 * the "no is_correct leaked" test and the pass-vs-fail invalidation branching
 * test, since those two protect this phase's most important architectural
 * decisions (server-side grading security, and correct progress-tracking
 * semantics).
 */
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import { QuizPage } from "../pages/QuizPage";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "student",
};

// snake_case fields — matches the real shape quizApi's select() produces.
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

// POST-submission shapes (only safe to reveal AFTER the RPC grades server-side).
const PASS_RESULT = {
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

const FAIL_RESULT = {
  ...PASS_RESULT,
  score: 50,
  passed: false,
  correctAnswers: 1,
  answerBreakdown: [
    PASS_RESULT.answerBreakdown[0],
    {
      ...PASS_RESULT.answerBreakdown[1],
      selectedAnswer: "A CSS framework",
      isCorrect: false,
    },
  ],
};

// Mutable "server" state behind the MSW handlers.
let db = {
  enrolled: true,
  mode: "pass",
  rpcCalls: 0,
  rpcBodies: [],
};

function resetDb(overrides = {}) {
  db = { enrolled: true, mode: "pass", rpcCalls: 0, rpcBodies: [], ...overrides };
}

function registerHandlers() {
  server.use(
    // enrollments — useEnrollmentStatus (access control). maybeSingle:
    // array -> first row, or [] -> null (not enrolled).
    http.get("*/rest/v1/enrollments", () => {
      if (!db.enrolled) return HttpResponse.json([]);
      return HttpResponse.json([
        {
          id: "enr-1",
          course_id: QUIZ.module.course_id,
          user_id: mockUser.id,
          progress_percent: 0,
          last_lesson_id: null,
          last_accessed_at: "2026-02-01T09:00:00.000Z",
          enrolled_at: "2026-01-05T09:00:00.000Z",
        },
      ]);
    }),

    // quizzes (useQuiz) — .single() returns the object directly.
    http.get("*/rest/v1/quizzes", () => HttpResponse.json(QUIZ)),

    // submit_quiz_attempt RPC (useSubmitQuiz) — grading happens "server-side":
    // the handler picks pass/fail based on the live db.mode.
    http.post("*/rest/v1/rpc/submit_quiz_attempt", async ({ request }) => {
      const body = await request.json();
      db.rpcCalls += 1;
      db.rpcBodies.push(body);
      return HttpResponse.json(db.mode === "fail" ? FAIL_RESULT : PASS_RESULT);
    })
  );
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
}

function renderQuizPage(route, queryClient) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/learn/:courseId/quiz/:quizId" element={<QuizPage />} />
        <Route path="/learn/:courseId" element={<p>Learning Page</p>} />
        <Route path="/courses/:id" element={<p>Course Details Page</p>} />
      </Routes>
      <LocationProbe />
    </>,
    {
      preloadedState: { auth: { user: mockUser, isLoading: false } },
      route,
      queryClient,
    }
  );
}

async function answerAllQuestions(user) {
  await user.click(screen.getByRole("radio", { name: "A UI library" }));
  await user.click(screen.getByRole("button", { name: "Question 2" }));
  await user.click(screen.getByRole("radio", { name: "A syntax extension" }));
}

async function submitThroughModal(user) {
  await user.click(screen.getByRole("button", { name: /submit quiz/i }));
  await screen.findByRole("dialog");
  await user.click(screen.getByRole("button", { name: /confirm/i }));
}

describe("QuizPage (integration)", () => {
  it("full PASS flow: non-linear navigation, submit via modal, pass result with answer review, Continue", async () => {
    resetDb({ mode: "pass" });
    registerHandlers();
    const user = userEvent.setup();
    renderQuizPage("/learn/course-1/quiz/quiz-1", createQueryClient());

    // ---- quiz loads ----
    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();
    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /submit quiz/i });
    expect(submitButton).toBeDisabled();

    // ---- answer q1, then jump NON-LINEARLY to q2 and back ----
    await user.click(screen.getByRole("radio", { name: "A UI library" }));
    expect(submitButton).toBeDisabled(); // q2 still unanswered

    await user.click(screen.getByRole("button", { name: "Question 2" }));
    expect(screen.getByText("What is JSX?")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Question 1" }));
    expect(screen.getByText("What is React?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Question 2" }));
    await user.click(screen.getByRole("radio", { name: "A syntax extension" }));
    expect(submitButton).toBeEnabled();
    expect(
      screen.queryByText("Answer all questions to submit")
    ).not.toBeInTheDocument();

    // ---- submission gated behind the confirmation modal ----
    await user.click(submitButton);
    await screen.findByRole("dialog");
    expect(db.rpcCalls).toBe(0);

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // ---- PASS result with correct answer review ----
    expect(await screen.findByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2/2 correct")).toBeInTheDocument();
    expect(screen.getAllByText("\u2713")).toHaveLength(2);
    expect(screen.queryByText("\u2717")).not.toBeInTheDocument();

    // ---- Continue navigates back to the learning page ----
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/learn/course-1")
    );
    expect(screen.getByText("Learning Page")).toBeInTheDocument();
  });

  it("FAIL flow: fail result -> Retry fully resets the flow -> re-submit passes", async () => {
    resetDb({ mode: "fail" });
    registerHandlers();
    const user = userEvent.setup();
    renderQuizPage("/learn/course-1/quiz/quiz-1", createQueryClient());

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "A UI library" }));
    await user.click(screen.getByRole("button", { name: "Question 2" }));
    await user.click(screen.getByRole("radio", { name: "A CSS framework" }));

    await submitThroughModal(user);

    // ---- FAIL result surface ----
    expect(await screen.findByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1/2 correct")).toBeInTheDocument();
    expect(screen.getAllByText("\u2713")).toHaveLength(1);
    expect(screen.getAllByText("\u2717")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /retry quiz/i })
    ).toBeInTheDocument();

    // ---- Retry: question flow resets to question 1 with cleared answers ----
    await user.click(screen.getByRole("button", { name: /retry quiz/i }));

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();
    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit quiz/i })).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: "A UI library" })
    ).not.toBeChecked();

    // ---- re-attempt gets a better (passing) score ----
    db.mode = "pass";
    await answerAllQuestions(user);
    await submitThroughModal(user);

    expect(await screen.findByText("Passed")).toBeInTheDocument();
  });

  it("Submit button stays disabled until every question has an answer", async () => {
    resetDb();
    registerHandlers();
    const user = userEvent.setup();
    renderQuizPage("/learn/course-1/quiz/quiz-1", createQueryClient());

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /submit quiz/i });
    expect(submitButton).toBeDisabled();

    // q1 answered only
    await user.click(screen.getByRole("radio", { name: "A UI library" }));
    expect(submitButton).toBeDisabled();

    // q2 answered too
    await user.click(screen.getByRole("button", { name: "Question 2" }));
    await user.click(screen.getByRole("radio", { name: "A syntax extension" }));
    expect(submitButton).toBeEnabled();

    // changing an already-answered answer keeps it enabled
    await user.click(screen.getByRole("button", { name: "Question 1" }));
    await user.click(screen.getByRole("radio", { name: "A database" }));
    expect(submitButton).toBeEnabled();
  });

  it("confirmation modal appears BEFORE the submission actually fires; cancel does not submit", async () => {
    resetDb({ mode: "pass" });
    registerHandlers();
    const user = userEvent.setup();
    renderQuizPage("/learn/course-1/quiz/quiz-1", createQueryClient());

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();

    await answerAllQuestions(user);
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    // dialog is up, but NO submit RPC has fired yet
    await screen.findByRole("dialog");
    expect(db.rpcCalls).toBe(0);

    // canceling does NOT submit
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(db.rpcCalls).toBe(0);

    // submit again — this time confirm -> exactly one RPC, then pass result
    await submitThroughModal(user);
    expect(await screen.findByText("Passed")).toBeInTheDocument();
    expect(db.rpcCalls).toBe(1);
    expect(db.rpcBodies[0].p_quiz_id).toBe("quiz-1");
    expect(db.rpcBodies[0].p_answers).toHaveLength(2);
    expect(db.rpcBodies[0].p_answers[0]).toEqual({
      questionId: "q-1",
      selectedOptionId: "opt-1-1",
    });
  });

  it("passing the quiz triggers the SAME cross-feature invalidation chain as Phase 5", async () => {
    resetDb({ mode: "pass" });
    registerHandlers();
    const user = userEvent.setup();
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderQuizPage("/learn/course-1/quiz/quiz-1", queryClient);

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals Quiz" })
    ).toBeInTheDocument();

    await answerAllQuestions(user);
    await submitThroughModal(user);

    expect(await screen.findByText("Passed")).toBeInTheDocument();

    // Same three query families Mark Complete invalidates — using the
    // explicitly-passed courseId.
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["courseProgress", "course-1"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["enrollment", "course-1", mockUser.id],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["myEnrollments"] });
  });

  it("ACCESS CONTROL: non-enrolled user visiting the quiz URL is redirected to course details", async () => {
    resetDb({ enrolled: false });
    registerHandlers();
    renderQuizPage("/learn/course-1/quiz/quiz-1", createQueryClient());

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/courses/course-1"
      )
    );
    expect(screen.getByText("Course Details Page")).toBeInTheDocument();

    // Quiz content is never served to unenrolled users.
    expect(
      screen.queryByRole("heading", { name: "React Fundamentals Quiz" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});