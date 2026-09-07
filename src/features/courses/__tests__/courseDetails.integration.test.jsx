/**
 * Full CourseDetailsPage integration test — the Phase 3 gate. Ties together the
 * detail fetch, enrollment-status cache, curriculum lock/unlock, and related
 * courses, and proves the two UI areas (curriculum + CTA) BOTH react to the
 * single enrollment-status cache invalidation after a successful enroll.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import { buildCourse } from "../../../test/factories";
import { CourseDetailsPage } from "../pages/CourseDetailsPage";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "student",
};

const COURSE = {
  id: "course-1",
  title: "React Fundamentals",
  shortDescription: "Learn React from scratch",
  description: "Build modern UIs with components, state, and effects.",
  thumbnailUrl: "https://cdn.example.com/react.jpg",
  instructorName: "Ada Lovelace",
  rating: 4.7,
  studentCount: 1200,
  category: "Development",
  learningOutcomes: ["Build apps in React"],
  instructor: {
    id: "inst-1",
    name: "Ada Lovelace",
    bio: "Pioneer of reactive UX.",
    avatar_url: null,
  },
  modules: [
    {
      id: "m1",
      title: "Getting Started",
      order: 1,
      lessons: [
        { id: "l1", title: "Welcome to React", order: 1, duration_minutes: 10, is_preview: true },
        { id: "l2", title: "Setting Up Vite", order: 2, duration_minutes: 15, is_preview: false },
      ],
    },
  ],
};

const RELATED_COURSE = buildCourse(1, { title: "Advanced React Patterns" });

const ROW_45 = {
  id: "enr-1",
  course_id: "course-1",
  user_id: "user-1",
  progress_percent: 45,
};
const ROW_0 = { ...ROW_45, progress_percent: 0 };

function authState(user = null) {
  return { auth: { user, isLoading: false } };
}

/**
 * The page issues TWO different GETs to /courses from one component tree:
 * the detail query (id=eq.X, no category) and the related query
 * (category=eq.X + id=neq.X). Dispatch on the presence of the `category` param.
 */
function registerCoursesApi({ detail, related = () => HttpResponse.json([]) }) {
  server.use(
    http.get("*/rest/v1/courses", ({ request }) => {
      const searchParams = new URL(request.url).searchParams;
      if (searchParams.has("category")) return related();
      return detail();
    })
  );
}

function renderPage(userState, initialEntries = "/courses/course-1") {
  // retryDelay 0 keeps the hook's one automatic retry fast enough for waitFor.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, retryDelay: 0 },
      mutations: { retry: 0 },
    },
  });
  return renderWithProviders(
    <Routes>
      <Route path="/courses/:id" element={<CourseDetailsPage />} />
      <Route path="/courses" element={<p>Courses Catalog Page</p>} />
      <Route path="/login" element={<p>Login Page</p>} />
    </Routes>,
    { preloadedState: userState, route: initialEntries, queryClient }
  );
}

async function openCurriculum(user) {
  await user.click(screen.getByRole("tab", { name: "Curriculum" }));
  await user.click(screen.getByRole("button", { name: /Getting Started/i }));
}

