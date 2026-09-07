/**
 * Raw Supabase queries for course data — the ONLY file that calls
 * supabase.from('courses')... for read operations used by the public
 * discovery feature. Hooks call these; these functions contain no React logic.
 */
import { supabase } from "../../../services/apiClient";

const SORT_MAP = {
  newest: ["created_at", false],
  popular: ["enrollment_count", false],
  rating: ["rating", false],
  shortest: ["duration_minutes", true],
  longest: ["duration_minutes", false],
};

export async function getCourses({
  page = 1,
  limit = 12,
  search,
  category,
  difficulty,
  sortBy,
} = {}) {
  let query = supabase
    .from("courses")
    .select("*", { count: "exact" })
    .eq("status", "published"); // only published courses are publicly visible

  if (search) query = query.ilike("title", `%${search}%`);
  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", difficulty);

  if (sortBy && SORT_MAP[sortBy]) {
    const [column, ascending] = SORT_MAP[sortBy];
    query = query.order(column, { ascending });
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  return query; // resolves to { data, count, error }
}

export async function getFeaturedCourses(limit = 6) {
  // Same base query, top-rated by default (a dedicated `featured` boolean
  // column can be swapped in later if the schema has one).
  return supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .order("rating", { ascending: false })
    .limit(limit);
}

export async function getCategories() {
  return supabase.from("categories").select("*");
}

/**
 * EDGE CASES / NOTES:
 * - Every function returns { data, error, count? } consistently — never throws
 *   raw Supabase errors (same convention as authApi.js).
 * - search/category/difficulty are optional — the corresponding .eq()/.ilike()
 *   call is omitted entirely when not provided.
 * - RLS: the courses table's SELECT policy must allow public (unauthenticated)
 *   reads for status='published' rows — backend/Supabase policy checklist item,
 *   not something this file can fix client-side.
 */

export async function getCourseById(courseId) {
  // Nested select pulls instructor profile + full curriculum structure in ONE
  // request. Verify actual Supabase relationship/foreign-key names match the
  // real schema when wiring up against the backend.
  return supabase
    .from("courses")
    .select(
      `*,
      instructor:profiles(id, name, bio, avatar_url),
      modules:course_modules(
        id, title, order,
        lessons:lessons(id, title, order, duration_minutes, is_preview)
      )`
    )
    .eq("id", courseId)
    .eq("status", "published")
    .single();
}

export async function getEnrollmentStatus(courseId, userId) {
  // maybeSingle, not single — "not enrolled" is a normal, expected outcome,
  // so it returns null instead of erroring when no enrollment row exists.
  return supabase
    .from("enrollments")
    .select("id, progress_percent")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
}

export async function getRelatedCourses(courseId, category, limit = 4) {
  return supabase
    .from("courses")
    .select("*")
    .eq("category", category)
    .eq("status", "published")
    .neq("id", courseId)
    .limit(limit);
}

/**
 * ADDITIONAL EDGE CASES:
 * - getCourseById returning no row (deleted/unpublished/bad id) -> data is
 *   null with a Postgrest "no rows" error from .single() (error.code
 *   'PGRST116') — the hook layer must distinguish this from a real server
 *   error and map it to a "Course not found" state (404-style page), not a
 *   generic ErrorState with retry (retrying won't fix a course that doesn't
 *   exist).
 * - getEnrollmentStatus is only called with a truthy userId — guests skip it
 *   entirely (the hook layer handles this conditional, not this function).
 */


export async function enrollInCourse(courseId, userId) {
  return supabase
    .from("enrollments")
    .insert({
      course_id: courseId,
      user_id: userId,
      progress_percent: 0,
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();
}

/**
 * ENROLLMENT EDGE CASES:
 * - Duplicate enrollment attempt (double-click, or a stale UI state while
 *   already enrolled) -> relies on a UNIQUE constraint on (course_id,
 *   user_id) at the DB level; Supabase then returns error code 23505. The hook
 *   layer maps this to a friendly "already enrolled" soft-success, not an
 *   error, since it's a harmless race.
 * - This function does NOT check whether the course exists/is published —
 *   that's guaranteed by the fact the user is looking at a loaded
 *   CourseDetailsPage; RLS on enrollments should still enforce
 *   user_id = auth.uid() as a security boundary.
 */