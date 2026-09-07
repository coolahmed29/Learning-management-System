/**
 * Component test for LoginForm. Renders via renderWithProviders and exercises
 * the real useLogin + real authApi against a mocked supabase transport.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { LoginForm } from "../components/LoginForm";

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
    storage: { from: vi.fn() },
  },
}));

vi.mock("../../../services/apiClient", () => ({
  supabase: supabaseMock,
}));

const mockUser = {
  id: "user-1",
  email: "student@example.com",
  role: "student",
};
const mockProfile = { id: "user-1", name: "Student", role: "student" };

function defaultProfile() {
  supabaseMock.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      })),
    })),
    insert: vi.fn(),
  });
}

function defaultLogin() {
  supabaseMock.auth.signInWithPassword.mockResolvedValue({
    data: { user: mockUser, session: { access_token: "token", user: mockUser } },
    error: null,
  });
}

describe("LoginForm", () => {
  beforeEach(() => {
    supabaseMock.auth.signInWithPassword.mockReset();
    defaultLogin();
    defaultProfile();
  });

  it("renders email, password inputs and Log In button", () => {
    renderWithProviders(<LoginForm />);
    expect(
      screen.getByLabelText("Email")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  it("reflects typed text in the email input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");

    expect(screen.getByLabelText("Email")).toHaveValue("student@example.com");
  });

  it("reflects typed text in the password input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Password"), "secret123");

    expect(screen.getByLabelText("Password")).toHaveValue("secret123");
  });

  it("shows validation messages and does not call the API on empty submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(
      supabaseMock.auth.signInWithPassword
    ).not.toHaveBeenCalled();
  });

  it("triggers the login mutation on valid submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(
      screen.getByLabelText("Email"),
      "student@example.com"
    );
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(
        supabaseMock.auth.signInWithPassword
      ).toHaveBeenCalledWith({
        email: "student@example.com",
        password: "secret123",
      })
    );
  });

  it("shows loading state while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    supabaseMock.auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    const submitButton = screen.getByRole("button", { name: /log in/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-busy", "true");

    resolveLogin({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    await waitFor(() => expect(submitButton).toBeEnabled());
  });

  it("displays a friendly error banner when the API rejects credentials", async () => {
    const user = userEvent.setup();
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Incorrect email or password");
  });

  it("completes a successful login without error banner", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(
        supabaseMock.auth.signInWithPassword
      ).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /log in/i })).toBeEnabled();
  });
});