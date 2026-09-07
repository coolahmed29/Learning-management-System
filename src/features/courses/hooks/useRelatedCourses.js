/**
 * TanStack Query hook for RelatedCoursesSection — fetches courses sharing the
 * current course's category, excluding the course itself, via
 * coursesApi.getRelatedCourses. The ONLY way the section fetches related data.
 */
import { useQuery } from "@tanstack/react-query";
import * as coursesApi from "../api/coursesApi";

export function useRelatedCourses(courseId, category) {
  return useQuery({
    queryKey: ["relatedCourses", courseId, category],
    queryFn: () =>
      coursesApi
        .getRelatedCourses(courseId, category)
        .then(({ data, error }) => {
          if (error) throw new Error("Failed to load related courses");
          return data;
        }),
    // Depends on the parent course's category being known first — the page
    // sequences useCourseDetails -> useRelatedCourses by passing the resolved
    // category in as an argument. Not a TanStack-level dependent query, just an
    // enabled-driven one.
    enabled: !!category,
  });
}