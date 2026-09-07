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
// /**
//  * FILE: src/features/courses/hooks/useCourseDetails.js
//  * PURPOSE: Fetches full course detail data for the Course Details page.
//  *
//  * SIGNATURE: export function useCourseDetails(courseId) -> useQuery result
//  *
//  * STEPS:
//  *    1. useQuery({
//  *         queryKey: ['course', courseId],
//  *         queryFn: () => coursesApi.getCourseById(courseId).then(({data,error}) => {
//  *            if (error) {
//  *              if (error.code === 'PGRST116' /* no rows found, verify actual code */) {
//  *                 throw new NotFoundError('Course not found');  // custom error class
//  *                 // or simply throw new Error('NOT_FOUND') and check message —
//  *                 // decide the pattern and use it consistently across the app
//  *              }
//  *              throw new Error('Failed to load course');
//  *            }
//  *            return data;
//  *         }),
//  *         enabled: !!courseId,   // don't fire if courseId is somehow undefined
//  *         retry: (failureCount, error) => error.message !== 'NOT_FOUND' && failureCount < 1,
//  *           // don't retry a genuine 404, DO allow one retry for real transient errors
//  *       })
//  *
//  * EDGE CASES:
//  *    - The NOT_FOUND vs generic-error distinction matters a lot for UX: page
//  *      component needs to render a distinct "Course not found, browse other
//  *      courses" state vs the standard ErrorState-with-retry — plan for this
//  *      branch explicitly in CourseDetailsPage.
//  *
//  * TESTING NOTES: returns course data on success, throws/surfaces NOT_FOUND
//  * distinctly from generic error on a missing course, does not retry on
//  * NOT_FOUND, retries once on a genuine 500.
//  */