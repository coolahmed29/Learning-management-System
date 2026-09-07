/**
 * TanStack Query hook that checks whether the CURRENT logged-in user is already
 * enrolled in this course — drives EnrollmentCTA's "Enroll Now" vs "Continue
 * Learning" branching. Guest (unauthenticated) users skip this entirely and
 * always see "Enroll Now" (which redirects to login).
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as coursesApi from "../api/coursesApi";

export function useEnrollmentStatus(courseId) {
  const { user, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["enrollment", courseId, user?.id],
    queryFn: () =>
      coursesApi
        .getEnrollmentStatus(courseId, user.id)
        .then(({ data, error }) => {
          if (error) throw new Error("Failed to load enrollment status");
          return data;
        }),
    // CRITICAL: only runs the query when the user is actually logged in —
    // guests never hit this endpoint at all (public course, auth-only
    // enrollment access pattern).
    enabled: isAuthenticated && !!courseId,
  });

  // Shaped return rather than the raw query result — the consuming component
  // (EnrollmentCTA) cares about these derived booleans, not query mechanics.
  // A disabled (guest) query reports isLoading as false in TanStack Query v5,
  // so guests immediately get { isEnrolled: false, isLoading: false }.
  return {
    isEnrolled: Boolean(query.data),
    progressPercent: query.data?.progress_percent ?? 0,
    isLoading: query.isLoading,
  };
}