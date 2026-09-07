/**
 * Generic horizontal progress bar — apple-blue fill over a pebble track.
 * Generic enough (enrollment/course/quiz/lesson progress) to live in
 * components/ui/ rather than feature-local (Rule 4).
 */
import clsx from "clsx";

export function ProgressBar({ value = 0, max = 100, className }) {
  const raw = max > 0 ? (value / max) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, raw));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(clamped)}
      className={clsx("h-2 w-full overflow-hidden rounded-full bg-pebble", className)}
    >
      <div
        className="h-full rounded-full bg-apple-blue transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}