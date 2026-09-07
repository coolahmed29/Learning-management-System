/**
 * Simple TanStack Query hook for the category list — used by FilterPanel and
 * the Landing Page's CategoriesSection.
 */
import { useQuery } from "@tanstack/react-query";
import * as coursesApi from "../api/coursesApi";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      coursesApi.getCategories().then(({ data, error }) => {
        if (error) throw new Error("Failed to load categories");
        return data;
      }),
    // Categories change rarely — cache longer (10 min) than the global
    // default (per-feature override at the call site, not a global default).
    staleTime: 1000 * 60 * 10,
  });
}