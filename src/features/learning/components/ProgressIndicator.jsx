/**
 * ProgressIndicator — thin top-bar indicator of overall course completion,
 * reusing the ProgressBar primitive (sm variant) from Phase 4 plus a
 * "{progressPercent}% complete" caption. Thin wrapper: the browser progress
 * semantics/aria live in ProgressBar itself, which is already tested.
 */
import { ProgressBar } from "../../../components/ui/ProgressBar/ProgressBar";

export function ProgressIndicator({ progressPercent = 0 }) {
  return (
    <div className="flex w-full items-center gap-3">
      <ProgressBar value={progressPercent} size="sm" className="flex-1" />
      <span className="shrink-0 text-caption text-ash">
        {progressPercent}% complete
      </span>
    </div>
  );
}