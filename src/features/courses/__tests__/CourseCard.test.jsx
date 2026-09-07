/**
 * Component test for the core discovery unit: CourseCard. Renders via
 * renderWithProviders (real ThemeProvider + MemoryRouter — no network needed).
 */
import { describe, it, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../../test/test-utils";
import { CourseCard } from "../components/CourseCard";
import { buildCourse } from "../../../test/factories";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

const baseCourse = buildCourse(0, {
  title: "React Fundamentals",
  instructorName: "Ada Lovelace",
  rating: 4.8,
  studentCount: 2500,
  difficulty: "Beginner",
  price: 99,
  isFree: false,
  thumbnailUrl: "https://cdn.example.com/react.jpg",
});

describe("CourseCard", () => {
  it("renders title, instructor name, rating, and student count from the course prop", () => {
    renderWithProviders(<CourseCard course={baseCourse} />);

    expect(
      screen.getByRole("heading", { name: "React Fundamentals" })
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("2.5k students")).toBeInTheDocument();
  });

  it("renders difficulty badge with the correct label", () => {
    renderWithProviders(<CourseCard course={baseCourse} />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("renders a Free badge and no price when isFree is true", () => {
    renderWithProviders(
      <CourseCard course={{ ...baseCourse, isFree: true }} />
    );

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("$99.00")).not.toBeInTheDocument();
  });

  it("renders the formatted price when isFree is false", () => {
    renderWithProviders(<CourseCard course={baseCourse} />);
    expect(screen.getByText("$99.00")).toBeInTheDocument();
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
  });

  it("navigates to /courses/{id} when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CourseCard course={buildCourse(3, { title: "Python for Data Science" })} />
        <LocationProbe />
      </>,
      { route: "/courses" }
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/courses");

    await user.click(
      screen.getByRole("link", { name: /Python for Data Science/i })
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/courses/course-4");
  });

  it("renders a placeholder instead of a broken image when thumbnailUrl is missing", () => {
    const { container } = renderWithProviders(
      <CourseCard course={{ ...baseCourse, thumbnailUrl: null }} />
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument();
  });
});