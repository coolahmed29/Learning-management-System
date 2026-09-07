/**
 * Standardized "no data yet" UI — neutral/friendly tone, distinct from ErrorState.
 */
import { Button } from "../ui/Button/Button";

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  const showAction = actionLabel && onAction;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-frost text-graphite">
          {icon}
        </div>
      )}
      <h3 className="text-subheading font-semibold text-graphite">{title}</h3>
      {message && <p className="max-w-sm text-body-sm text-ash">{message}</p>}
      {showAction && (
        <Button variant="outlined" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
