/**
 * Deterministic mock data factories for tests. A mock course row matches the
 * column shape the courses feature expects (camelCase display fields, snake_case
 * sortable columns used by coursesApi's SORT_MAP) so both the real component tree
 * and the MSW handler behave realistically.
 */

export const MOCK_CATEGORIES = [
  { id: "cat-dev", name: "Development" },
  { id: "cat-design", name: "Design" },
  { id: "cat-business", name: "Business" },
];

export const MOCK_COURSE_TITLES = [
  "React Fundamentals",
  "Advanced React Patterns",
  "JavaScript Beyond Basics",
  "Python for Data Science",
  "TypeScript in Depth",
  "CSS Layout Mastery",
  "UI Design Principles",
  "Figma for Developers",
  "Design Systems at Scale",
  "Business Writing",
  "Marketing Analytics",
  "Excel for Business",
  "React Native Essentials",
  "Node.js API Design",
  "Docker for Developers",
  "Go for Beginners",
  "SQL Query Masterclass",
  "UX Research Basics",
  "Brand Identity Design",
  "Presentation Design",
  "Negotiation Skills",
  "Financial Modeling",
  "Public Speaking",
  "Remote Team Leadership",
  "GraphQL Patterns",
  "Testing React Apps",
  "Web Accessibility",
  "Motion Design",
  "Portfolio Building",
  "Freelancing for Designers",
];

const CATEGORY_POOL = [
  "Development",
  "Development",
  "Development",
  "Development",
  "Development",
  "Design",
  "Design",
  "Design",
  "Design",
  "Business",
  "Business",
  "Business",
  "Development",
  "Development",
  "Development",
  "Development",
  "Development",
  "Design",
  "Design",
  "Design",
  "Business",
  "Business",
  "Business",
  "Business",
  "Development",
  "Development",
  "Development",
  "Design",
  "Design",
  "Design",
];

const DIFFICULTY_POOL = [
  "Beginner",
  "Advanced",
  "Intermediate",
  "Beginner",
  "Advanced",
  "Intermediate",
  "Beginner",
  "Beginner",
  "Advanced",
  "Beginner",
  "Intermediate",
  "Beginner",
  "Intermediate",
  "Intermediate",
  "Beginner",
  "Beginner",
  "Advanced",
  "Beginner",
  "Intermediate",
  "Beginner",
  "Beginner",
  "Advanced",
  "Advanced",
  "Intermediate",
  "Advanced",
  "Intermediate",
  "Beginner",
  "Intermediate",
  "Intermediate",
  "Advanced",
];

export function buildCourse(index, overrides = {}) {
  return {
    id: `course-${index + 1}`,
    title: MOCK_COURSE_TITLES[index],
    description: `Description for ${MOCK_COURSE_TITLES[index]}`,
    thumbnailUrl: `https://cdn.example.com/course-${index + 1}.jpg`,
    instructorName: `Instructor ${index + 1}`,
    rating: 3.5 + (index % 4) * 0.5,
    studentCount: 400 + index * 37,
    difficulty: DIFFICULTY_POOL[index],
    category: CATEGORY_POOL[index],
    price: 19.99 + index * 2.5,
    isFree: index % 7 === 0,
    status: "published",
    created_at: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
    enrollment_count: 400 + index * 37,
    duration_minutes: 30 + (index % 5) * 60,
    ...overrides,
  };
}

export function buildCourseCatalog(count = MOCK_COURSE_TITLES.length) {
  return Array.from({ length: count }, (_, i) => buildCourse(i));
}

export function buildCourseList(overridesList = []) {
  return overridesList.map((overrides, index) => buildCourse(index, overrides));
}