/**
 * LearningControlsBar — the primary interaction surface of the learning
 * interface: Previous / Next lesson navigation plus the Mark Complete action.
 * Note: "update last accessed" is deliberately NOT triggered here — this bar
 * only navigates; the last-accessed side effect is the parent LearningPage's
 * useEffect, the single source of truth for it across all navigation entry
 * points (sidebar AND these buttons).
 *
 * End-of-course edge (first-pass minimum): Next is simply disabled when
 * nextLesson is null at the end of the last module; the sidebar still allows
 * navigation. A richer "completion celebration / certificate" flow is a
 * nice-to-have, not launch-blocking.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button/Button";

export function LearningControlsBar({
  prevLesson,
  nextLesson,
  isCompleted,
  onMarkComplete,
  isMarking,
  courseId,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant="outlined"
        disabled={!prevLesson}
        onClick={() => navigate(`/learn/${courseId}/${prevLesson.id}`)}
      >
        &#8592; Previous
      </Button>

      <Button
        variant={isCompleted ? "outlined" : "filled"}
        onClick={onMarkComplete}
        isLoading={isMarking}
        disabled={isCompleted}
      >
        {isCompleted ? "\u2713 Completed" : "Mark Complete"}
      </Button>

      <Button
        variant="filled"
        disabled={!nextLesson}
        onClick={() => navigate(`/learn/${courseId}/${nextLesson.id}`)}
      >
        Next &#8594;
      </Button>
    </div>
  );
}