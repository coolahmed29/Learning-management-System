/**
 * Mutation hook-level tests for useEnrollCourse — success, the 23505 duplicate
 * soft-success path, and the generic failure path. The invalidation spy proves
 * the "already enrolled" + "just enrolled" flows both land the UI on "Continue
 * Learning", while a failure leaves the enrollment status cache untouched.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { server } from "../../../test/mocks/server";
import { createEnrollCourseHandler } from "../../../test/mocks/courseHandlers";
import { useEnrollCourse } from "../hooks/useEnrollCourse";

const user = { id: "user-1", email: "test@example.com", name: "Test User", role: "student" };

function renderEnrollCourse() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user, isLoading: false } },
  });
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return {
    result: renderHook(() => useEnrollCourse(), { wrapper }).result,
    queryClient,
  };
}

describe("useEnrollCourse", () => {
  it("resolves on success and invalidates the enrollment query for that course", async () => {
    server.use(createEnrollCourseHandler({ mode: "success" }));
    const { result, queryClient } = renderEnrollCourse();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate("course-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["enrollment", "course-1", user.id],
    });
  });

  it("treats a duplicate-enrollment (23505) as a soft success and still invalidates", async () => {
    server.use(createEnrollCourseHandler({ mode: "duplicate" }));
    const { result, queryClient } = renderEnrollCourse();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate("course-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["enrollment", "course-1", user.id],
    });
  });

  it("surfaces a friendly error on a generic failure and does NOT invalidate", async () => {
    server.use(createEnrollCourseHandler({ mode: "error" }));
    const { result, queryClient } = renderEnrollCourse();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    act(() => {
      result.current.mutate("course-1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe(
      "Failed to enroll. Please try again."
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});