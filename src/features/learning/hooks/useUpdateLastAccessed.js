/**
 * Fire-and-forget-style mutation for "resume" bookkeeping — called
 * automatically from a useEffect inside LearningPage whenever lessonId changes
 * (NOT from a button click), even when the lesson isn't completed, so resume
 * always points at the most recently VIEWED lesson.
 *
 * Deliberately NO onSuccess invalidation of courseProgress/myEnrollments here:
 * merely VIEWING a lesson doesn't change progress_percent, only
 * last_accessed_at (which mainly affects My Learning's sort order and is fine
 * to catch up on that page's next natural refetch rather than an aggressive
 * invalidation on every lesson view).
 */
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as learningApi from "../api/learningApi";

export function useUpdateLastAccessed() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ courseId, lessonId }) =>
      learningApi.updateLastAccessed(user.id, courseId, lessonId),
    onError: (error) => {
      // Background bookkeeping call — a failure should never interrupt the
      // learner's flow, so log it and move on (no user-facing error UI).
      console.warn("Failed to update last_accessed_at:", error?.message ?? error);
    },
  });
}