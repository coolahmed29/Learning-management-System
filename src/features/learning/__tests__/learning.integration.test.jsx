/**
 * FILE: src/features/learning/__tests__/learning.integration.test.jsx
 * PURPOSE: THE major integration test for this phase — the most complex one in
 *          the project so far, since it validates a 3-phase-spanning cache
 *          invalidation chain end to end.
 *
 * TEST CASES:
 *    ✓ resume behavior: navigate to bare /learn/:courseId (no lessonId) with a
 *      mocked enrollment having a last_lesson_id -> redirects to that exact
 *      lesson's URL, content loads correctly
 *    ✓ resume behavior (no prior last_lesson_id, fresh enrollment) -> redirects
 *      to the FIRST lesson of the FIRST module
 *    ✓ direct lesson navigation: visiting /learn/:courseId/:lessonId loads that
 *      specific lesson without redirecting
 *    ✓ clicking Next in LearningControlsBar navigates to next lesson AND
 *      triggers updateLastAccessed (assert MSW call)
 *    ✓ clicking a DIFFERENT lesson in the sidebar navigates directly, bypassing
 *      Next/Previous order
 *    ✓ MARK COMPLETE FULL CHAIN (the single most important test in this file):
 *      click Mark Complete on current lesson -> assert ALL of the following
 *      update WITHOUT a page reload, in the same test:
 *        a) LearningControlsBar's button flips to "✓ Completed"
 *        b) CourseCurriculumSidebar shows a checkmark on that lesson
 *        c) ProgressIndicator's percentage value increases
 *      This single test proves the cross-query-key invalidation strategy
 *      documented in useMarkComplete actually delivers a correctly synced UI
 *      across three different components reading three related-but-distinct
 *      query caches.
 *    ✓ ACCESS CONTROL: a user with NO enrollment for this course, attempting
 *      to visit /learn/:courseId directly, is redirected to /courses/:courseId
 *      instead of seeing lesson content — this specifically tests the gap
 *      identified and closed in LearningPage's design
 *    ✓ end-of-course: on the LAST lesson of the LAST module, Next button is
 *      disabled (or shows whatever end-of-course UX was decided)
 *
 * ⚠️ GATE: Phase 5 complete only once useLessonContent/useCourseProgress/
 * useMarkComplete/useUpdateLastAccessed (unit), CourseCurriculumSidebar/
 * LearningControlsBar (component), and this integration file — INCLUDING the
 * Mark Complete full-chain test and the access-control test specifically —
 * all pass. Only then does Phase 6 (Quiz System) begin, which will need to
 * hook into this SAME progress/invalidation system when a module's quiz is
 * passed.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor, within } from "@testing-library/react";
import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import { LearningPage } from "../pages/LearningPage";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "student",
};

const COURSE = {
  id: "course-1",
  title: "React Fundamentals",
  modules: [
    {
      id: "mod-1",
      title: "Getting Started",
      order: 1,
      lessons: [
        { id: "les-1", title: "Welcome", order: 1, duration_minutes: 10, is_preview: true },
        { id: "les-2", title: "Setup", order: 2, duration_minutes: 15, is_preview: false },
      ],
    },
    {
      id: "mod-2",
      title: "Fundamentals",
      order: 2,
      lessons: [
        { id: "les-3", title: "Components", order: 1, duration_minutes: 20, is_preview: false },
      ],
    },
  ],
};

const LESSONS = {
  "les-1": {
    id: "les-1",
    title: "Welcome",
    description: "An introduction to this course.",
    content_type: "text",
    text_content: "Welcome to React Fundamentals.",
    resources: [],
    module: { course_id: "course-1", title: "Getting Started" },
  },
  "les-2": {
    id: "les-2",
    title: "Setup",
    description: "Get your environment ready.",
    content_type: "text",
    text_content: "Install your tooling and scaffold a project.",
    resources: [],
    module: { course_id: "course-1", title: "Getting Started" },
  },
  "les-3": {
    id: "les-3",
    title: "Components",
    description: "Build your first component.",
    content_type: "text",
    text_content: "Components are the building blocks of a React UI.",
    resources: [],
    module: { course_id: "course-1", title: "Fundamentals" },
  },
};

// Live, mutable "database" behind the MSW handlers — mirroring the real server
// so cross-query invalidation can actually change what the NEXT fetch returns
// (without that, the mark-complete chain could never prove itself).
let db = {
  enrolled: true,
  progressPercent: 0,
  lastLessonId: null,
  completedLessonIds: [],
};

let lastAccessedCalls = [];

function resetDb(overrides = {}) {
  db = {
    enrolled: true,
    progressPercent: 0,
    lastLessonId: null,
    completedLessonIds: [],
    ...overrides,
  };
  lastAccessedCalls = [];
}

function registerHandlers() {
  server.use(
    // getCourseById (courseProgress): id=eq.X + status=eq.published, .single()
    http.get("*/rest/v1/courses", ({ request }) => {
      const id = (new URL(request.url).searchParams.get("id") ?? "").replace("eq.", "");
      if (id === COURSE.id) return HttpResponse.json(COURSE);
      return HttpResponse.json(
        { code: "PGRST116", message: "JSON object requested, no rows returned", details: "", hint: "" },
        { status: 406 }
      );
    }),

    // lesson_progress (courseProgress): completed lesson ids for this user
    http.get("*/rest/v1/lesson_progress", () =>
      HttpResponse.json(db.completedLessonIds.map((id) => ({ lesson_id: id })))
    ),

    // enrollments — SHARED by useEnrollmentStatus (id, progress_percent) and
    // useCourseProgress (progress_percent, last_lesson_id). maybeSingle:
    // array -> first row, or [] -> null (not enrolled).
    http.get("*/rest/v1/enrollments", () => {
      if (!db.enrolled) return HttpResponse.json([]);
      return HttpResponse.json([
        {
          id: "enr-1",
          course_id: COURSE.id,
          user_id: mockUser.id,
          progress_percent: db.progressPercent,
          last_lesson_id: db.lastLessonId,
          last_accessed_at: "2026-02-01T09:00:00.000Z",
          enrolled_at: "2026-01-05T09:00:00.000Z",
        },
      ]);
    }),

    // lessons (lessonContent): .single() — returns the object directly
    http.get("*/rest/v1/lessons", ({ request }) => {
      const id = (new URL(request.url).searchParams.get("id") ?? "").replace("eq.", "");
      const lesson = LESSONS[id];
      if (!lesson) {
        return HttpResponse.json(
          { code: "PGRST116", message: "JSON object requested, no rows returned", details: "", hint: "" },
          { status: 406 }
        );
      }
      return HttpResponse.json(lesson);
    }),

    // mark_lesson_complete RPC (useMarkComplete) — mutate the shared db
    // (idempotent upsert: re-marking is fine) and bump progressPercent.
    http.post("*/rest/v1/rpc/mark_lesson_complete", async ({ request }) => {
      const body = await request.json();
      if (!db.completedLessonIds.includes(body.p_lesson_id)) {
        db.completedLessonIds.push(body.p_lesson_id);
      }
      const totalLessons = COURSE.modules.reduce(
        (count, module) => count + (module.lessons ?? []).length,
        0
      );
      db.progressPercent = Math.min(
        100,
        Math.round((db.completedLessonIds.length / totalLessons) * 100)
      );
      return HttpResponse.json(null);
    }),

    // PATCH enrollments — hit by useUpdateLastAccessed (has last_lesson_id)
    // and markLessonComplete's last_accessed_at touch (no last_lesson_id).
    http.patch("*/rest/v1/enrollments", async ({ request }) => {
      const body = await request.json();
      if (body.last_lesson_id) {
        lastAccessedCalls.push({ lessonId: body.last_lesson_id });
      }
      return HttpResponse.json([]);
    })
  );
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderLearningPage(route) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/learn/:courseId/:lessonId?" element={<LearningPage />} />
        <Route path="/courses/:id" element={<p>Course Details Page</p>} />
        <Route path="/my-learning" element={<p>My Learning Page</p>} />
      </Routes>
      <LocationProbe />
    </>,
    {
      preloadedState: { auth: { user: mockUser, isLoading: false } },
      route,
      queryClient,
    }
  );
}

