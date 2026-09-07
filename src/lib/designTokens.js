/**
 * Synced with src/index.css — update that file first, then mirror here.
 * Tailwind config uses kebab-case keys; this file uses camelCase (JS convention).
 */

export const colors = {
  appleBlue: "#0071e3",
  linkBlue: "#0066cc",
  signalBlue: "#2997ff",
  carbon: "#1d1d1f",
  frost: "#f5f5f7",
  ice: "#f4f8fb",
  smoke: "#333333",
  graphite: "#474747",
  ash: "#707070",
  mist: "#858585",
  onyx: "#000000",
  pebble: "#e2e2e5",
};

export const typography = {
  caption: { fontSize: "12px", lineHeight: "1.33", letterSpacing: "-0.022em" },
  bodySm: {
    fontSize: "14px",
    lineHeight: "1.29",
    letterSpacing: "-0.016em",
  },
  body: { fontSize: "17px", lineHeight: "1.47", letterSpacing: "-0.016em" },
  subheading: {
    fontSize: "21px",
    lineHeight: "1.24",
    letterSpacing: "-0.005em",
  },
  headingSm: {
    fontSize: "28px",
    lineHeight: "1.18",
    letterSpacing: "0.007em",
  },
  heading: { fontSize: "40px", lineHeight: "1.14", letterSpacing: "0.011em" },
  headingLg: {
    fontSize: "44px",
    lineHeight: "1.18",
    letterSpacing: "-0.01em",
  },
  display: { fontSize: "56px", lineHeight: "1.07", letterSpacing: "0.011em" },
};

export const radius = {
  pill: "980px",
  card: "8px",
};

export const spacing = {
  sectionGap: "64px",
  cardPadding: "24px",
  elementGap: "12px",
  baseUnit: "4px",
};

export const maxWidth = {
  page: "1440px",
  text: "980px",
};

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};
