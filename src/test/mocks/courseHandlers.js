/**
 * MSW request handler builders for the public course-discovery endpoints.
 * Tests register these via `server.use(...)` per file; setup.js's afterEach
 * resetHandlers() clears them between tests. The courses handler is DYNAMIC —
 * it parses the real Supabase REST query params (status/title/category/
 * difficulty/order) and the `Range` request header, then returns a matching
 * slice with a `Content-Range` total so `.select("*", { count: "exact" })`
 * resolves a correct totalCount. This lets hook/component tests assert real
 * filtering/pagination behavior, not just "a request happened".
 */
import { http, HttpResponse } from "msw";
import {
  buildCourse,
  buildCourseCatalog,
  MOCK_CATEGORIES,
} from "../factories";

/**
 * Parse a Supabase REST filter param like "eq.Development" or
 * "ilike.%react%" (postgrest-js v2 encodes `%` wildcards as %25; `*` is
 * accepted too). Strips the operator prefix and all wildcard chars.
 */
function stripOperator(value, operator) {
  if (!value) return "";
  return value
    .replace(new RegExp(`^${operator}\\.`), "")
    .replace(/[%*]/g, "");
}

function parseOrder(order) {
  if (!order) return null;
  const [column, direction] = order.split(".");
  return { column, ascending: direction === "asc" };
}

function filterRows(rows, searchParams) {
  const status = stripOperator(searchParams.get("status"), "eq");
  const search = stripOperator(searchParams.get("title"), "ilike");
  const category = stripOperator(searchParams.get("category"), "eq");
  const difficulty = stripOperator(searchParams.get("difficulty"), "eq");

  return rows.filter((course) => {
    if (status && course.status !== status) return false;
    if (search && !course.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category && course.category !== category) return false;
    if (difficulty && course.difficulty !== difficulty) return false;
    return true;
  });
}

function sortRows(rows, order) {
  if (!order) return rows;
  return [...rows].sort((a, b) => {
    const aVal = toSortable(a[order.column]);
    const bVal = toSortable(b[order.column]);
    if (aVal.num != null && bVal.num != null) {
      if (aVal.num < bVal.num) return order.ascending ? -1 : 1;
      if (aVal.num > bVal.num) return order.ascending ? 1 : -1;
      return 0;
    }
    const aStr = aVal.str;
    const bStr = bVal.str;
    if (aStr < bStr) return order.ascending ? -1 : 1;
    if (aStr > bStr) return order.ascending ? 1 : -1;
    return 0;
  });
}

function toSortable(value) {
  if (typeof value === "number") return { num: value, str: "" };
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return { num: Date.parse(value), str: "" };
  }
  return { num: undefined, str: value ?? "" };
}

// postgrest-js v2 sends .range(from, to) as `offset` + `limit` URL params
// (verified in node_modules/@supabase/postgrest-js — not the Range header).
function parseRange(searchParams) {
  const offset = searchParams.get("offset");
  const limit = searchParams.get("limit");
  if (offset == null) return null;
  return {
    start: parseInt(offset, 10),
    end: parseInt(offset, 10) + parseInt(limit ?? 0, 10) - 1,
  };
}

/**
 * @param {object} [options]
 * @param {Array}  [options.catalog] course rows to serve (default: 30-course catalog)
 * @param {Function} [options.onRequest] called with the parsed request info —
 *        useful for asserting request params/counts (URL, range, order).
 */
export function createCoursesHandler({ catalog, onRequest } = {}) {
  const rows = catalog ?? buildCourseCatalog();
  return http.get("*/rest/v1/courses", ({ request }) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    let result = filterRows(rows, searchParams);
    const order = parseOrder(searchParams.get("order"));
    result = sortRows(result, order);

    const total = result.length;
    const range = parseRange(searchParams);
    const start = range?.start ?? 0;
    const end = range?.end ?? total - 1;
    const page = result.slice(start, end + 1);

    if (onRequest) {
      onRequest({ url, order, range, start, end });
    }

    return HttpResponse.json(page, {
      headers: { "Content-Range": `${start}-${end}/${total}` },
    });
  });
}

export function createCategoriesHandler({ categories } = {}) {
  return http.get("*/rest/v1/categories", () =>
    HttpResponse.json(categories ?? MOCK_CATEGORIES)
  );
}

/**
 * @param {object} [options]
 * @param {object} [options.course] full course row (incl. nested instructor +
 *        modules/lessons) to return for the matching id
 * @param {string} [options.expectedId] id the handler expects ("course-1"); any
 *        other requested id returns PostgREST's PGRST116 (single-row no-match)
 * @param {Function} [options.onRequest] receives the requested course id
 */
export function createCourseDetailHandler({ course, expectedId, onRequest } = {}) {
  const row = course ?? buildCourse(0);
  return http.get("*/rest/v1/courses", ({ request }) => {
    const raw = new URL(request.url).searchParams.get("id") ?? "";
    const id = raw.replace(/^eq\./, "");
    if (onRequest) onRequest(id);
    if (expectedId && id !== expectedId) {
      return HttpResponse.json(
        { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: "The result contains 0 rows", hint: "" },
        { status: 406 }
      );
    }
    return HttpResponse.json(row);
  });
}

/**
 * GET enrollments for a user/course — mirrors getEnrollmentStatus's
 * maybeSingle shape: a 200 with `[]` means "not enrolled" (data -> null).
 * @param {object} [options]
 * @param {Array}  [options.rows] enrollment rows to return
 * @param {Function} [options.onRequest] receives parsed { courseId, userId }
 */
export function createEnrollmentStatusHandler({ rows = [], onRequest } = {}) {
  return http.get("*/rest/v1/enrollments", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    if (onRequest) {
      onRequest({
        courseId: (searchParams.get("course_id") ?? "").replace("eq.", ""),
        userId: (searchParams.get("user_id") ?? "").replace("eq.", ""),
      });
    }
    return HttpResponse.json(rows);
  });
}

/**
 * POST enrollments — the enroll-in-course mutation endpoint.
 * @param {object} [options]
 * @param {string} [options.mode] 'success' (default) | 'duplicate' (23505) |
 *        'error' (500)
 * @param {object} [options.row] the created row returned on success
 * @param {Function} [options.onRequest] receives the posted body
 */
export function createEnrollCourseHandler({ mode = "success", row, onRequest } = {}) {
  return http.post("*/rest/v1/enrollments", async ({ request }) => {
    if (onRequest) onRequest(await request.json());
    if (mode === "duplicate") {
      return HttpResponse.json(
        { code: "23505", message: "duplicate key value violates unique constraint", details: "Key (course_id, user_id) already exists.", hint: "" },
        { status: 406 }
      );
    }
    if (mode === "error") {
      return HttpResponse.json({ message: "boom" }, { status: 500 });
    }
    return HttpResponse.json(row ?? {
      course_id: "course-1",
      user_id: "user-1",
      progress_percent: 0,
    });
  });
}