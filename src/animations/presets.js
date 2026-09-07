/**
 * Small reusable "quick access" animation presets for one-off inline uses that
 * don't warrant a dedicated variants file.
 */
import { transitions } from "./transitions";

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: transitions.base,
};

export const fadeOut = {
  initial: { opacity: 1 },
  animate: { opacity: 0 },
  transition: transitions.fast,
};

export const tapFeedback = {
  whileTap: { scale: 0.97 },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: transitions.base,
};