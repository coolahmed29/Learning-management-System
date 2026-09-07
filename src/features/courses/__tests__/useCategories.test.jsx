/**
 * Simple hook test for the categories query against MSW.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../../test/mocks/server";
import { createCategoriesHandler } from "../../../test/mocks/courseHandlers";
import { MOCK_CATEGORIES } from "../../../test/factories";
import { useCategories } from "../hooks/useCategories";

function renderCategories() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCategories(), { wrapper });
}

describe("useCategories", () => {
  beforeEach(() => {
    server.use(createCategoriesHandler());
  });

  it("returns the category list on a successful response", async () => {
    const { result } = renderCategories();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(MOCK_CATEGORIES);
    expect(result.current.isError).toBe(false);
  });

  it("sets isLoading true initially", () => {
    const { result } = renderCategories();
    expect(result.current.isLoading).toBe(true);
  });

  it("sets isError on a failed response", async () => {
    server.use(
      http.get("*/rest/v1/categories", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderCategories();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Failed to load categories");
    expect(result.current.data).toBeUndefined();
  });
});