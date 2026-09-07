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