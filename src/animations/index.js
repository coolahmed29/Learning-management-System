/**
 * Single barrel export for the entire animation system. Consuming components import
 * everything from one place: `import { pageVariants, tapFeedback } from "animations"`.
 */
export * from "./transitions";
export * from "./presets";
export * from "./variants/page";
export * from "./variants/modal";
export * from "./variants/card";
export * from "./variants/list";

/**
 * Given a full variants object, its reduced-motion counterpart, and the
 * prefersReducedMotion flag (from useTheme), return the appropriate variant set.
 * Centralizes the "if reduced motion, simplify" branching that would otherwise be
 * copy-pasted into every component using animations.
 */
export function getMotionProps(variants, reducedVariants, prefersReducedMotion) {
  return prefersReducedMotion ? reducedVariants : variants;
}