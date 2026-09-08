/**
 * FILE: src/features/learning/__tests__/CourseCurriculumSidebar.test.jsx
 * PURPOSE: Component test.
 *
 * TEST CASES:
 *    ✓ renders all modules and lessons
 *    ✓ current lesson has distinct "current" visual state
 *    ✓ completed lessons show checkmark based on completedLessonIds prop
 *    ✓ clicking a lesson navigates to correct /learn/:courseId/:lessonId URL
 *    ✓ module containing currentLessonId is expanded by default, others collapsed
 *    ✓ clicking a collapsed module's header expands it, revealing lessons
 */
import { describe, it, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../../test/test-utils";
import { CourseCurriculumSidebar } from "../components/CourseCurriculumSidebar";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

const modules = [
  {
    id: "mod-1",
    title: "Getting Started",
    order: 1,
    lessons: [
      { id: "les-1", title: "Welcome", order: 1 },
      { id: "les-2", title: "Setup", order: 2 },
    ],
  },
  {
    id: "mod-2",
    title: "Fundamentals",
    order: 2,
    lessons: [
      { id: "les-3", title: "Components", order: 1 },
      { id: "les-4", title: "State", order: 2 },
    ],
  },
];

const baseProps = {
  modules,
  completedLessonIds: new Set(["les-1"]),
  currentLessonId: "les-2",
  courseId: "course-1",
};

function renderSidebar(props = {}) {
  return renderWithProviders(
    <>
      <CourseCurriculumSidebar {...baseProps} {...props} />
      <LocationProbe />
    </>,
    { route: "/learn/course-1/les-2" }
  );
}

describe("CourseCurriculumSidebar", () => {
  it("renders all modules and lessons", () => {
    renderSidebar();

    expect(screen.getByRole("navigation", { name: /curriculum/i })).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("current lesson has distinct 'current' visual state", async () => {
    // currentLessonId = les-2 is in module 1 which expands by default
    renderSidebar();

    const currentLesson = screen.getByRole("button", { name: /Setup/i });
    expect(currentLesson).toHaveAttribute("aria-current", "true");
  });

  it("completed lessons show checkmark based on completedLessonIds prop", () => {
    renderSidebar();

    // les-1 is completed -> shows a checkmark element
    const completedLesson = screen.getByRole("button", { name: /Welcome/i });
    expect(completedLesson).not.toHaveAttribute("aria-current", "true");
    // The StatusIndicator renders a check character for completed lessons
    expect(within(completedLesson).getByText("&check;")).toBeInTheDocument();

    // les-2 is the CURRENT lesson (not completed) -> shows an arrow, not a check
    const currentLesson = screen.getByRole("button", { name: /Setup/i });
    expect(within(currentLesson).queryByText("&check;")).not.toBeInTheDocument();
  });

  it("clicking a lesson navigates to correct /learn/:courseId/:lessonId URL", async () => {
    const user = userEvent.setup();
    renderSidebar();

    expect(screen.getByTestId("location")).toHaveTextContent("/learn/course-1/les-2");

    await user.click(screen.getByRole("button", { name: /Setup/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/learn/course-1/les-2"
    );
  });

  it("module containing currentLessonId is expanded by default, others collapsed", () => {
    // currentLessonId = les-2 lives in mod-1 ("Getting Started")
    renderSidebar();

    // mod-1 expanded -> its lessons visible
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();

    // mod-2 ("Fundamentals") collapsed -> its lessons hidden
    expect(screen.queryByText("Components")).not.toBeInTheDocument();
    expect(screen.queryByText("State")).not.toBeInTheDocument();

    // mod-2 header aria-expanded=false
    expect(screen.getByRole("button", { name: /Fundamentals/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("clicking a collapsed module's header expands it, revealing lessons", async () => {
    const user = userEvent.setup();
    renderSidebar();

    // mod-2 initially collapsed
    expect(screen.queryByText("Components")).not.toBeInTheDocument();

    const fundamentalsHeader = screen.getByRole("button", { name: /Fundamentals/i });
    await user.click(fundamentalsHeader);

    expect(screen.getByRole("button", { name: /Fundamentals/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Components")).toBeInTheDocument();
    expect(screen.getByText("State")).toBeInTheDocument();
  });
});
