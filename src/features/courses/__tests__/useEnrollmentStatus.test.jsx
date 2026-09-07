/**
 * Hook-level tests for useEnrollmentStatus via renderHook + MSW + Redux + Router.
 * The critical assertions here are the guest-vs-authenticated branching: a bug
 * would leak enrollment queries for logged-out users or show the wrong CTA state.
 * DECISION (documented per the requirement): if the enrollment-check itself
 * fails, the hook defensively reports "not enrolled" (isEnrolled false,
 * progressPercent 0) rather than blocking course viewing — the CTA falls back
 * to showing "Enroll Now".
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { server } from "../../../test/mocks/server";
import { createEnrollmentStatusHandler } from "../../../test/mocks/courseHandlers";
import { useEnrollmentStatus } from "../hooks/useEnrollmentStatus";

const user = { id: "user-1", email: "test@example.com", name: "Test User", role: "student" };

function renderEnrollmentStatus(courseId = "course-1", { user: authUser = null } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authUser, isLoading: false } },
  });
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return renderHook(() => useEnrollmentStatus(courseId), { wrapper });
}

describe("useEnrollmentStatus", () => {
  it("guest user -> isEnrolled false, isLoading false, and the endpoint is NEVER hit", async () => {
    const requests = [];
    server.use(
      createEnrollmentStatusHandler({
        rows: [{ id: "enr-1", progress_percent: 50 }],
        onRequest: () => requests.push(1),
      })
    );

    const { result } = renderEnrollmentStatus("course-1", { user: null });

    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(requests).toHaveLength(0);
  });

  it("authenticated + enrolled -> isEnrolled true with the mocked progressPercent", async () => {
    server.use(
      createEnrollmentStatusHandler({
        rows: [{ id: "enr-1", progress_percent: 45 }],
      })
    );

    const { result } = renderEnrollmentStatus("course-1", { user });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEnrolled).toBe(true);
    expect(result.current.progressPercent).toBe(45);
  });

  it("authenticated + not enrolled (maybeSingle empty result) -> isEnrolled false, progress 0", async () => {
    server.use(createEnrollmentStatusHandler({ rows: [] }));

    const { result } = renderEnrollmentStatus("course-1", { user });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.progressPercent).toBe(0);
  });

  it("authenticated + enrollment-check error -> defensively treated as not enrolled", async () => {
    server.use(
      http.get("*/rest/v1/enrollments", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderEnrollmentStatus("course-1", { user });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEnrolled).toBe(false);
    expect(result.current.progressPercent).toBe(0);
  });
});