/**
 * Sort control for the Courses Listing — thin feature-specific wrapper around
 * the generic <Dropdown> primitive with course-specific sort options.
 */
import { Dropdown } from "../../../components/ui/Dropdown/Dropdown";
import { Button } from "../../../components/ui/Button/Button";

// eslint-disable-next-line react-refresh/only-export-components
export const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Highest Rated", value: "rating" },
  { label: "Shortest Duration", value: "shortest" },
  { label: "Longest Duration", value: "longest" },
];

export function SortDropdown({ value, onChange }) {
  const current =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  return (
    <Dropdown
      trigger={
        <Button variant="outlined" size="sm">
          {current.label}
        </Button>
      }
      items={SORT_OPTIONS}
      onSelect={onChange}
    />
  );
}