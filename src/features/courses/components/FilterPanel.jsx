/**
 * Category/Difficulty filter controls for the Courses Listing — inline sidebar
 * on desktop, a "Filters" button opening the same content in a <Modal> on mobile.
 * Controlled component: filter state lives in the page (URL-synced).
 */
import { useState } from "react";
import clsx from "clsx";
import { useIsMobile } from "../../../hooks/useMediaQuery";
import { Button } from "../../../components/ui/Button/Button";
import { Modal } from "../../../components/ui/Modal/Modal";

const DIFFICULTIES = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "rounded-pill border px-3 py-1.5 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue",
        active
          ? "border-apple-blue bg-apple-blue/5 text-apple-blue"
          : "border-mist text-smoke hover:bg-frost"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({ title, options, activeValue, onToggle, disabled }) {
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-medium text-smoke">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = activeValue === option.value;
          return (
            <Chip
              key={option.value}
              active={isActive}
              onClick={() => onToggle(isActive ? null : option.value)}
            >
              {option.label}
            </Chip>
          );
        })}
      </div>
      {disabled && (
        <p className="mt-1 text-caption text-mist">No categories available yet.</p>
      )}
    </fieldset>
  );
}

export function FilterPanel({ filters, onFilterChange, categories = [], onClearAll }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Boolean(filters.category || filters.difficulty);

  const categoryOptions = categories.map((category) => ({
    value: category.name ?? category.id,
    label: category.name ?? category.id,
  }));

  const content = (
    <div className="flex flex-col gap-6">
      <FilterGroup
        title="Category"
        options={categoryOptions}
        activeValue={filters.category}
        onToggle={(value) => onFilterChange("category", value)}
        disabled={categoryOptions.length === 0}
      />
      <FilterGroup
        title="Difficulty"
        options={DIFFICULTIES}
        activeValue={filters.difficulty}
        onToggle={(value) => onFilterChange("difficulty", value)}
      />
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="self-start text-body-sm font-medium text-link-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue"
        >
          Clear all
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button variant="outlined" size="sm" onClick={() => setIsOpen(true)}>
          Filters{hasActiveFilters ? " •" : ""}
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Filters"
        >
          {content}
        </Modal>
      </>
    );
  }

  return <div>{content}</div>;
}