describe("CourseDetailsPage", () => {
  it("renders a loading state first, then the full page once MSW resolves", async () => {
    const user = userEvent.setup();
    registerCoursesApi({
      detail: () => HttpResponse.json(COURSE),
      related: () => HttpResponse.json([RELATED_COURSE]),
    });
    renderPage(authState());

    expect(screen.getByText("Loading course details...")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals" })
    ).toBeInTheDocument();

    // Overview tab (default): description + learning outcomes.
    expect(screen.getByText(/Build modern UIs/)).toBeInTheDocument();
    expect(screen.getByText("What you'll learn")).toBeInTheDocument();
    expect(screen.getByText("Build apps in React")).toBeInTheDocument();

    // Curriculum tab: locked for guests (except previews), lessons hidden
    // until the module is expanded.
    await openCurriculum(user);
    expect(screen.getByText("Welcome to React")).toBeInTheDocument();
    expect(screen.getByText("Setting Up Vite")).toBeInTheDocument();
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
    expect(screen.getByText("Preview")).toBeInTheDocument();

    // Instructor tab.
    await user.click(screen.getByRole("tab", { name: "Instructor" }));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    // Related courses section present for the guest.
    await screen.findByText("You might also like");
    expect(
      screen.getByRole("heading", { name: "Advanced React Patterns" })
    ).toBeInTheDocument();
  });

  it("not-found id -> renders the distinct 'Course not found' state (not ErrorState) with a working catalog link", async () => {
    const user = userEvent.setup();
    registerCoursesApi({
      detail: () =>
        HttpResponse.json(
          {
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
            details: "The result contains 0 rows",
            hint: "",
          },
          { status: 406 }
        ),
    });
    renderPage(authState());

    expect(
      await screen.findByRole("heading", { name: "Course not found" })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Couldn't load this course")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Browse all courses" })
    );

    expect(await screen.findByText("Courses Catalog Page")).toBeInTheDocument();
  });

  it("generic server error -> ErrorState with retry; clicking Try again re-fetches and recovers", async () => {
    const user = userEvent.setup();
    let detailCalls = 0;
    registerCoursesApi({
      detail: () => {
        detailCalls += 1;
        if (detailCalls < 3) {
          return HttpResponse.json({ message: "boom" }, { status: 500 });
        }
        return HttpResponse.json(COURSE);
      },
    });
    renderPage(authState());

    expect(
      await screen.findByText("Couldn't load this course")
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(screen.queryByText("Course not found")).not.toBeInTheDocument();

    // Hook auto-retried once (hook-level retry overrides the test client
    // default of no retries), so initial error state consumed 2 requests.
    expect(detailCalls).toBe(2);

    await user.click(retry);

    expect(
      await screen.findByRole("heading", { name: "React Fundamentals" })
    ).toBeInTheDocument();
    expect(detailCalls).toBe(3);
  });

  it("guest full flow: locked curriculum (except previews) + 'Enroll Now' CTA navigates to login", async () => {
    const user = userEvent.setup();
    const enrollmentRequests = [];
    registerCoursesApi({ detail: () => HttpResponse.json(COURSE) });
    server.use(
      http.get("*/rest/v1/enrollments", () => {
        enrollmentRequests.push(1);
        return HttpResponse.json([]);
      })
    );
    renderPage(authState());

    await screen.findByRole("heading", { name: "React Fundamentals" });

    await openCurriculum(user);

    // Preview lesson: unlocked with Preview badge.
    const previewRow = screen.getByText("Welcome to React").closest("li");
    expect(previewRow).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Preview")).toBeInTheDocument();

    // Non-preview lesson: locked and not clickable.
    const lockedRow = screen.getByText("Setting Up Vite").closest("li");
    expect(lockedRow).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Locked")).toBeInTheDocument();

    const enrollBtn = screen.getByRole("button", { name: "Enroll Now" });
    await user.click(enrollBtn);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
    // Guests are 100% server-silent: the enrollment status is never fetched.
    expect(enrollmentRequests).toHaveLength(0);
  });

  it("authenticated + not enrolled: enrolling unlocks the curriculum AND flips the CTA (one cache invalidation)", async () => {
    const user = userEvent.setup();
    let enrolled = false;
    registerCoursesApi({
      detail: () => HttpResponse.json(COURSE),
      related: () => HttpResponse.json([]),
    });
    server.use(
      http.get("*/rest/v1/enrollments", () =>
        HttpResponse.json(enrolled ? [ROW_0] : [])
      ),
      http.post("*/rest/v1/enrollments", async ({ request }) => {
        enrolled = true;
        return HttpResponse.json({ id: "enr-1", ...(await request.json()) });
      })
    );
    renderPage(authState(mockUser));

    await screen.findByRole("heading", { name: "React Fundamentals" });
    await openCurriculum(user);

    // Locked before enrolling.
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText("Welcome to React").closest("li")).not.toHaveAttribute(
      "aria-disabled"
    );

    await user.click(screen.getByRole("button", { name: "Enroll Now" }));

    // CTA updates — this line alone proves the mutation -> invalidation ->
    // refetch -> re-render chain worked.
    expect(
      await screen.findByRole("button", { name: "Continue Learning (0%)" })
    ).toBeInTheDocument();

    // And the curriculum unlocked from the SAME invalidation, with no reload.
    await waitFor(() => expect(screen.queryByText("Locked")).not.toBeInTheDocument());
    expect(screen.getByText("Setting Up Vite").closest("li")).not.toHaveAttribute(
      "aria-disabled"
    );
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("authenticated + already enrolled: curriculum unlocked from initial render with progress shown in the CTA", async () => {
    const user = userEvent.setup();
    registerCoursesApi({ detail: () => HttpResponse.json(COURSE) });
    server.use(
      http.get("*/rest/v1/enrollments", () => HttpResponse.json([ROW_45]))
    );
    renderPage(authState(mockUser));

    expect(
      await screen.findByRole("button", { name: "Continue Learning (45%)" })
    ).toBeInTheDocument();

    await openCurriculum(user);

    expect(screen.queryByText("Locked")).not.toBeInTheDocument();
    expect(screen.getByText("Setting Up Vite").closest("li")).not.toHaveAttribute(
      "aria-disabled"
    );
  });

  it("renders related courses when present (non-empty array)", async () => {
    registerCoursesApi({
      detail: () => HttpResponse.json(COURSE),
      related: () => HttpResponse.json([RELATED_COURSE]),
    });
    renderPage(authState());

    await screen.findByRole("heading", { name: "React Fundamentals" });
    expect(await screen.findByText("You might also like")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Advanced React Patterns" })
    ).toBeInTheDocument();
  });

  it("omits the related-courses section entirely when MSW returns an empty array", async () => {
    const relatedRequests = [];
    registerCoursesApi({
      detail: () => HttpResponse.json(COURSE),
      related: () => {
        relatedRequests.push(1);
        return HttpResponse.json([]);
      },
    });
    renderPage(authState());

    await screen.findByRole("heading", { name: "React Fundamentals" });
    // Wait until the related query has actually been served, then assert the
    // section stayed absent (not just "still in flight").
    await waitFor(() => expect(relatedRequests).toHaveLength(1));
    expect(screen.queryByText("You might also like")).not.toBeInTheDocument();
  });
});