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