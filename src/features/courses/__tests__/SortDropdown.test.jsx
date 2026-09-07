/**
 * Component test for the SortDropdown thin wrapper. Stays thin too — asserts the
 * current label, the full option list, and that selection forwards the value.
 */
import { describe, it, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { SortDropdown, SORT_OPTIONS } from "../components/SortDropdown";

describe("SortDropdown", () => {
  it("renders the current sort option's label based on the value prop", () => {
    renderWithProviders(<SortDropdown value="newest" onChange={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Newest" })
    ).toBeInTheDocument();
  });

  it("defaults to the first option when no value is provided", () => {
    renderWithProviders(<SortDropdown onChange={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: SORT_OPTIONS[0].label })
    ).toBeInTheDocument();
  });

  it("shows all 5 sort options when opened", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SortDropdown value="popular" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Most Popular" }));

    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    expect(screen.getByRole("menuitem", { name: "Newest" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Highest Rated" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Shortest Duration" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Longest Duration" })
    ).toBeInTheDocument();
  });

  it("calls onChange with the correct value when a different option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SortDropdown value="popular" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Most Popular" }));
    await user.click(screen.getByRole("menuitem", { name: "Newest" }));

    expect(onChange).toHaveBeenCalledWith("newest");
  });
});