/**
 * FILE: src/features/quiz/__tests__/QuizResultScreen.test.jsx
 * TEST CASES:
 *    ✓ passed=true -> shows pass badge, Continue button (not Retry)
 *    ✓ passed=false -> shows fail badge, Retry button (not Continue)
 *    ✓ renders correct score and correct/total count
 *    ✓ answer review shows ✓ for correct answers, ✗ for incorrect, per
 *      answerBreakdown data
 *    ✓ clicking Continue/Retry calls correct handler
 */
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { QuizResultScreen } from "../components/QuizResultScreen";

const passedResult = {
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

const failedResult = {
  score: 50,
  passed: false,
  correctAnswers: 1,
  totalQuestions: 2,
  answerBreakdown: [
    passedResult.answerBreakdown[0],
    {
      questionId: "q-2",
      questionText: "What is JSX?",
      selectedAnswer: "A CSS framework",
      correctAnswer: "A syntax extension",
      isCorrect: false,
    },
  ],
};

function renderResult(result, props = {}) {
  return renderWithProviders(
    <QuizResultScreen
      result={result ?? passedResult}
      onRetry={vi.fn()}
      onContinue={vi.fn()}
      {...props}
    />
  );
}

describe("QuizResultScreen", () => {
  it("passed=true shows pass badge and Continue button (not Retry)", () => {
    renderResult(passedResult);

    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("passed=false shows fail badge and Retry button (not Continue)", () => {
    renderResult(failedResult);

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry quiz/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue/i })
    ).not.toBeInTheDocument();
  });

  it("renders the correct score and correct/total count", () => {
    renderResult(failedResult);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1/2 correct")).toBeInTheDocument();
  });

  it("answer review shows ✓ for correct and ✗ for incorrect answers", () => {
    renderResult(failedResult);

    expect(screen.getByText(/What is React\?/)).toBeInTheDocument();
    expect(screen.getByText(/What is JSX\?/)).toBeInTheDocument();

    expect(screen.getAllByText("\u2713")).toHaveLength(1);
    expect(screen.getAllByText("\u2717")).toHaveLength(1);

    // The review lists BOTH questions' answer rows — find the wrong one by its
    // revealed answer content.
    const wrongYourAnswer = screen
      .getAllByText(/your answer/i)
      .find((row) => row.textContent.includes("A CSS framework"));
    expect(wrongYourAnswer).toBeTruthy();
    expect(wrongYourAnswer.textContent).toContain("A CSS framework");

    const wrongCorrectAnswer = screen
      .getAllByText(/correct answer/i)
      .find((row) => row.textContent.includes("A syntax extension"));
    expect(wrongCorrectAnswer).toBeTruthy();
    expect(wrongCorrectAnswer).toHaveTextContent(
      "Correct answer: A syntax extension"
    );
  });

  it("clicking Continue/Retry calls the correct handler", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onRetry = vi.fn();

    renderResult(passedResult, { onContinue, onRetry });
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();

    renderResult(failedResult, { onContinue, onRetry });
    await user.click(screen.getByRole("button", { name: /retry quiz/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});