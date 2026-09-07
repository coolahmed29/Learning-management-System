/**
 * Component tests for CourseCurriculumAccordion — the lock/unlock logic in
 * LessonRow is the core business rule: everything non-preview stays locked
 * until the viewer is enrolled. Renders with the shared providers; no network.
 */
import { describe, it, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/test-utils";
import { CourseCurriculumAccordion } from "../components/CourseCurriculumAccordion";

const modules = [
  {
    id: "m1",
    title: "Getting Started",
    lessons: [
      { id: "l1", title: "Welcome to React", duration_minutes: 10, is_preview: true },
      { id: "l2", title: "Setting Up Vite", duration_minutes: 15, is_preview: false },
    ],
  },
  {
    id: "m2",
    title: "Core Concepts",
    lessons: [{ id: "l3", title: "Components", duration_minutes: 20, is_preview: false }],
  },
];

const SUMMARY_MODULES = [
  {
    id: "m3",
    title: "Wrapping Up",
    lessons: [
      { id: "s1", title: "One", duration_minutes: 10, is_preview: false },
      { id: "s2", title: "Two", duration_minutes: 20, is_preview: false },
      { id: "s3", title: "Three", duration_minutes: 45, is_preview: false },
    ],
  },
];

const lockedLessonTitle = "Setting Up Vite";

describe("CourseCurriculumAccordion", () => {
  it("renders all modules collapsed initially", () => {
    renderWithProviders(<CourseCurriculumAccordion modules={modules} />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Core Concepts")).toBeInTheDocument();
    expect(screen.queryByText("Welcome to React")).not.toBeInTheDocument();
    expect(screen.queryByText(lockedLessonTitle)).not.toBeInTheDocument();
  });

  it("expands a module on header click and collapses it on a second click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CourseCurriculumAccordion modules={modules} />);

    const header = screen.getByRole("button", { name: /Getting Started/i });
    expect(header).toHaveAttribute("aria-expanded", "false");

    await user.click(header);
    expect(screen.getByText("Welcome to React")).toBeInTheDocument();
    expect(screen.getByText(lockedLessonTitle)).toBeInTheDocument();
    expect(header).toHaveAttribute("aria-expanded", "true");

    await user.click(header);
    expect(screen.queryByText("Welcome to React")).not.toBeInTheDocument();
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("isEnrolled=false -> non-preview lessons are locked (badge + aria-disabled) and not clickable", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CourseCurriculumAccordion modules={modules} />);

    await user.click(screen.getByRole("button", { name: /Getting Started/i }));

    const lockedRow = screen.getByText(lockedLessonTitle).closest("li");
    expect(lockedRow).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Locked")).toBeInTheDocument();
    // Not clickable: not wrapped in a link or button.
    expect(screen.getByText(lockedLessonTitle).closest("button, a")).toBeNull();
  });

  it("isEnrolled=false -> preview lessons stay visually unlocked with a Preview badge (no Locked badge)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CourseCurriculumAccordion modules={modules} />);

    await user.click(screen.getByRole("button", { name: /Getting Started/i }));

    const previewRow = screen.getByText("Welcome to React").closest("li");
    expect(previewRow).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getAllByText("Locked")).toHaveLength(1); // only the non-preview lesson
  });

  it("isEnrolled=true -> every lesson renders unlocked regardless of isPreview", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CourseCurriculumAccordion modules={modules} isEnrolled />
    );

    await user.click(screen.getByRole("button", { name: /Getting Started/i }));

    expect(screen.queryByText("Locked")).not.toBeInTheDocument();
    expect(screen.getByText(lockedLessonTitle).closest("li")).not.toHaveAttribute(
      "aria-disabled"
    );
    // Preview is still labelled, just not locked.
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("summarizes lesson count and aggregated duration correctly", () => {
    renderWithProviders(<CourseCurriculumAccordion modules={SUMMARY_MODULES} />);

    expect(screen.getByText("3 lessons")).toBeInTheDocument();
    // 10 + 20 + 45 = 75 minutes -> formatted as "1 hr 15 min".
    expect(screen.getByText("1 hr 15 min")).toBeInTheDocument();
  });
});