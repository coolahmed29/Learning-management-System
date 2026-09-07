/**
 * Hook-level tests for useCourses via renderHook + MSW. The dynamic courses
 * handler reads real Supabase query params (search/category/difficulty/order)
 * and the Range header, so these tests assert real filtering behavior — not
 * just "a request was made."
 */
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../../test/mocks/server";
import { createCoursesHandler } from "../../../test/mocks/courseHandlers";
import { buildCourseCatalog } from "../../../test/factories";
import { useCourses } from "../hooks/useCourses";

const LIMIT = 12;
const baseOptions = { page: 1, limit: LIMIT, search: "", category: null, difficulty: null, sortBy: null };

const requests = [];
function record({ url, order, range, start, end }) {
  requests.push({ url: url.toString(), order, range, start, end });
}

function renderUseCourses(options = baseOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook((props) => useCourses(props), {
    wrapper,
    initialProps: options,
  });
}

describe("useCourses", () => {
  beforeEach(() => {
    requests.length = 0;
    server.use(createCoursesHandler({ onRequest: record }));
  });

  it("returns the full first page and correct totalCount with no filters", async () => {
    const { result } = renderUseCourses();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.courses).toHaveLength(LIMIT);
    expect(result.current.data.courses[0].id).toBe("course-1");
    expect(result.current.data.totalCount).toBe(30);
    expect(requests).toHaveLength(1);
  });

  it("passes search to the request and returns the matching subset", async () => {
    const { result } = renderUseCourses({ ...baseOptions, search: "react" });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.courses.map((c) => c.title)).toEqual([
      "React Fundamentals",
      "Advanced React Patterns",
      "React Native Essentials",
      "Testing React Apps",
    ]);
    expect(result.current.data.totalCount).toBe(4);
    expect(requests[0].url).toContain("title=ilike."); // *react* encoded
    expect(requests[0].url).toContain("react");
  });

  it("returns the subset for a category/difficulty combination", async () => {
    const { result } = renderUseCourses({
      ...baseOptions,
      category: "Development",
      difficulty: "Advanced",
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const titles = result.current.data.courses.map((c) => c.title);
    expect(titles).toEqual([
      "Advanced React Patterns",
      "TypeScript in Depth",
      "SQL Query Masterclass",
      "GraphQL Patterns",
    ]);
    expect(result.current.data.totalCount).toBe(4);
    expect(requests[0].url).toContain("category=eq.");
    expect(requests[0].url).toContain("difficulty=eq.");
  });

  it("sends the correct order clause for each sortBy value", async () => {
    const { result, rerender } = renderUseCourses({
      ...baseOptions,
      sortBy: "newest",
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(requests[0].order).toEqual({ column: "created_at", ascending: false });

    rerender({ ...baseOptions, sortBy: "rating" });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(requests[1].order).toEqual({ column: "rating", ascending: false });

    rerender({ ...baseOptions, sortBy: "shortest" });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(requests[2].order).toEqual({
      column: "duration_minutes",
      ascending: true,
    });

    rerender({ ...baseOptions, sortBy: "longest" });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(requests[3].order).toEqual({
      column: "duration_minutes",
      ascending: false,
    });

    rerender({ ...baseOptions, sortBy: "unknown" });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(requests[4].order).toBeNull();
  });

  it("keeps the previous page visible (isPlaceholderData) while the next page loads", async () => {
    let releaseSecondPage;
    const secondPageGate = new Promise((resolve) => {
      releaseSecondPage = resolve;
    });
    let callCount = 0;

    server.use(
      http.get("*/rest/v1/courses", async ({ request }) => {
        callCount += 1;
        const searchParams = new URL(request.url).searchParams;
        const offset = parseInt(searchParams.get("offset") ?? "0", 10);
        const limit = parseInt(searchParams.get("limit") ?? `${LIMIT}`, 10);
        const start = offset;
        const end = offset + limit - 1;
        const page = buildCourseCatalog(30).slice(start, end + 1);
        if (callCount > 1) await secondPageGate;
        return HttpResponse.json(page, {
          headers: { "Content-Range": `${start}-${end}/30` },
        });
      })
    );

    const { result, rerender } = renderUseCourses(baseOptions);
    await waitFor(() => expect(result.current.data?.courses[0].id).toBe("course-1"));
    const page1Title = result.current.data.courses[0].title;

    rerender({ ...baseOptions, page: 2 });

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.data.courses[0].title).toBe(page1Title);

    act(() => {
      releaseSecondPage();
    });

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data.courses[0].id).toBe("course-13");
    expect(result.current.isError).toBe(false);
  });

  it("surfaces isError with the hook's message on a failed response", async () => {
    server.use(
      http.get("*/rest/v1/courses", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderUseCourses();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Failed to load courses");
    expect(result.current.data).toBeUndefined();
  });

  it("treats an empty result as data (not an error)", async () => {
    server.use(
      http.get("*/rest/v1/courses", () =>
        HttpResponse.json([], {
          headers: { "Content-Range": "0-0/0" },
        })
      )
    );

    const { result } = renderUseCourses();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ courses: [], totalCount: 0 });
    expect(result.current.isError).toBe(false);
  });

  it("creates separate cache entries per filter combination (queryKey uniqueness)", async () => {
    const { result, rerender } = renderUseCourses({
      ...baseOptions,
      category: "Development",
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      result.current.data.courses.every((c) => c.category === "Development")
    ).toBe(true);

    rerender({ ...baseOptions, category: "Design" });
    await waitFor(() =>
      expect(
        result.current.data?.courses.every((c) => c.category === "Design")
      ).toBe(true)
    );

    expect(requests).toHaveLength(2);
    expect(requests[0].url).toContain("category=eq.Development");
    expect(requests[1].url).toContain("category=eq.Design");
  });
});