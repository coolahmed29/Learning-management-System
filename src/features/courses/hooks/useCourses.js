/**
 * TanStack Query hook wrapping coursesApi.getCourses — the ONLY way
 * CoursesListPage/CourseGrid fetches course list data (Rule 9: Component
 * -> Hook -> TanStack Query -> API function -> API client).
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as coursesApi from "../api/coursesApi";

export function useCourses({ page, limit, search, category, difficulty, sortBy }) {
  return useQuery({
    queryKey: ["courses", { page, limit, search, category, difficulty, sortBy }],
    queryFn: () =>
      coursesApi
        .getCourses({ page, limit, search, category, difficulty, sortBy })
        .then(({ data, error, count }) => {
          if (error) throw new Error("Failed to load courses");
          return { courses: data, totalCount: count };
        }),
    // Prevents a full loading-state flash when only page/filter changes —
    // old data stays visible while new data loads (better pagination UX).
    placeholderData: keepPreviousData,
  });
}