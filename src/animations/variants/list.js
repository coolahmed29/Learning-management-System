/**
 * Framer Motion stagger-container variants for grids/lists that animate children in
 * sequentially rather than all popping in at once.
 */
import { transitions } from "../transitions";

export const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const staggerContainerVariantsReduced = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

export const listItemVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
};