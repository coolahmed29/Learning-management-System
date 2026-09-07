/**
 * Generic hook to reactively detect if a CSS media query matches.
 */
import { useEffect, useState } from "react";
import { breakpoints } from "../lib/designTokens";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);
    mql.addEventListener("change", handleChange);
    // Older Safari uses addListener/removeListener — not our target but noted
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${breakpoints.tablet - 1}px)`);
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`
  );
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${breakpoints.desktop}px)`);
}
