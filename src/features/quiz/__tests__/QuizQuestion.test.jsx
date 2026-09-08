/**
 * FILE: src/features/quiz/__tests__/QuizQuestion.test.jsx
 * TEST CASES:
 *    ✓ renders question text and all options
 *    ✓ clicking an option calls onSelect with correct option id
 *    ✓ selected option shows selected styling
 *    ✓ only one option shows as selected at a time
 */
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { QuizQuestion } from "../components/QuizQuestion";

const QUESTION = {
  id: "q-1",
  questionText: "What is React?",
  options: [
    { id: "opt-1", optionText: "A UI library" },
    { id: "opt-2", optionText: "A database" },
    { id: "opt-3", optionText: "A programming language" },
  ],
};

function renderQuestion(props = {}) {
  return render(
    <QuizQuestion
      question={QUESTION}
      selectedOptionId={null}
      onSelect={vi.fn()}
      {...props}
    />
  );
}

function optionLabel(name) {
  // The sr-only radio's accessible name comes from its wrapping label.
  return screen.getByRole("radio", { name }).closest("label");
}

describe("QuizQuestion", () => {
  it("renders the question text and all options", () => {
    renderQuestion();

    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "A UI library" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "A database" })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "A programming language" })
    ).toBeInTheDocument();
  });

  it("clicking an option calls onSelect with the correct option id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderQuestion({ onSelect });

    await user.click(screen.getByRole("radio", { name: "A database" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("opt-2");
  });

  it("selected option shows the selected styling", () => {
    renderQuestion({ selectedOptionId: "opt-1" });

    expect(screen.getByRole("radio", { name: "A UI library" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "A database" })).not.toBeChecked();

    const label = optionLabel("A UI library");
    expect(label).toHaveClass("border-apple-blue");
    expect(optionLabel("A database")).not.toHaveClass("border-apple-blue");
  });

  it("only one option shows as selected at a time", () => {
    const { rerender } = renderQuestion({ selectedOptionId: "opt-1" });

    expect(screen.getByRole("radio", { name: "A UI library" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "A database" })).not.toBeChecked();

    rerender(
      <QuizQuestion
        question={QUESTION}
        selectedOptionId="opt-2"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("radio", { name: "A database" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "A UI library" })).not.toBeChecked();

    const selectedLabels = document.querySelectorAll("label.border-apple-blue");
    expect(selectedLabels).toHaveLength(1);
  });
});