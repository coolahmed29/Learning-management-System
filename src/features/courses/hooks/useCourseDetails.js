/**
 * TanStack Query hook for the Course Details page — fetches the full course
 * (course row + instructor profile + curriculum modules/lessons) in one request
 * via coursesApi.getCourseById. The ONLY way CourseDetailsPage loads detail data
 * (Rule 9: Component -> Hook -> TanStack Query -> API function -> API client).
 */
import { useQuery } from "@tanstack/react-query";
import * as coursesApi from "../api/coursesApi";
import { NotFoundError } from "../../../lib/errors";

export function useCourseDetails(courseId) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () =>
      coursesApi.getCourseById(courseId).then(({ data, error }) => {
        if (error) {
          // .single() surfaces PGRST116 when no published row exists —
          // a real 404-style condition, distinct from a transient failure.
          if (error.code === "PGRST116") {
            throw new NotFoundError("Course not found");
          }
          throw new Error("Failed to load course");
        }
        return data;
      }),
    // Don't fire if courseId is somehow still undefined.
    enabled: !!courseId,
    // Never retry a genuine 404; DO allow one retry for real transient errors.
    retry: (failureCount, error) =>
      !(error instanceof NotFoundError) && failureCount < 1,
  });
}