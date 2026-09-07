/**
 * TanStack Query hook for the My Learning page — returns every enrollment of
 * the current user (with nested course + progress) for the given statusFilter.
 * Runs behind ProtectedRoute, but also guards on user?.id here for hook-level
 * correctness independent of routing.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as coursesApi from "../api/coursesApi";

export function useMyEnrollments(statusFilter = "all") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["myEnrollments", user?.id, statusFilter],
    queryFn: () =>
      coursesApi
        .getMyEnrollments(user.id, { statusFilter })
        .then(({ data, error }) => {
          if (error) throw new Error("Failed to load your courses");
          return data;
        }),
    enabled: !!user?.id,
  });
}