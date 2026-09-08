/**
 * Raw Supabase queries for the IN-USE learning experience — lesson content,
 * resume-point tracking, and atomic progress updates. Lives in its own
 * features/learning/ folder (distinct from features/courses/) because this is a
 * genuinely different domain concern: courses/ handles discovery/browsing/
 * enrollment (public-facing, catalog-oriented), while this folder handles the
 * in-progress consumption experience (lesson content, progress tracking, quiz
 * gating). Every function returns { data, error } — never throws.
 */
import { supabase } from "../../../services/apiClient";

export async function getLessonContent(lessonId) {
  // Full lesson content + enough module/course context for breadcrumbs, in one
  // request. Verify Supabase relationship/foreign-key names against the real
  // schema when wiring up the backend.
  return supabase
    .from("lessons")
    .select("*, module:course_modules(course_id, title)")
    .eq("id", lessonId)
    .single();
}

export async function getCourseProgress(courseId, userId) {
  // last_lesson_id powers "resume where I left off": when /learn/:courseId is
  // opened with NO :lessonId in the URL, LearningPage redirects to
  // /learn/:courseId/:lastLessonId if one exists, else the first lesson of the
  // first module. Edges: not enrolled/null last_lesson_id are normal (redirect
  // falls back), so .single() returning PGRST116 maps to that in the caller.
  return supabase
    .from("enrollments")
    .select("progress_percent, last_lesson_id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .single();
}

/**
 * Marking a lesson complete is TWO state changes (lesson_progress row + the
 * enrollment's overall progress_percent) that must not race, so the client does
 * NOT compute percentages with separate read-then-write calls — it calls ONE
 * server-side transaction. Backend/SQL ticket: create the `mark_lesson_complete`
 * Postgres function handling the lesson_progress upsert (idempotent — re-marking
 * a completed lesson is fine) AND the percent recalculation atomically.
 */
export async function markLessonComplete(userId, courseId, lessonId) {
  const rpcResult = await supabase.rpc("mark_lesson_complete", {
    p_user_id: userId,
    p_lesson_id: lessonId,
  });
  if (rpcResult.error) return rpcResult;

  // Also touch last_accessed_at so My Learning (Phase 4) sorts this course to
  // the top of "continue where I left off". Independent single write — not part
  // of the transactional recalc, so fine to do client-side after the RPC.
  return supabase
    .from("enrollments")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("course_id", courseId)
    .eq("user_id", userId);
}

/**
 * Lighter-weight than markLessonComplete — called whenever a lesson is OPENED
 * (not just completed), so "resume" always points at the most recently VIEWED
 * lesson, not merely the last COMPLETED one. Deliberately pure bookkeeping.
 */
export async function updateLastAccessed(userId, courseId, lessonId) {
  return supabase
    .from("enrollments")
    .update({
      last_lesson_id: lessonId,
      last_accessed_at: new Date().toISOString(),
    })
    .eq("course_id", courseId)
    .eq("user_id", userId);
}