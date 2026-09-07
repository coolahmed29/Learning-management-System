/**
 * Unit tests for Zod validation rules — fast, isolated, no rendering/network.
 */
import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../authSchema";

describe("loginSchema", () => {
  it("passes valid email + non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("fails invalid email format with 'Enter a valid email'", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "email");
    expect(issue.message).toBe("Enter a valid email");
  });

  it("fails empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("fails empty password with 'Password is required'", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === "password");
    expect(issue.message).toBe("Password is required");
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Test User",
    email: "test@example.com",
    password: "Password1",
    confirmPassword: "Password1",
    role: "student",
  };

  it("passes all valid fields with matching passwords", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("fails name shorter than 2 chars", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    expect(
      result.error.issues.find((i) => i.path[0] === "name")
    ).toBeTruthy();
  });

  it("passes exactly 2-char name (min inclusive boundary)", () => {
    expect(registerSchema.safeParse({ ...valid, name: "Ab" }).success).toBe(true);
  });

  it("fails invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "bad" }).success).toBe(
      false
    );
  });

  it("fails password shorter than 8 chars", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "Pass1", confirmPassword: "Pass1" })
        .success
    ).toBe(false);
  });

  it("passes exactly-8-char password with upper+number (boundary)", () => {
    const eightChar = "Pass1234";
    expect(
      registerSchema.safeParse({
        ...valid,
        password: eightChar,
        confirmPassword: eightChar,
      }).success
    ).toBe(true);
  });

  it("fails password missing uppercase letter", () => {
    expect(
      registerSchema.safeParse({
        ...valid,
        password: "password1",
        confirmPassword: "password1",
      }).success
    ).toBe(false);
  });

  it("fails password missing number", () => {
    expect(
      registerSchema.safeParse({
        ...valid,
        password: "Password",
        confirmPassword: "Password",
      }).success
    ).toBe(false);
  });

  it("fails confirmPassword mismatch, error attached to confirmPassword path", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find(
      (i) => i.path[0] === "confirmPassword"
    );
    expect(issue).toBeTruthy();
    expect(issue.message).toBe("Passwords don't match");
  });

  it("fails role not in ['student','instructor']", () => {
    expect(registerSchema.safeParse({ ...valid, role: "admin" }).success).toBe(
      false
    );
    expect(
      registerSchema.safeParse({ ...valid, role: "garbage" }).success
    ).toBe(false);
  });

  it("fails role missing entirely", () => {
    const withoutRole = {
      name: valid.name,
      email: valid.email,
      password: valid.password,
      confirmPassword: valid.confirmPassword,
    };
    expect(registerSchema.safeParse(withoutRole).success).toBe(false);
  });
});
