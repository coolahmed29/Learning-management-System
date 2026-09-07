/**
 * Hook-level tests for useCourseDetails via renderHook + MSW, with special
 * focus on the not-found vs generic-error distinction — the trickiest part of
 * the hook, since CourseDetailsPage branches on it. The no-rows case is mocked
 * as PostgREST's 406/PGRST116, which .single() surfaces as a real error object
 * with code === 'PGRST116'.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../../test/mocks/server";
import { createCourseDetailHandler } from "../../../test/mocks/courseHandlers";
import { NotFoundError } from "../../../lib/errors";
import { useCourseDetails } from "../hooks/useCourseDetails";

const fullCourse = buildFullCourse();

function buildFullCourse() {
  return {
    id: "course-1",
    title: "React Fundamentals",
    description: "Description for React Fundamentals",
    thumbnailUrl: "https://cdn.example.com/1.jpg",
    instructorName: "Instructor 1",
    rating: 4.5,
    studentCount: 437,
    difficulty: "Beginner",
    category: "Development",
    price: 22.49,
    isFree: false,
    status: "published",
    instructor: {
      id: "inst-1",
      name: "Ada Lovelace",
      bio: "Pioneer of computing.",
      avatar_url: null,
    },
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
    ],
  };
}

function renderCourseDetails(courseId) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, retryDelay: 0 },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  // useCourseDetails takes courseId directly — pass it as the hook's prop.
  return renderHook((props) => useCourseDetails(props), {
    wrapper,
    initialProps: courseId,
  });
}

function useDefaultHandler(calls = []) {
  server.use(
    createCourseDetailHandler({
      course: fullCourse,
      expectedId: "course-1",
      onRequest: (id) => calls.push(id),
    })
  );
  return calls;
}

describe("useCourseDetails", () => {
  it("returns the full course incl. nested instructor + modules/lessons on success", async () => {
    useDefaultHandler();
    const { result } = renderCourseDetails("course-1");

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(fullCourse);
    expect(result.current.data.instructor.name).toBe("Ada Lovelace");
    expect(result.current.data.modules[0].lessons).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });

  it("throws a NotFoundError with the not-found message, not a generic error, when no row matches", async () => {
    useDefaultHandler();
    const { result } = renderCourseDetails("missing-course");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(NotFoundError);
    expect(result.current.error.message).toBe("Course not found");
  });

  it("surfaces the generic 'Failed to load course' message on a server error", async () => {
    server.use(
      http.get("*/rest/v1/courses", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );
    const { result } = renderCourseDetails("course-1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Failed to load course");
    expect(result.current.error).not.toBeInstanceOf(NotFoundError);
  });

  it("does NOT retry a not-found course (handler called exactly once)", async () => {
    const calls = useDefaultHandler();
    const { result } = renderCourseDetails("missing-course");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(calls).toEqual(["missing-course"]);
    expect(result.current.error).toBeInstanceOf(NotFoundError);
  });

  it("retries exactly once on a genuine server error (original + 1 retry)", async () => {
    let calls = 0;
    server.use(
      http.get("*/rest/v1/courses", () => {
        calls += 1;
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      })
    );
    const { result } = renderCourseDetails("course-1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(calls).toBe(2);
    expect(result.current.error.message).toBe("Failed to load course");
  });

  it("does not fire at all when courseId is undefined (enabled: false)", async () => {
    const calls = useDefaultHandler();
    const { result } = renderCourseDetails(undefined);

    expect(result.current.isLoading).toBe(false);
    expect(calls).toHaveLength(0);
  });
});