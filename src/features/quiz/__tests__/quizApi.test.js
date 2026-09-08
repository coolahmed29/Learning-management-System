/**
 * FILE: src/features/quiz/__tests__/quizApi.test.js
 * PURPOSE: Unit test — mainly a security-focused smoke test, since actual
 *          scoring logic lives server-side (RPC), not testable as frontend
 *          unit logic.
 *
 * TEST CASES:
 *    ✓ getQuiz's mocked response shape contains NO is_correct field anywhere
 *      in options (explicit safeguard test — if someone later changes the
 *      select() to accidentally include it, this test should catch that
 *      regression immediately)
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import { getQuiz } from "../api/quizApi";

// Mirrors the exact row shape quizApi's select() produces — options with NO
// is_correct key, because a taking-the-quiz client must never see the answer
// key.
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
  ],
};

describe("quizApi (security smoke test)", () => {
  it("getQuiz's request and response contain NO is_correct field anywhere", async () => {
    let capturedSelect = null;
    server.use(
      http.get("*/rest/v1/quizzes", ({ request }) => {
        capturedSelect = new URL(request.url).searchParams.get("select");
        return HttpResponse.json(QUIZ);
      })
    );

    const { data, error } = await getQuiz("quiz-1");

    expect(error).toBeNull();

    // The generated SQL select string must never request the answer key.
    expect(capturedSelect).toBeTruthy();
    expect(capturedSelect).not.toMatch(/is_correct/);
    // ...and it must request the display fields the quiz UI actually needs.
    expect(capturedSelect).toContain("option_text");
    expect(capturedSelect).toContain("question_text");

    // Defensive deep scan of the served payload too — catches a regression in
    // the mock or a future raw-`.select("*")` fallback.
    expect(JSON.stringify(data)).not.toContain("is_correct");
    expect(data.questions[0].options).toHaveLength(2);
    expect(data.questions[0].options[0].option_text).toBe("A UI library");
  });
});