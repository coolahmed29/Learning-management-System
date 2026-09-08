/**
 * Mutation hook for marking a lesson complete — drives the "Mark Complete"
 * button and auto-advances progress everywhere it's displayed (sidebar
 * checkmarks, progress bar, My Learning list).
 *
 * The onSuccess invalidation set is the SECOND cross-phase integration point in
 * the app (after Phase 4's enroll-invalidates-myEnrollments fix): an action in
 * one feature must invalidate query keys owned by others. Project-wide
 * convention: whenever a mutation changes progress/enrollment data, invalidate
 * the FULL set of query key families that could display that data — not just
 * the one most obviously related to the current screen (Phase 6 Quiz completion
 * will need similar treatment).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as learningApi from "../api/learningApi";

export function useMarkComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, lessonId }) =>
      learningApi.markLessonComplete(user.id, courseId, lessonId),
    onSuccess: (_data, { courseId }) => {
      // Sidebar checkmarks / resume state (this feature).
      queryClient.invalidateQueries({ queryKey: ["courseProgress", courseId] });
      // Phase 3 CTA ("Continue Learning (x%)" on Course Details reads this).
      queryClient.invalidateQueries({
        queryKey: ["enrollment", courseId, user.id],
      });
      // Phase 4 My Learning list — progress % is displayed right on the card.
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
    },
  });
}