/**
 * Hook-level tests for useMyEnrollments via renderHook + MSW + Redux + Router.
 * The critical assertions are the statusFilter param handling (which the page's
 * tab row maps 1:1 to a PostgREST progress_percent filter) and the
 * enabled: !!user?.id guard — a bug here would either leak enrollment queries
 * for logged-out users or fetch the wrong subset per tab.
 */
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { server } from "../../../test/mocks/server";
import { createMyEnrollmentsHandler } from "../../../test/mocks/courseHandlers";
import { useMyEnrollments } from "../hooks/useMyEnrollments";

const user = { id: "user-1", email: "test@example.com", name: "Test User", role: "student" };

const rows = [
  {
    id: "enr-1",
    progress_percent: 45,
    enrolled_at: "2026-01-05T09:00:00.000Z",
    last_accessed_at: "2026-02-01T09:00:00.000Z",
    course: {
      id: "course-1",
      title: "React Fundamentals",
      thumbnail_url: "https://cdn.example.com/course-1.jpg",
      instructor: { name: "Instructor 1" },
    },
  },
  {
    id: "enr-2",
    progress_percent: 100,
    enrolled_at: "2026-01-10T09:00:00.000Z",
    last_accessed_at: "2026-02-10T09:00:00.000Z",
    course: {
      id: "course-2",
      title: "CSS Layout Mastery",
      thumbnail_url: "https://cdn.example.com/course-2.jpg",
      instructor: { name: "Instructor 2" },
    },
  },
];

function renderMyEnrollments(statusFilter, { user: authUser = user } = {}) {
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
  return renderHook(() => useMyEnrollments(statusFilter), { wrapper });
}

describe("useMyEnrollments", () => {
  it("returns enrolled courses with progress on success", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: (info) => requests.push(info) })
    );

    const { result } = renderMyEnrollments("all");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toEqual(
      expect.objectContaining({
        id: "enr-1",
        progress_percent: 45,
        course: expect.objectContaining({ id: "course-1", title: "React Fundamentals" }),
      })
    );
    expect(requests[0].userId).toBe("user-1");
  });

  it("statusFilter='in_progress' sends lt.100 and returns only the in-progress subset", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: (info) => requests.push(info) })
    );

    const { result } = renderMyEnrollments("in_progress");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requests[0].progressFilter).toBe("lt.100");
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].progress_percent).toBe(45);
  });

  it("statusFilter='completed' sends eq.100 and returns only the completed subset", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: (info) => requests.push(info) })
    );

    const { result } = renderMyEnrollments("completed");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requests[0].progressFilter).toBe("eq.100");
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].progress_percent).toBe(100);
  });

  it("statusFilter='all' (default) sends NO filter param and returns everything", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: (info) => requests.push(info) })
    );

    const { result } = renderMyEnrollments();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requests[0].progressFilter).toBeNull();
    expect(result.current.data).toHaveLength(2);
  });

  it("empty enrollments -> returns an empty array, NOT an error", async () => {
    server.use(createMyEnrollmentsHandler({ rows: [] }));

    const { result } = renderMyEnrollments("all");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it("does not fire at all when the user is unauthenticated (enabled: false)", async () => {
    const requests = [];
    server.use(
      createMyEnrollmentsHandler({ rows, onRequest: () => requests.push(1) })
    );

    const { result } = renderMyEnrollments("all", { user: null });

    expect(requests).toHaveLength(0);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});