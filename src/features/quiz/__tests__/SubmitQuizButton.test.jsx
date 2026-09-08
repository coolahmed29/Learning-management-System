/**
 * FILE: src/features/quiz/__tests__/SubmitQuizButton.test.jsx
 * TEST CASES:
 *    ✓ disabled when allAnswered=false
 *    ✓ enabled when allAnswered=true, clicking opens confirmation modal
 *    ✓ confirming in modal calls onSubmit
 *    ✓ canceling in modal does NOT call onSubmit
 *    ✓ isSubmitting shows loading state on the button
 */
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { SubmitQuizButton } from "../components/SubmitQuizButton";

function renderButton(props = {}) {
  return renderWithProviders(
    <SubmitQuizButton
      allAnswered={false}
      onSubmit={vi.fn()}
      isSubmitting={false}
      {...props}
    />
  );
}

describe("SubmitQuizButton", () => {
  it("is disabled when allAnswered=false and shows the gating note", () => {
    renderButton({ allAnswered: false });

    const button = screen.getByRole("button", { name: /submit quiz/i });
    expect(button).toBeDisabled();
    expect(
      screen.getByText("Answer all questions to submit")
    ).toBeInTheDocument();
  });

  it("enabled when allAnswered=true; clicking opens the confirmation modal", async () => {
    const user = userEvent.setup();
    renderButton({ allAnswered: true });

    const button = screen.getByRole("button", { name: /submit quiz/i });
    expect(button).toBeEnabled();

    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Submit your quiz?");
    expect(dialog).toHaveTextContent(
      "You won't be able to change your answers."
    );
    expect(
      screen.getByRole("button", { name: /confirm/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("confirming in the modal calls onSubmit and closes the modal", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderButton({ allAnswered: true, onSubmit });

    await user.click(screen.getByRole("button", { name: /submit quiz/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Modal unmounts after its exit animation completes.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("canceling in the modal does NOT call onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderButton({ allAnswered: true, onSubmit });

    await user.click(screen.getByRole("button", { name: /submit quiz/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("isSubmitting shows the loading state on the button", () => {
    renderButton({ allAnswered: true, isSubmitting: true });

    const button = screen.getByRole("button", { name: /submit quiz/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});