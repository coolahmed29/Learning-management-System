/**
 * FILE: src/features/learning/__tests__/useMarkComplete.test.js
 * PURPOSE: Mutation hook test — focused heavily on the cross-feature
 *          invalidation behavior, since that's the highest-risk part of this hook.
 *
 * TEST CASES:
 *    ✓ successful mark-complete resolves without error
 *    ✓ on success, invalidates ALL THREE query key families: ['courseProgress',
 *      courseId], ['enrollment', courseId, userId], ['myEnrollments'] — assert
 *      each individually (e.g. seed all three queries in the cache beforehand,
 *      call the mutation, then assert each one is marked stale/refetches)
 *    ✓ on failure, NONE of the three invalidations occur (state correctly
 *      remains unchanged everywhere)
 *    ✓ marking an ALREADY-completed lesson again (idempotent upsert) still
 *      resolves successfully without error (per the API's documented upsert behavior)
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
import { useMarkComplete } from "../hooks/useMarkComplete";
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

function renderMarkComplete() {
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
    result: renderHook(() => useMarkComplete(), { wrapper }).result,
    queryClient,
  };
}

function useRpcHandler({ mode = "success" } = {}) {
  server.use(
    http.post("*/rest/v1/rpc/mark_lesson_complete", () => {
      if (mode === "error") {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }
      return HttpResponse.json(null);
    }),
    // the follow-up last_accessed_at touch on enrollments
    http.patch("*/rest/v1/enrollments", () => {
      if (mode === "error") {
        return HttpResponse.json({ message: "boom" }, { status: 500 });
      }
      return HttpResponse.json([]);
    })
  );
}

describe("useMarkComplete", () => {
  it("successful mark-complete resolves without error", async () => {
    useRpcHandler({ mode: "success" });
    const { result } = renderMarkComplete();

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    // React Query sets error to null on success, not undefined.
    expect(result.current.error).toBeNull();
  });

  it("on success, invalidates ALL THREE query key families", async () => {
    useRpcHandler({ mode: "success" });
    const { result, queryClient } = renderMarkComplete();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["courseProgress", courseId],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["enrollment", courseId, user.id],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["myEnrollments"] });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it("on failure, NONE of the three invalidations occur", async () => {
    // Force the mutation to REJECT — this is what actually puts the mutation
    // into the error state (the RPC returning {error} alone would still
    // resolve, and the invalidations in onSuccess would fire).
    const apiSpy = vi
      .spyOn(learningApi, "markLessonComplete")
      .mockRejectedValue(new Error("boom"));

    const { result, queryClient } = renderMarkComplete();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("boom");
    expect(invalidateSpy).not.toHaveBeenCalled();

    apiSpy.mockRestore();
  });

  it("marking an ALREADY-completed lesson again still resolves successfully", async () => {
    // Idempotent upsert — the backend accepts re-marking; both RPC calls succeed.
    useRpcHandler({ mode: "success" });
    const { result, queryClient } = renderMarkComplete();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);

    // second call to the same lesson
    act(() => {
      result.current.mutate({ courseId, lessonId });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(invalidateSpy).toHaveBeenCalledTimes(6);
  });
});
