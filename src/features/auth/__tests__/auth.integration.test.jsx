/**
 * End-to-end integration test for the auth feature: real component tree, real
 * Redux, real TanStack Query, real router — only the supabase transport and
 * (via the router) the app shell are mocked.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Routes, Route } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import authReducer from "../../../store/slices/authSlice";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "../../../components/layout/ProtectedRoute";
import { RoleGuard } from "../../../components/layout/RoleGuard";
import { DashboardPage } from "../../../pages/DashboardPage";

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    },
    from: vi.fn(),
  },
}));

vi.mock("../../../services/apiClient", () => ({
  supabase: supabaseMock,
}));

const mockUser = {
  id: "user-1",
  email: "student@example.com",
  user_metadata: { name: "Student", role: "student" },
};
const normalizedUser = {
  id: "user-1",
  email: "student@example.com",
  name: "Student",
  role: "student",
};
const mockProfile = { id: "user-1", name: "Student", role: "student" };

function defaultLogin() {
  supabaseMock.auth.signInWithPassword.mockResolvedValue({
    data: { user: mockUser, session: { access_token: "token", user: mockUser } },
    error: null,
  });
  supabaseMock.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      })),
    })),
    insert: vi.fn(),
  });
}

const AUTH_EMPTY = { auth: { user: null, isLoading: false } };

function InstructorDashboard() {
  return (
    <div>
      <h1>Instructor Dashboard</h1>
    </div>
  );
}

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route element={<RoleGuard allow={["instructor"]} />}>
          <Route
            path="/instructor/dashboard"
            element={<InstructorDashboard />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

describe("auth integration", () => {
  beforeEach(() => {
    defaultLogin();
  });

  it("logs in, updates auth state, and navigates to the dashboard", async () => {
    const user = userEvent.setup();
    const store = configureStore({ reducer: { auth: authReducer } });

    renderWithProviders(<TestApp />, { route: "/login", store });

    await user.type(
      screen.getByLabelText("Email"),
      "student@example.com"
    );
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(store.getState().auth.user).toEqual(normalizedUser);
      expect(store.getState().auth.user.role).toBe("student");
    });
    expect(store.getState().auth.isLoading).toBe(false);
  });

  it("blocks unauthenticated access to /dashboard and redirects to login", async () => {
    renderWithProviders(<TestApp />, {
      route: "/dashboard",
      preloadedState: AUTH_EMPTY,
    });

    expect(
      await screen.findByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Dashboard" })
    ).not.toBeInTheDocument();
  });

  it("redirects a student away from the instructor dashboard by role", async () => {
    renderWithProviders(<TestApp />, {
      route: "/instructor/dashboard",
      preloadedState: {
        auth: {
          user: normalizedUser,
          isLoading: false,
        },
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Instructor Dashboard" })
    ).not.toBeInTheDocument();
  });
});