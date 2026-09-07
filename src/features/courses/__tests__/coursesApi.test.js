/**
 * UNIT TESTS: coursesApi.js
 *
 * DECISION (documented per the stub's instruction, instead of forcing
 * artificial unit tests):
 *
 * coursesApi.js is currently a thin wrapper around the Supabase query builder —
 * every function chains .eq()/.ilike()/.order()/.range() calls on the live
 * client and returns whatever the transport produces. The only "pure" logic it
 * contains is the module-private `SORT_MAP` (sortBy -> { column, ascending }),
 * which is deliberately NOT exported and has no side-effect-free public surface
 * to assert against.
 *
 * Therefore this file is intentionally minimal/skipped. The same behavior is
 * covered end-to-end by useCourses.test.js, which asserts, against a dynamic
 * MSW handler, the exact order clauses each sortBy produces (newest / popular /
 * rating / shortest / longest) plus the "unknown sortBy -> no order clause"
 * fallback. The parsing of query params (category/difficulty/search) and page
 * ranges is likewise covered there and in courses.integration.test.jsx, where
 * the real page calls these functions.
 *
 * If A pure `buildSortClause(sortBy)` helper is ever extracted and exported,
 * replace the skip below with direct assertions on it for each SORT_MAP entry
 * and the default fallback for unknown values.
 */
import { describe, it } from "vitest";

describe.skip("coursesApi (pure logic)", () => {
  it.skip(
    "no exported pure helper exists — sort mapping is covered via useCourses tests",
    () => {}
  );
});