/**
 * Centralized transition timing/easing definitions — the "physics" every animation
 * variant reuses so motion stays consistent across the app.
 */
export const transitions = {
  fast: { duration: 0.15, ease: "easeOut" },
  base: { duration: 0.25, ease: "easeInOut" },
  slow: { duration: 0.4, ease: "easeInOut" },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springGentle: { type: "spring", stiffness: 200, damping: 25 },
};