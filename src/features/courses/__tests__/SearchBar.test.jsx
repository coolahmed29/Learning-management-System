/**
 * Component test for SearchBar's debounce behavior and controlled input.
 * Uses vi.useFakeTimers() with fireEvent (no userEvent) — fireEvent's change
 * events don't need timer advancing, and advanceDebounce() manually flushes
 * the real 300ms debounce timer, keeping the suite fast and deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { SearchBar } from "../components/SearchBar";

function advanceDebounce(ms = 300) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with the placeholder text", () => {
    renderWithProviders(<SearchBar onSearchChange={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("Search courses...")
    ).toBeInTheDocument();
  });

  it("updates the visible input value immediately on typing", () => {
    renderWithProviders(<SearchBar onSearchChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "react" },
    });

    expect(screen.getByLabelText("Search courses")).toHaveValue("react");
  });

  it("does not call onSearchChange immediately on keystroke", () => {
    const onSearchChange = vi.fn();
    renderWithProviders(<SearchBar onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "re" },
    });

    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it("calls onSearchChange with the final typed value after the debounce delay", () => {
    const onSearchChange = vi.fn();
    renderWithProviders(<SearchBar onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "react" },
    });
    advanceDebounce();

    expect(onSearchChange).toHaveBeenCalledWith("react");
  });

  it("fires exactly once with only the final value on rapid typing", () => {
    const onSearchChange = vi.fn();
    renderWithProviders(<SearchBar onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "r" },
    });
    advanceDebounce(100);
    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "re" },
    });
    advanceDebounce(100);
    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "react" },
    });
    advanceDebounce();

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("react");
  });

  it("resets the input to empty and notifies after debounce when clear is clicked", () => {
    const onSearchChange = vi.fn();
    renderWithProviders(<SearchBar onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByLabelText("Search courses"), {
      target: { value: "react" },
    });
    advanceDebounce();
    expect(onSearchChange).toHaveBeenCalledWith("react");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByLabelText("Search courses")).toHaveValue("");

    advanceDebounce();
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("pre-fills the input from the initialValue prop", () => {
    renderWithProviders(
      <SearchBar onSearchChange={vi.fn()} initialValue="react" />
    );

    expect(screen.getByLabelText("Search courses")).toHaveValue("react");
  });
});