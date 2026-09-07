/**
 * Framer Motion variants for modal/dialog entry-exit and backdrop fade.
 */
import { transitions } from "../transitions";

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
};

export const modalBackdropVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
};

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: transitions.fast },
};

export const modalContentVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};