/**
 * useInfiniteScroll Hook
 *
 * IntersectionObserver-based infinite scroll. Appends a 1px sentinel to a
 * host element and fires `fetchNextPage` when the sentinel intersects the
 * observer's root.
 *
 * Two modes:
 *
 *  - **Page-scroll (default).** Pass `containerSelector`; the hook resolves it
 *    via `document.querySelector` and appends the sentinel there. The
 *    IntersectionObserver root is the viewport, so `fetchNextPage` fires
 *    when the user scrolls the *page* far enough to bring the sentinel into
 *    view. Used by most lists/tables in the app.
 *
 *  - **Container-scroll.** Pass `root` (an HTMLElement, e.g. a fixed-height
 *    table's scroll container). The sentinel is appended to the same root.
 *    The observer measures intersection against that element, so
 *    `fetchNextPage` fires when the user scrolls the *container* — required
 *    for layouts where the page itself doesn't scroll (Linear / Notion /
 *    Airtable-style fixed-height tables).
 *
 * ```tsx
 * // Page-scroll:
 * useInfiniteScroll({ fetchNextPage, hasMore, isFetching, containerSelector: '[data-list]' });
 *
 * // Container-scroll:
 * const [el, setEl] = useState<HTMLElement | null>(null);
 * useInfiniteScroll({ fetchNextPage, hasMore, isFetching, root: el });
 * <div ref={setEl}>...</div>
 * ```
 */

import { useEffect } from 'react';

interface UseInfiniteScrollOptions {
  /** Function to call when user scrolls near bottom. */
  fetchNextPage: () => void;
  /** Whether there are more pages to load. */
  hasMore: boolean;
  /** Whether currently fetching next page. */
  isFetching: boolean;
  /**
   * Page-scroll mode: CSS selector for the element that should host the
   * sentinel. Default `[data-container]`. Ignored when `root` is provided.
   */
  containerSelector?: string;
  /**
   * Container-scroll mode: the element to observe AND to host the sentinel.
   * When provided, `containerSelector` is ignored and the IntersectionObserver
   * measures intersection against this element instead of the viewport.
   * Use `useState<HTMLElement | null>(null)` + a callback ref to populate it
   * so the effect re-runs when the DOM lands.
   */
  root?: HTMLElement | null;
  /** Pixels before reaching bottom to trigger load. Default `500px`. */
  rootMargin?: string;
  /** Intersection threshold. Default `0.1`. */
  threshold?: number;
}

export function useInfiniteScroll({
  fetchNextPage,
  hasMore,
  isFetching,
  containerSelector = '[data-container]',
  root,
  rootMargin = '500px',
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    // Resolve the sentinel host. In container-scroll mode this is the same
    // element as the observer root (sentinel must live inside the scroll
    // container so it crosses the root's viewport as the container scrolls).
    const host: Element | null = root ?? document.querySelector(containerSelector);
    if (!host) return;

    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-trigger';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    host.appendChild(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !isFetching) {
          fetchNextPage();
        }
      },
      {
        root: root ?? null, // null = viewport
        rootMargin,
        threshold,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.parentNode?.removeChild(sentinel);
    };
  }, [fetchNextPage, hasMore, isFetching, containerSelector, root, rootMargin, threshold]);
}
