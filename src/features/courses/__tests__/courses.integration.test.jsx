/**
 * THE main integration test for the courses discovery feature — real
 * CoursesListPage tree (SearchBar + FilterPanel + SortDropdown + CourseCard +
 * Pagination + all 4 states) with real hooks and MSW-mocked network, mirroring
 * the depth of auth.integration.test.jsx. Uses the same dynamic courses handler
 * as useCourses.test.js, so URL-driven filters actually produce different data.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { userEvent } from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../../providers/ThemeProvider";
import { server } from "../../../test/mocks/server";
import {
  createCoursesHandler,
  createCategoriesHandler,
} from "../../../test/mocks/courseHandlers";
import { renderWithProviders } from "../../../test/test-utils";
import { buildCourseList } from "../../../test/factories";
import { CoursesListPage } from "../pages/CoursesListPage";

const requests = [];
function record({ url, order, range, start, end }) {
  requests.push({ url: url.toString(), order, range, start, end });
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

function renderPage(route = "/courses") {
  return renderWithProviders(
    <>
      <LocationProbe />
      <CoursesListPage />
    </>,
    { route }
  );
}

function renderPageWithRouter(initialEntries) {
  const router = createMemoryRouter(
    [{ path: "/courses", element: <><LocationProbe /><CoursesListPage /></> }],
    { initialEntries }
  );
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
  return router;
}

async function locationProbe() {
  return (await screen.findByTestId("location")).textContent;
}

describe("courses integration", () => {
  beforeEach(() => {
    requests.length = 0;
    server.use(
      createCoursesHandler({ onRequest: record }),
      createCategoriesHandler()
    );
  });

  it("shows skeleton loaders, then renders CourseCards once data resolves", async () => {
    renderPage();

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);

    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveTextContent("Freelancing for Designers");
    expect(
      screen.getByText("30 courses", { selector: "[role='status']" })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument();
  });

  it("debounced search updates results and the ?search URL param", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link");
    await user.type(screen.getByLabelText("Search courses"), "react");

    await waitFor(
      async () => expect(await locationProbe()).toContain("search=react"),
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(4);
      },
      { timeout: 3000 }
    );
    expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Advanced React Patterns")).toBeInTheDocument();
    expect(screen.getByText("React Native Essentials")).toBeInTheDocument();
    expect(screen.getByText("Testing React Apps")).toBeInTheDocument();
    expect(screen.queryByText("JavaScript Beyond Basics")).not.toBeInTheDocument();
  });

  it("category filtering updates results and ?category, resetting page to 1", async () => {
    const user = userEvent.setup();
    renderPage("/courses?page=3");

    await screen.findAllByRole("link");

    await user.click(screen.getByRole("button", { name: "Development" }));

    await waitFor(
      () => {
        expect(screen.getByText("13 courses")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    const url = await locationProbe();
    expect(url).toContain("category=Development");
    expect(url).not.toContain("page=3");
  });

  it("changing the sort reorders results and updates ?sortBy", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link");

    await user.click(screen.getByRole("button", { name: "Most Popular" }));
    await user.click(screen.getByRole("menuitem", { name: "Longest Duration" }));

    await waitFor(
      () => {
        const links = screen.getAllByRole("link");
        expect(links[0]).toHaveTextContent("TypeScript in Depth");
      },
      { timeout: 3000 }
    );
    expect(await locationProbe()).toContain("sortBy=longest");
  });

  it("pagination: clicking page 2 shows a different page and updates ?page", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link");

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(
      () => expect(screen.getByText("React Native Essentials")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    const url = await locationProbe();
    expect(url).toContain("page=2");
    expect(screen.getAllByRole("link")).toHaveLength(12);
  });

  it("combined search + category + sort carry ALL params in the URL and request", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByRole("link");

    await user.type(screen.getByLabelText("Search courses"), "react");
    await waitFor(() =>
      expect(screen.getAllByRole("link")).toHaveLength(4)
    );

    await user.click(screen.getByRole("button", { name: "Development" }));
    await screen.findAllByRole("link");

    await user.click(screen.getByRole("button", { name: "Most Popular" }));
    await user.click(screen.getByRole("menuitem", { name: "Newest" }));

    await waitFor(
      () => {
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(4);
        expect(links[0]).toHaveTextContent("Testing React Apps");
      },
      { timeout: 3000 }
    );

    const url = await locationProbe();
    expect(url).toContain("search=react");
    expect(url).toContain("category=Development");
    expect(url).toContain("sortBy=newest");
    expect(url).not.toContain("page=");

    const lastUrl = requests[requests.length - 1].url;
    expect(lastUrl).toContain("title=ilike.");
    expect(lastUrl).toContain("category=eq.");
    expect(lastUrl).toContain("order=created_at.desc");
  });

  it("renders ErrorState on failure and refetches on Try again", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/rest/v1/courses", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Couldn't load courses" })
    ).toBeInTheDocument();

    server.use(createCoursesHandler({ onRequest: record }));

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(12));
    expect(requests.length).toBeGreaterThanOrEqual(1);
  });

  it("shows EmptyState for a filter combo and Clear filters resets the URL + results", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/rest/v1/courses", ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const category = (searchParams.get("category") ?? "").replace("eq.", "");
        if (category === "Business") {
          return HttpResponse.json([], {
            headers: { "Content-Range": "0-0/0" },
          });
        }
        const minimal = buildCourseList([
          { id: "only-a", title: "Only Result A" },
          { id: "only-b", title: "Only Result B" },
        ]);
        return HttpResponse.json(minimal, {
          headers: { "Content-Range": "0-1/2" },
        });
      })
    );

    renderPage("/courses?category=Business");

    expect(
      await screen.findByRole("heading", { name: "No courses found" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(await locationProbe()).toBe("/courses");
    await waitFor(
      () => expect(screen.getByText("2 courses")).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });

  it("browser back navigation restores the previous filter state", async () => {
    const user = userEvent.setup();
    const router = renderPageWithRouter(["/courses"]);

    await screen.findAllByRole("link");

    await user.click(screen.getByRole("button", { name: "Design" }));

    await waitFor(
      () => expect(screen.getByText("10 courses")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(await locationProbe()).toBe("/courses?category=Design");

    act(() => {
      router.navigate(-1);
    });

    await waitFor(
      () => expect(screen.getByText("30 courses")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(await locationProbe()).toBe("/courses");
  });
});