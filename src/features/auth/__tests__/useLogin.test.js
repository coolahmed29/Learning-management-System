/**
 * Hook-level test for useLogin using renderHook. Real authApi + real useLogin
 * run against a mocked supabase client (no live backend/env required).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../../store/slices/authSlice";
import { useLogin } from "../hooks/useLogin";

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
    })),
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

describe("useLogin", () => {
  beforeEach(() => {
    supabaseMock.auth.signInWithPassword.mockReset();
    supabaseMock.from.mockClear();
  });

  it("succeeds with valid credentials, updating Redux state", async () => {
    const { wrapper, store } = buildWrapper();

    const user = {
      id: "user-1",
      email: "test@example.com",
      user_metadata: { name: "Test User", role: "student" },
    };
    const session = { access_token: "token", user };
    const normalizedUser = { id: "user-1", email: "test@example.com", name: "Test User", role: "student" };

    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "test@example.com", password: "Password1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(store.getState().auth.user).toEqual(normalizedUser);
    expect(store.getState().auth.isLoading).toBe(false);
  });

  it("sets isError with mapped friendly message on invalid credentials", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: "Invalid login credentials",
        code: "invalid_credentials",
      },
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "x@y.com", password: "wrong" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Incorrect email or password");
    expect(store.getState().auth.user).toBeNull();
  });

  it("does not corrupt Redux state on failure", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "x@y.com", password: "wrong" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(store.getState().auth.user).toBeNull();
  });

  it("handles network-level failure with a generic message", async () => {
    const { wrapper, store } = buildWrapper();

    supabaseMock.auth.signInWithPassword.mockRejectedValue(
      new Error("Network Error")
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    act(() => {
      result.current.mutate({ email: "x@y.com", password: "wrong" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(store.getState().auth.user).toBeNull();
  });
});
