/**
 * "What you'll learn" list within Course Details' Overview tab — simple, purely
 * presentational, no interactivity. Renders nothing when there are no outcomes
 * (no empty heading with an empty list beneath it).
 */
export function LearningOutcomesSection({ outcomes = [] }) {
  if (outcomes.length === 0) return null;

  return (
    <section>
      <h3 className="text-subheading font-semibold text-carbon">
        What you&apos;ll learn
      </h3>
      <ul className="mt-3 grid gap-2 text-body-sm text-ash sm:grid-cols-2">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-2">
            {/* Simple checkmark line-icon — minimal iconography, no decoration. */}
            <CheckIcon />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0 text-link-blue"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}