describe("LearningPage (integration)", () => {
  it("resume behavior: bare /learn/:courseId redirects to last_lesson_id and loads that lesson", async () => {
    resetDb({ enrolled: true, progressPercent: 50, lastLessonId: "les-2" });
    registerHandlers();
    renderLearningPage("/learn/course-1");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/learn/course-1/les-2"
      )
    );
    expect(
      await screen.findByRole("heading", { name: "Setup" })
    ).toBeInTheDocument();
  });

  it("resume behavior (no last_lesson_id) redirects to the FIRST lesson of the FIRST module", async () => {
    resetDb({ enrolled: true, progressPercent: 0, lastLessonId: null });
    registerHandlers();
    renderLearningPage("/learn/course-1");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/learn/course-1/les-1"
      )
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome" })
    ).toBeInTheDocument();
  });

  it("direct lesson navigation loads that specific lesson without redirecting", async () => {
    resetDb({
      enrolled: true,
      progressPercent: 40,
      lastLessonId: "les-1",
      completedLessonIds: ["les-1"],
    });
    registerHandlers();
    renderLearningPage("/learn/course-1/les-3");

    expect(
      await screen.findByRole("heading", { name: "Components" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/learn/course-1/les-3"
    );
  });

  it("clicking Next navigates to next lesson AND triggers updateLastAccessed", async () => {
    resetDb({ enrolled: true, progressPercent: 0, lastLessonId: "les-1" });
    registerHandlers();
    const user = userEvent.setup();
    renderLearningPage("/learn/course-1/les-1");

    expect(
      await screen.findByRole("heading", { name: "Welcome" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/learn/course-1/les-2"
      )
    );
    expect(
      await screen.findByRole("heading", { name: "Setup" })
    ).toBeInTheDocument();

    // updateLastAccessed fired for the newly viewed lesson (no reload).
    await waitFor(() =>
      expect(lastAccessedCalls.some((call) => call.lessonId === "les-2")).toBe(
        true
      )
    );
  });

  it("clicking a DIFFERENT lesson in the sidebar navigates directly, bypassing Next/Previous order", async () => {
    resetDb({ enrolled: true, progressPercent: 0, lastLessonId: "les-1" });
    registerHandlers();
    const user = userEvent.setup();
    renderLearningPage("/learn/course-1/les-1");

    expect(
      await screen.findByRole("heading", { name: "Welcome" })
    ).toBeInTheDocument();

    // mod-2 ("Fundamentals") starts collapsed; expand it, then jump straight
    // to les-3 — skipping les-2 (the Next in line).
    await user.click(
      screen.getByRole("button", { name: /Fundamentals/i })
    );
    await screen.findByRole("button", { name: /Components/i });

    await user.click(screen.getByRole("button", { name: /Components/i }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/learn/course-1/les-3"
      )
    );
    expect(
      await screen.findByRole("heading", { name: "Components" })
    ).toBeInTheDocument();
  });

  it("MARK COMPLETE full chain: button flips, sidebar checkmark appears, progress% increases — all without a reload", async () => {
    resetDb({ enrolled: true, progressPercent: 0, lastLessonId: null });
    registerHandlers();
    const user = userEvent.setup();
    renderLearningPage("/learn/course-1/les-1");

    // ---- initial state ----
    expect(
      await screen.findByRole("heading", { name: "Welcome" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark Complete/i })).toBeEnabled();
    expect(screen.getByText("0% complete")).toBeInTheDocument();
    const welcomeBtnBefore = screen.getByRole("button", { name: /Welcome/i });
    expect(within(welcomeBtnBefore).queryByText("&check;")).not.toBeInTheDocument();

    // ---- act: mark the current lesson complete ----
    await user.click(screen.getByRole("button", { name: /Mark Complete/i }));

    // a) LearningControlsBar flips to "✓ Completed" and disables the button
    expect(
      await screen.findByRole("button", { name: /✓ Completed/i })
    ).toBeDisabled();

    // b) CourseCurriculumSidebar shows a checkmark on that lesson
    const welcomeBtnAfter = screen.getByRole("button", { name: /Welcome/i });
    expect(within(welcomeBtnAfter).getByText("&check;")).toBeInTheDocument();

    // c) ProgressIndicator's percentage increased (0 -> 33 for 1 of 3)
    expect(screen.getByText("33% complete")).toBeInTheDocument();
    expect(screen.queryByText("0% complete")).not.toBeInTheDocument();

    // Everything updated in place — the route never changed (no page reload).
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/learn/course-1/les-1"
    );
  });

  it("ACCESS CONTROL: unenrolled user on /learn/:courseId is redirected to /courses/:courseId", async () => {
    resetDb({ enrolled: false });
    registerHandlers();
    renderLearningPage("/learn/course-1");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/courses/course-1"
      )
    );
    expect(screen.getByText("Course Details Page")).toBeInTheDocument();
    // No lesson content / learning UI is ever served.
    expect(
      screen.queryByRole("button", { name: /Mark Complete/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Welcome" })
    ).not.toBeInTheDocument();
  });

  it("end-of-course: Next is disabled on the LAST lesson of the LAST module", async () => {
    resetDb({
      enrolled: true,
      progressPercent: 100,
      lastLessonId: "les-3",
      completedLessonIds: ["les-1", "les-2", "les-3"],
    });
    registerHandlers();
    renderLearningPage("/learn/course-1/les-3");

    expect(
      await screen.findByRole("heading", { name: "Components" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
    // The learner can still step back.
    expect(screen.getByRole("button", { name: /Previous/i })).toBeEnabled();
  });
});