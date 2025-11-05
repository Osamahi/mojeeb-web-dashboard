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
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create listener for changes
    const listener = () => setMatches(media.matches);

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    // Fallback for older browsers
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

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
