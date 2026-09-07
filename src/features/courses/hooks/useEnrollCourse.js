/**
 * Mutation hook for the enroll action — minimal version for Phase 3's
 * EnrollmentCTA. Phase 4 may add related hooks (useMyEnrollments etc.); decide
 * whether to keep this in features/courses or promote to a features/enrollment
 * folder then (per Rule 8: don't decide prematurely).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as coursesApi from "../api/coursesApi";

export function useEnrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId) =>
      coursesApi.enrollInCourse(courseId, user.id).then(({ data, error }) => {
        if (error) {
          // 23505 = UNIQUE constraint violation on (course_id, user_id) —
          // already enrolled. Treat as a soft-success (not a throw) so the
          // onSuccess path runs and the UI proceeds to "Continue Learning".
          if (error.code === "23505") {
            return { alreadyEnrolled: true };
          }
          throw new Error("Failed to enroll. Please try again.");
        }
        return data;
      }),
    onSuccess: (_data, courseId) => {
      // Invalidate THIS course's enrollment-status query so EnrollmentCTA
      // immediately re-renders as "Continue Learning" without a page reload.
      queryClient.invalidateQueries({
        queryKey: ["enrollment", courseId, user.id],
      });
    },
  });
}