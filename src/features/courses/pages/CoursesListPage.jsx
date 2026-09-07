/**
 * Route-level page for /courses — owns ALL discovery state (search, filters,
 * sort, pagination) synced to URL query params, and composes the 4 required
 * states (loading / success / error / empty).
 */
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useCourses } from "../hooks/useCourses";
import { useCategories } from "../hooks/useCategories";
import { SearchBar } from "../components/SearchBar";
import { SortDropdown } from "../components/SortDropdown";
import { FilterPanel } from "../components/FilterPanel";
import { CourseCard } from "../components/CourseCard";
import { CourseCardSkeleton } from "../components/CourseCardSkeleton";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { Pagination } from "../../../components/ui/Pagination/Pagination";
import { useTheme } from "../../../providers/ThemeProvider";
import {
  staggerContainerVariants,
  staggerContainerVariantsReduced,
  getMotionProps,
} from "../../../animations";

const LIMIT = 12;

export function CoursesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const sortBy = searchParams.get("sortBy") ?? "popular";

  const { data, isLoading, isError, refetch } = useCourses({
    page,
    limit: LIMIT,
    search,
    category,
    difficulty,
    sortBy,
  });
  const { data: categories } = useCategories();
  const { prefersReducedMotion } = useTheme();

  const stagger = getMotionProps(
    staggerContainerVariants,
    staggerContainerVariantsReduced,
    prefersReducedMotion
  );

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  function updateParams(updates, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams);
    if (resetPage) next.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next);
  }

  function handleSearchChange(value) {
    updateParams({ search: value }, { resetPage: true });
  }

  function handleFilterChange(key, value) {
    updateParams({ [key]: value }, { resetPage: true });
  }

  function handleSortChange(value) {
    updateParams({ sortBy: value }, { resetPage: true });
  }

  function handlePageChange(nextPage) {
    updateParams({ page: nextPage }, { resetPage: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleClearAll() {
    setSearchParams(new URLSearchParams());
  }

  const hasResults = data?.courses?.length > 0;

  return (
    <section className="px-6 py-10">
      <div className="mb-6">
        <h1 className="text-heading font-semibold text-carbon">Courses</h1>
        <p className="mt-1 text-body text-ash">
          Explore our catalog and start learning today.
        </p>
      </div>

      <SearchBar
        onSearchChange={handleSearchChange}
        initialValue={search}
        placeholder="Search courses..."
      />

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <FilterPanel
            filters={{ category, difficulty }}
            onFilterChange={handleFilterChange}
            categories={categories ?? []}
            onClearAll={handleClearAll}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-body-sm text-ash" role="status">
              {hasResults ? `${totalCount} courses` : ""}
            </p>
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {isLoading && (
            <LoadingState
              variant="skeleton"
              SkeletonComponent={CourseCardSkeleton}
              skeletonCount={LIMIT}
            />
          )}

          {isError && (
            <ErrorState
              title="Couldn't load courses"
              message="Something went wrong while fetching courses. Please try again."
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && !hasResults && (
            <EmptyState
              title="No courses found"
              message="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear filters"
              onAction={handleClearAll}
            />
          )}

          {!isLoading && !isError && hasResults && (
            <>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {data.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </motion.div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-10"
              />
            </>
          )}
        </main>
      </div>
    </section>
  );
}