/**
 * Framer Motion variants for card hover/entry (CourseCard, StatCard, CertificateCard).
 */
import { transitions } from "../transitions";

export const cardEntryVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

export const cardEntryVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
};

export const cardHoverVariants = {
  rest: { y: 0 },
  hover: { y: -4, transition: transitions.fast },
};

export const cardHoverVariantsReduced = {
  rest: { y: 0 },
  hover: { y: 0, transition: transitions.fast },
};