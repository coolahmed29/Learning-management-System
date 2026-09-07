/**
 * Central registry of MSW request handlers. Grows incrementally — only add
 * handlers for endpoints the CURRENT feature being built actually needs.
 */
export const handlers = [];
