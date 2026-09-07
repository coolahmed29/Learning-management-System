/**
 * Component tests for CourseProgressCard (which composes the ProgressBar UI
 * primitive). Covers the progress display (title/instructor/percentage + bar
 * fill width), the Continue-vs-Review button label threshold at 100%, and the
 * whole-card click navigation to /learn/:courseId.
 */
import { describe, it, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { Route, Routes, useParams } from "react-router-dom";
import { renderWithProviders } from "../../../test/test-utils";
import { CourseProgressCard } from "../components/CourseProgressCard";

const enrollment = {
  id: "enr-1",
  progressPercent: 45,
  course: {
    id: "course-1",
    title: "React Fundamentals",
    thumbnailUrl: "https://cdn.example.com/course-1.jpg",
    instructorName: "Instructor 1",
  },
};

function LearnRouteProbe() {
  const { courseId } = useParams();
  return <div>LEARN:{courseId}</div>;
}

describe("CourseProgressCard", () => {
  it("renders course title, instructor, and progress percentage correctly", () => {
    renderWithProviders(<CourseProgressCard enrollment={enrollment} />);

    expect(
      screen.getByRole("heading", { name: "React Fundamentals", level: 3 })
    ).toBeInTheDocument();
    expect(screen.getByText("Instructor 1")).toBeInTheDocument();
    expect(screen.getByText("45% complete")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
  });

  it("progress bar fill width matches progressPercent", () => {
    renderWithProviders(<CourseProgressCard enrollment={enrollment} />);

    const bar = screen.getByRole("progressbar");
    expect(bar.firstChild).toHaveStyle({ width: "45%" });
  });

  it("renders 'Continue' when progressPercent is below 100", () => {
    renderWithProviders(<CourseProgressCard enrollment={enrollment} />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review" })).not.toBeInTheDocument();
  });

  it("renders 'Review' when progressPercent is exactly 100", () => {
    renderWithProviders(
      <CourseProgressCard
        enrollment={{ ...enrollment, progressPercent: 100 }}
      />
    );

    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.getByText("100% complete")).toBeInTheDocument();
  });

  it("clicking the card navigates to /learn/{course.id}", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<CourseProgressCard enrollment={enrollment} />} />
        <Route path="/learn/:courseId" element={<LearnRouteProbe />} />
      </Routes>,
      { route: "/" }
    );

    // The whole Card is interactive (renders as a <button>); its accessible name
    // is the concatenated card content.
    await user.click(
      screen.getByRole("button", { name: /React Fundamentals/ })
    );

    expect(await screen.findByText("LEARN:course-1")).toBeInTheDocument();
  });
});