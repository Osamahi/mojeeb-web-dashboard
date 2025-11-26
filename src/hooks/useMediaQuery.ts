import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]); // Removed 'matches' from dependencies to prevent stale closure

  return matches;
}

/**
 * Convenience hook to detect mobile screens (< 768px)
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/**
 * Convenience hook to detect tablet screens (768px - 1023px)
 */
export const useIsTablet = () =>
  useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

/**
 * Convenience hook to detect desktop screens (≥ 1024px)
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
