/**
 * Full-page integration tests for /my-learning — the Phase 4 gate.
 *
 * The last test is the CRITICAL cross-phase one: enrolling in a NEW course via
 * Phase 3's useEnrollCourse mutation must refresh My Learning's list (via the
 * ['myEnrollments'] invalidate added to that hook's onSuccess) with NO manual
 * page reload. If it regresses, that invalidation is the first place to check.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { userEvent } from "@testing-library/user-event";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { useLocation } from "react-router-dom";
import authReducer from "../../../store/slices/authSlice";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import {
  createMyEnrollmentsHandler,
  createEnrollCourseHandler,
} from "../../../test/mocks/courseHandlers";
import { MyLearningPage } from "../pages/MyLearningPage";
import { useEnrollCourse } from "../hooks/useEnrollCourse";

const mockUser = { id: "user-1", email: "test@example.com", name: "Test User", role: "student" };

function authState(user = mockUser) {
  return { auth: { user, isLoading: false } };
}

// Enrollment rows in the RAW PostgREST shape getMyEnrollments returns
// (snake_case + nested course / instructor objects) — exercising the
// tolerant accessors in CourseProgressCard end-to-end.
function makeEnrollmentRow(id, courseId, title, instructor, progressPercent) {
  return {
    id,
    progress_percent: progressPercent,
    enrolled_at: "2026-01-05T09:00:00.000Z",
    last_accessed_at: progressPercent > 0 ? "2026-02-01T09:00:00.000Z" : null,
    course: {
      id: courseId,
      title,
      thumbnail_url: `https://cdn.example.com/${courseId}.jpg`,
      instructor: { name: instructor },
    },
  };
}

const rows = [
  makeEnrollmentRow("enr-1", "course-1", "React Fundamentals", "Instructor 1", 45),
  makeEnrollmentRow("enr-2", "course-2", "CSS Layout Mastery", "Instructor 2", 100),
];

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe("MyLearningPage (integration)", () => {
  it("loads and displays enrolled courses with correct progress", async () => {
    server.use(createMyEnrollmentsHandler({ rows }));

    renderWithProviders(<MyLearningPage />, {
      preloadedState: authState(),
      route: "/my-learning",
    });

    expect(await screen.findByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CSS Layout Mastery" })).toBeInTheDocument();
    expect(screen.getByText("45% complete")).toBeInTheDocument();
    expect(screen.getByText("100% complete")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });

  it("tab switching filters correctly across all 3 tabs (asserted via MSW request params)", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: (info) => requests.push(info) })
    );
    const user = userEvent.setup();

    renderWithProviders(<MyLearningPage />, {
      preloadedState: authState(),
      route: "/my-learning",
    });

    // Default tab: All -> no filter param, both courses visible.
    await screen.findByRole("heading", { name: "React Fundamentals" });
    expect(screen.getByRole("heading", { name: "CSS Layout Mastery" })).toBeInTheDocument();

    // In Progress -> lt.100, only the 45% course remains.
    await user.click(screen.getByRole("tab", { name: "In Progress" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "CSS Layout Mastery" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument();
    expect(requests).toContainEqual(expect.objectContaining({ progressFilter: "lt.100" }));

    // Completed -> eq.100, only the 100% course remains.
    await user.click(screen.getByRole("tab", { name: "Completed" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "React Fundamentals" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "CSS Layout Mastery" })).toBeInTheDocument();
    expect(requests).toContainEqual(expect.objectContaining({ progressFilter: "eq.100" }));

    // Back to All -> no filter param, both visible again.
    await user.click(screen.getByRole("tab", { name: "All" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "CSS Layout Mastery" })).toBeInTheDocument();
    expect(requests).toContainEqual(expect.objectContaining({ progressFilter: null }));
  });

  it("shows the empty state for a user with zero enrollments and 'Browse Courses' navigates to /courses", async () => {
    server.use(createMyEnrollmentsHandler({ rows: [] }));
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <MyLearningPage />
        <LocationProbe />
      </>,
      { preloadedState: authState(), route: "/my-learning" }
    );

    expect(await screen.findByText("No enrolled courses yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browse Courses" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/courses")
    );
  });

  it("shows the error state on failure and recovers via retry", async () => {
    server.use(
      http.get("*/rest/v1/enrollments", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );
    const user = userEvent.setup();

    renderWithProviders(<MyLearningPage />, {
      preloadedState: authState(),
      route: "/my-learning",
    });

    expect(
      await screen.findByRole("heading", { name: "Something went wrong" })
    ).toBeInTheDocument();

    // API recovers; retry refetches the SAME query key and now succeeds.
    server.use(createMyEnrollmentsHandler({ rows }));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Something went wrong" })).not.toBeInTheDocument();
  });

  it("CRITICAL: enrolling in a new course (useEnrollCourse) refreshes My Learning without a reload", async () => {
    // Shared, LIVE rows array: the GET list handler serves it, the POST
    // enrollment handler appends to it — mirroring the real database.
    const enrolled = [];
    server.use(
      createMyEnrollmentsHandler({ rows: enrolled }),
      createEnrollCourseHandler({
        mode: "success",
        onRequest: async (body) =>
          enrolled.push(
            makeEnrollmentRow(
              `enr-${enrolled.length + 1}`,
              body.course_id,
              "React Fundamentals",
              "Instructor 1",
              0
            )
          ),
      })
    );

    // Page and mutation share ONE QueryClient + ONE store so the invalidation
    // actually reaches the page's active query.
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: 0 },
      },
    });
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: authState(),
    });
    const wrapper = ({ children }) => (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>{children}</Provider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    renderWithProviders(<MyLearningPage />, {
      queryClient,
      store,
      route: "/my-learning",
    });

    expect(await screen.findByText("No enrolled courses yet")).toBeInTheDocument();

    // Enroll in a brand-new course the user was not in before.
    const { result } = renderHook(() => useEnrollCourse(), { wrapper });
    act(() => {
      result.current.mutate("course-new");
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The ['myEnrollments'] invalidation on success (no reload anywhere) makes
    // the page refetch and show the freshly enrolled course.
    expect(await screen.findByRole("heading", { name: "React Fundamentals" })).toBeInTheDocument();
    expect(screen.getByText("0% complete")).toBeInTheDocument();
    expect(screen.queryByText("No enrolled courses yet")).not.toBeInTheDocument();
  });
});