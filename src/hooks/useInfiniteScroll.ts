/**
 * useInfiniteScroll Hook
 * Reusable IntersectionObserver-based infinite scroll implementation
 *
 * Usage:
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(...);
 * useInfiniteScroll({ fetchNextPage, hasMore: hasNextPage, isFetching: isFetchingNextPage });
 * ```
 */

import { useEffect } from 'react';

interface UseInfiniteScrollOptions {
  /** Function to call when user scrolls near bottom */
  fetchNextPage: () => void;
  /** Whether there are more pages to load */
  hasMore: boolean;
  /** Whether currently fetching next page */
  isFetching: boolean;
  /** Container selector (optional, defaults to '[data-container]') */
  containerSelector?: string;
  /** Pixels before reaching bottom to trigger load (default: 500px) */
  rootMargin?: string;
  /** Intersection threshold (default: 0.1) */
  threshold?: number;
}

export function useInfiniteScroll({
  fetchNextPage,
  hasMore,
  isFetching,
  containerSelector = '[data-container]',
  rootMargin = '500px',
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    // Create scroll trigger element
    const observerTarget = document.createElement('div');
    observerTarget.id = 'scroll-trigger';
    observerTarget.style.height = '1px';
    observerTarget.style.width = '100%';

    // Find container and append trigger
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    container.appendChild(observerTarget);

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isFetching) {
          fetchNextPage();
        }
      },
      {
        root: null, // viewport
        rootMargin,
        threshold,
      }
    );

    observer.observe(observerTarget);

    // Cleanup
    return () => {
      observer.disconnect();
      if (observerTarget && observerTarget.parentNode) {
        observerTarget.parentNode.removeChild(observerTarget);
      }
    };
  }, [fetchNextPage, hasMore, isFetching, containerSelector, rootMargin, threshold]);
}
