/**
 * Component tests for EnrollmentCTA — the most branch-heavy component in
 * Phase 3. Three states (guest / enrolled / not-enrolled) plus two async
 * loading windows (enrollment-status fetch, enroll mutation), so this test
 * covers the four distinct render branches.
 */
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { userEvent } from "@testing-library/user-event";
import { act, screen, waitFor } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import { createEnrollmentStatusHandler } from "../../../test/mocks/courseHandlers";
import { EnrollmentCTA } from "../components/EnrollmentCTA";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "student",
};

function authState(user = null) {
  return { auth: { user, isLoading: false } };
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe("EnrollmentCTA", () => {
  it("guest -> renders 'Enroll Now' that navigates to /login on click", async () => {
    const requests = [];
    server.use(
      createEnrollmentStatusHandler({ onRequest: () => requests.push("status") })
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <EnrollmentCTA courseId="course-1" />
        <LocationProbe />
      </>,
      { preloadedState: authState(), route: "/courses/course-1" }
    );

    const enrollBtn = screen.getByRole("button", { name: "Enroll Now" });
    expect(enrollBtn).not.toBeDisabled();

    await user.click(enrollBtn);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login")
    );
    // Guests must never fire the enrollment HTTP requests at all.
    expect(requests).toHaveLength(0);
  });

  it("authenticated + not enrolled -> enroll mutation runs with a loading state during the request", async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const postedBody = [];
    server.use(
      createEnrollmentStatusHandler({ rows: [] }),
      http.post("*/rest/v1/enrollments", async ({ request }) => {
        postedBody.push(await request.json());
        await gate;
        return HttpResponse.json({
          id: "enr-1",
          course_id: "course-1",
          user_id: "user-1",
          progress_percent: 0,
        });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<EnrollmentCTA courseId="course-1" />, {
      preloadedState: authState(mockUser),
      route: "/courses/course-1",
    });

    await screen.findByRole("button", { name: "Enroll Now" });

    await user.click(screen.getByRole("button", { name: "Enroll Now" }));

    const busyBtn = await screen.findByRole("button", { name: /Enroll Now/i });
    expect(busyBtn).toBeDisabled();
    expect(busyBtn).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/Continue Learning/i)).not.toBeInTheDocument();

    act(() => {
      release();
    });

    await waitFor(() => expect(postedBody).toHaveLength(1));
    expect(postedBody[0]).toEqual(
      expect.objectContaining({
        course_id: "course-1",
        user_id: "user-1",
        progress_percent: 0,
      })
    );
  });

  it("after a successful enroll, the CTA flips to 'Continue Learning' via cache invalidation (no reload)", async () => {
    let enrolled = false;
    server.use(
      http.get("*/rest/v1/enrollments", () =>
        HttpResponse.json(
          enrolled
            ? [{ id: "enr-1", course_id: "course-1", user_id: "user-1", progress_percent: 0 }]
            : []
        )
      ),
      http.post("*/rest/v1/enrollments", async ({ request }) => {
        enrolled = true;
        return HttpResponse.json({ id: "enr-1", ...(await request.json()) });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<EnrollmentCTA courseId="course-1" />, {
      preloadedState: authState(mockUser),
      route: "/courses/course-1",
    });

    await screen.findByRole("button", { name: "Enroll Now" });
    await user.click(screen.getByRole("button", { name: "Enroll Now" }));

    // invalidateQueries -> refetch -> re-render, all in one render tree.
    const continueBtn = await screen.findByRole("button", {
      name: "Continue Learning (0%)",
    });
    expect(continueBtn).not.toBeDisabled();
    expect(screen.queryByRole("button", { name: "Enroll Now" })).not.toBeInTheDocument();
  });

  it("authenticated + already enrolled (45%) -> 'Continue Learning (45%)' navigates to /learn/{courseId}", async () => {
    server.use(
      createEnrollmentStatusHandler({
        rows: [{ id: "enr-1", course_id: "course-1", user_id: "user-1", progress_percent: 45 }],
      })
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <EnrollmentCTA courseId="course-1" />
        <LocationProbe />
      </>,
      { preloadedState: authState(mockUser), route: "/courses/course-1" }
    );

    const continueBtn = await screen.findByRole("button", {
      name: "Continue Learning (45%)",
    });

    await user.click(continueBtn);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/learn/course-1")
    );
  });

  it("while enrollment status is loading, shows a disabled placeholder — never a flash of 'Enroll Now' then 'Continue Learning'", async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    server.use(
      http.get("*/rest/v1/enrollments", async () => {
        await gate;
        return HttpResponse.json([
          { id: "enr-1", course_id: "course-1", user_id: "user-1", progress_percent: 45 },
        ]);
      })
    );
    renderWithProviders(<EnrollmentCTA courseId="course-1" />, {
      preloadedState: authState(mockUser),
      route: "/courses/course-1",
    });

    const pendingBtn = screen.getByRole("button", { name: /Enroll Now/ });
    expect(pendingBtn).toBeDisabled();
    expect(pendingBtn).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/Continue Learning/i)).not.toBeInTheDocument();

    act(() => {
      release();
    });

    const resolvedBtn = await screen.findByRole("button", {
      name: "Continue Learning (45%)",
    });
    expect(resolvedBtn).not.toBeDisabled();
  });
});