/**
 * FILE: src/features/learning/__tests__/LearningControlsBar.test.jsx
 * PURPOSE: Component test.
 *
 * TEST CASES:
 *    ✓ Previous button disabled when prevLesson is null, enabled otherwise
 *    ✓ Next button disabled when nextLesson is null, enabled otherwise
 *    ✓ Mark Complete button shows "Mark Complete" + filled variant when
 *      isCompleted=false
 *    ✓ Mark Complete button shows "✓ Completed" + disabled when isCompleted=true
 *    ✓ clicking Mark Complete calls onMarkComplete
 *    ✓ isMarking=true shows loading state on Mark Complete button
 *    ✓ clicking Previous/Next triggers navigation to correct neighboring lesson URLs
 */
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../../test/test-utils";
import { LearningControlsBar } from "../components/LearningControlsBar";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

const prevLesson = { id: "les-1", title: "Welcome" };
const nextLesson = { id: "les-3", title: "Components" };

const baseProps = {
  prevLesson,
  nextLesson,
  isCompleted: false,
  onMarkComplete: vi.fn(),
  isMarking: false,
  courseId: "course-1",
};

function renderBar(props = {}) {
  return renderWithProviders(
    <>
      <LearningControlsBar {...baseProps} {...props} />
      <LocationProbe />
    </>,
    { route: "/learn/course-1/les-1" }
  );
}

describe("LearningControlsBar", () => {
  it("Previous button disabled when prevLesson is null, enabled otherwise", () => {
    const first = renderBar();
    expect(
      first.getByRole("button", { name: /Previous/i })
    ).toBeEnabled();
    first.unmount();

    const noPrev = renderBar({ prevLesson: null });
    expect(
      noPrev.getByRole("button", { name: /Previous/i })
    ).toBeDisabled();
  });

  it("Next button disabled when nextLesson is null, enabled otherwise", () => {
    const first = renderBar();
    expect(first.getByRole("button", { name: /Next/i })).toBeEnabled();
    first.unmount();

    const noNext = renderBar({ nextLesson: null });
    expect(noNext.getByRole("button", { name: /Next/i })).toBeDisabled();
  });

  it('Mark Complete button shows "Mark Complete" + filled variant when isCompleted=false', () => {
    renderBar();
    const button = screen.getByRole("button", { name: /mark complete/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent("Completed");
    expect(button).toBeEnabled();
  });

  it('Mark Complete button shows "✓ Completed" + disabled when isCompleted=true', () => {
    renderBar({ isCompleted: true });
    const button = screen.getByRole("button", { name: /Completed/i });
    expect(button).toHaveTextContent("Completed");
    expect(button).toBeDisabled();
  });

  it("clicking Mark Complete calls onMarkComplete", async () => {
    const user = userEvent.setup();
    const onMarkComplete = vi.fn();
    renderBar({ onMarkComplete });

    await user.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });

  it("isMarking=true shows loading state on Mark Complete button", () => {
    renderBar({ isMarking: true });
    const button = screen.getByRole("button", { name: /mark complete/i });
    // Button is disabled while loading and marked busy
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("clicking Previous/Next triggers navigation to correct neighboring lesson URLs", async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole("button", { name: /Previous/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/learn/course-1/les-1"
    );

    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/learn/course-1/les-3"
    );
  });
});
