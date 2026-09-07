/**
 * Factory functions for realistic fake domain objects in tests.
 * Only create factories for entities actually needed — grows one per feature phase.
 * Shapes MUST stay in sync with real Zod schemas and Supabase table columns.
 */

export function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "student",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
