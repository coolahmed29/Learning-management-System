/**
 * FILE: src/features/learning/__tests__/useUpdateLastAccessed.test.js
 * PURPOSE: Mutation hook test for the background bookkeeping call.
 *
 * TEST CASES:
 *    ✓ calling mutate sends correct courseId/lessonId to the API
 *    ✓ failure does not throw an unhandled error (verify the calling test
 *      environment doesn't blow up — e.g. no unhandled promise rejection)
 *    ✓ does NOT trigger any of the invalidations that useMarkComplete does
 *      (explicitly assert courseProgress/myEnrollments queries are untouched —
 *      this protects the deliberate design choice documented in the hook)
 */
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { server } from "../../../test/mocks/server";
import { useUpdateLastAccessed } from "../hooks/useUpdateLastAccessed";
import * as learningApi from "../api/learningApi";

const user = { id: "user-1", email: "test@example.com" };
const courseId = "course-1";
const lessonId = "les-2";

function createStore(authUser = user) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authUser, isLoading: false } },
  });
}

function renderUpdateLastAccessed() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
  const store = createStore();
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return {
    result: renderHook(() => useUpdateLastAccessed(), { wrapper }).result,
    queryClient,
  };
}

function useHandler({ mode = "success" } = {}) {
  server.use(
    http.patch("*/rest/v1/enrollments", ({ request }) => {
      const url = new URL(request.url);
      const sentCourseId = (url.searchParams.get("course_id") ?? "").replace("eq.", "");
      const sentUserId = (url.searchParams.get("user_id") ?? "").replace("eq.", "");
      if (mode === "error") {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }
      return HttpResponse.json([{ sentCourseId, sentUserId }]);
    })
  );
}

describe("useUpdateLastAccessed", () => {
  it("calling mutate sends correct courseId/lessonId to the API", async () => {
    let body;
    server.use(
      http.patch("*/rest/v1/enrollments", async ({ request }) => {
        const url = new URL(request.url);
        const sentCourseId = (url.searchParams.get("course_id") ?? "").replace("eq.", "");
        const sentUserId = (url.searchParams.get("user_id") ?? "").replace("eq.", "");
        body = { sentCourseId, sentUserId, ...(await request.json()) };
        return HttpResponse.json([]);
      })
    );

    const { result } = renderUpdateLastAccessed();

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(body.sentCourseId).toBe(courseId);
    expect(body.sentUserId).toBe(user.id);
    expect(body.last_lesson_id).toBe(lessonId);
    expect(typeof body.last_accessed_at).toBe("string");
  });

  it("failure does not throw an unhandled error", async () => {
    // Force the underlying API call to REJECT (the hook must swallow it via
    // its onError handler rather than letting an unhandled rejection reach
    // the test environment).
    const apiSpy = vi
      .spyOn(learningApi, "updateLastAccessed")
      .mockRejectedValue(new Error("boom"));

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderUpdateLastAccessed();

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("boom");
    expect(apiSpy).toHaveBeenCalledWith(user.id, courseId, lessonId);
    // The onError handler logs a warning rather than rethrowing.
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to update last_accessed_at:",
      "boom"
    );

    apiSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("does NOT trigger any of the invalidations that useMarkComplete does", async () => {
    useHandler({ mode: "success" });
    const { result, queryClient } = renderUpdateLastAccessed();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
