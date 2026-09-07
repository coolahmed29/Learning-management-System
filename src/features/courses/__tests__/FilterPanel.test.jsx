/**
 * Component test for FilterPanel interaction logic — category/difficulty toggle
 * chips, Clear all visibility, and the mobile (Modal) vs desktop (inline) split
 * driven by useIsMobile.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { FilterPanel } from "../components/FilterPanel";

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(),
}));

vi.mock("../../../hooks/useMediaQuery", () => ({
  useIsMobile: useIsMobileMock,
}));

const categories = [
  { id: "cat-dev", name: "Development" },
  { id: "cat-design", name: "Design" },
  { id: "cat-business", name: "Business" },
];

function setup(filters = {}) {
  const onFilterChange = vi.fn();
  const onClearAll = vi.fn();
  renderWithProviders(
    <FilterPanel
      filters={filters}
      onFilterChange={onFilterChange}
      onClearAll={onClearAll}
      categories={categories}
    />
  );
  return { onFilterChange, onClearAll };
}

describe("FilterPanel", () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false);
  });

  it("renders all provided categories as options", () => {
    setup();
    expect(
      screen.getByRole("button", { name: "Development" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Design" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Business" })
    ).toBeInTheDocument();
  });

  it("renders all 3 difficulty options", () => {
    setup();
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Intermediate" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Advanced" })
    ).toBeInTheDocument();
  });

  it("calls onFilterChange('category', value) for an inactive category", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup();
    await user.click(screen.getByRole("button", { name: "Development" }));
    expect(onFilterChange).toHaveBeenCalledWith("category", "Development");
  });

  it("toggles an already-active category off with null", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup({ category: "Development" });
    await user.click(screen.getByRole("button", { name: "Development" }));
    expect(onFilterChange).toHaveBeenCalledWith("category", null);
  });

  it("calls onFilterChange('difficulty', value) for an inactive difficulty", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup();
    await user.click(screen.getByRole("button", { name: "Intermediate" }));
    expect(onFilterChange).toHaveBeenCalledWith("difficulty", "Intermediate");
  });

  it("toggles an already-active difficulty off with null", async () => {
    const user = userEvent.setup();
    const { onFilterChange } = setup({ difficulty: "Intermediate" });
    await user.click(screen.getByRole("button", { name: "Intermediate" }));
    expect(onFilterChange).toHaveBeenCalledWith("difficulty", null);
  });

  it("does not render Clear all when no filters are active", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: "Clear all" })
    ).not.toBeInTheDocument();
  });

  it("renders Clear all when a filter is active and clicking it calls onClearAll", async () => {
    const user = userEvent.setup();
    const { onClearAll } = setup({ category: "Development" });

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("on mobile, shows a trigger button that opens the same filters in a Modal", async () => {
    useIsMobileMock.mockReturnValue(true);
    const user = userEvent.setup();
    const { onFilterChange } = setup();

    expect(screen.queryByRole("button", { name: "Development" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Filters" });

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Development" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Development" }));
    expect(onFilterChange).toHaveBeenCalledWith("category", "Development");
  });
});