/**
 * Hook-level test for useRegister. Mirrors useLogin.test.js structure for the
 * register mutation, including the confirmation-required (no-session) branch.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { useRegister } from "../hooks/useRegister";

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

function buildWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
  const store = configureStore({ reducer: { auth: authReducer } });

  const wrapper = ({ children }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Provider, { store }, children)
    );

  return { wrapper, store };
}

const values = {
  name: "Jane Student",
  email: "student@example.com",
  password: "Password1",
  role: "student",
};

const mockUser = {
  id: "user-1",
  email: "student@example.com",
  user_metadata: { name: "Jane Student", role: "student" },
};
const normalizedUser = {
  id: "user-1",
  email: "student@example.com",
  name: "Jane Student",
  role: "student",
};
const mockProfile = { id: "user-1", name: "Jane Student", role: "student" };

function defaultProfile() {
  supabaseMock.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      })),
    })),
    insert: vi.fn().mockResolvedValue({ error: null }),
  });
}

describe("useRegister", () => {
  beforeEach(() => {
    supabaseMock.auth.signUp.mockReset();
    defaultProfile();
  });

  it("sets Redux user on success with an immediate session", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    const { result } = renderHook(() => useRegister(), { wrapper });

    act(() => {
      result.current.mutate(values);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(store.getState().auth.user).toEqual(normalizedUser);
    expect(store.getState().auth.isLoading).toBe(false);
  });

  it("does NOT set Redux user when session is null (confirmation required)", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    const { result } = renderHook(() => useRegister(), { wrapper });

    act(() => {
      result.current.mutate(values);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(result.current.data.data.session).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });

  it("maps a duplicate-email error to a friendly message", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: "A user with this email address has already been registered",
      },
    });

    const { result } = renderHook(() => useRegister(), { wrapper });

    act(() => {
      result.current.mutate(values);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe(
      "An account with this email already exists"
    );
    expect(store.getState().auth.user).toBeNull();
  });

  it("surfaces a server-side weak-password rejection without crashing", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Password should be at least 6 characters" },
    });

    const { result } = renderHook(() => useRegister(), { wrapper });

    act(() => {
      result.current.mutate(values);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toContain("Password");
    expect(store.getState().auth.user).toBeNull();
  });
});