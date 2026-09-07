/**
 * Component test for RegisterForm. Mirrors LoginForm.test.jsx with the extra
 * fields, the role selector, and the confirmation-required success branch.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { RegisterForm } from "../components/RegisterForm";

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
  id: "user-2",
  email: "instructor@example.com",
  role: "instructor",
};
const mockProfile = { id: "user-2", name: "Instructor", role: "instructor" };

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

function defaultSignUp() {
  supabaseMock.auth.signUp.mockResolvedValue({
    data: { user: mockUser, session: { access_token: "token", user: mockUser } },
    error: null,
  });
}

const validValues = {
  name: "Jane Student",
  email: "student@example.com",
  password: "Password1",
  confirmPassword: "Password1",
};

async function fillValidForm(user) {
  await user.type(screen.getByLabelText("Name"), validValues.name);
  await user.type(screen.getByLabelText("Email"), validValues.email);
  await user.type(screen.getByLabelText("Password"), validValues.password);
  await user.type(
    screen.getByLabelText("Confirm password"),
    validValues.confirmPassword
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    supabaseMock.auth.signUp.mockReset();
    defaultSignUp();
    defaultProfile();
  });

  it("renders all fields, role selector, and submit button", () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Student" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Instructor" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("reflects values typed into the fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);

    expect(screen.getByLabelText("Name")).toHaveValue(validValues.name);
    expect(screen.getByLabelText("Email")).toHaveValue(validValues.email);
    expect(screen.getByLabelText("Password")).toHaveValue(validValues.password);
    expect(screen.getByLabelText("Confirm password")).toHaveValue(
      validValues.confirmPassword
    );
  });

  it("submits with the selected role instead of the default", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Instructor" }));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
        email: validValues.email,
        password: validValues.password,
        options: {
          data: { name: validValues.name, role: "instructor" },
        },
      })
    );
  });

  it("shows validation messages for empty/invalid fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Name must be at least 2 characters")
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
  });

  it("shows the mismatch error under the confirm password field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);
    await user.clear(screen.getByLabelText("Confirm password"));
    await user.type(screen.getByLabelText("Confirm password"), "Different1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
  });

  it("shows loading state while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveSignUp;
    supabaseMock.auth.signUp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
    );

    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });
    expect(submitButton).toBeDisabled();

    resolveSignUp({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    await waitFor(() => expect(submitButton).toBeEnabled());
  });

  it("displays a friendly error when the email already exists", async () => {
    const user = userEvent.setup();
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "A user with this email address has already been registered" },
    });

    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists"
    );
  });

  it("shows the check-your-email message when session is null (confirmation required)", async () => {
    const user = userEvent.setup();
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    renderWithProviders(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email"
    );
    expect(
      screen.queryByRole("button", { name: /create account/i })
    ).not.toBeInTheDocument();
  });
});