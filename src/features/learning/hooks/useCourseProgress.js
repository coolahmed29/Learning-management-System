/**
 * Combines the course's curriculum structure + this user's per-lesson
 * completion state into one shaped result, for rendering the
 * CourseCurriculumSidebar's ✓ / → / 🔒 indicators (Rule 8: these sources are
 * ALWAYS consumed together by the LearningPage, so one hook is justified).
 * The enrollment row is folded in here too (resume lastLessonId + overall
 * progressPercent for the ProgressIndicator) to avoid an extra round trip the
 * page would otherwise need just for those two fields.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import * as coursesApi from "../../courses/api/coursesApi";
import { supabase } from "../../../services/apiClient";

export function useCourseProgress(courseId) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["courseProgress", courseId, user?.id],
    queryFn: async () => {
      const [courseResult, progressResult, enrollmentResult] = await Promise.all([
        // Reuse coursesApi.getCourseById's modules shape — the curriculum
        // fetch already exists there; no need to duplicate it in learning/.
        coursesApi.getCourseById(courseId),
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("completed", true),
        // maybeSingle, not single: a not-enrolled user (who the page guards
        // against anyway) yields data: null here, not an error.
        supabase
          .from("enrollments")
          .select("progress_percent, last_lesson_id")
          .eq("course_id", courseId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (courseResult.error) {
        throw new Error("Failed to load curriculum");
      }

      const completedLessonIds = new Set(
        (progressResult.data ?? []).map((row) => row.lesson_id)
      );
      const enrollment = enrollmentResult.data;

      return {
        modules: courseResult.data.modules,
        completedLessonIds,
        lastLessonId: enrollment?.last_lesson_id ?? null,
        progressPercent: enrollment?.progress_percent ?? 0,
        courseTitle: courseResult.data.title ?? "",
      };
    },
    enabled: !!courseId && !!user?.id,
  });
}