/**
 * useScrollEdgeShadow
 *
 * Tracks the horizontal scroll position of a container element and reports
 * which edges have content scrolled beyond them. Used to drive the
 * fade/shadow indicators on sticky table columns (Stripe / Linear / Notion
 * pattern: the sticky column's left or right edge only shows its shadow
 * when there is actually content underneath it).
 *
 * Returns `{ ref, showStart, showEnd }` where the booleans are
 * RTL-aware ("start" = visual leading edge, "end" = visual trailing edge).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseScrollEdgeShadowResult<E extends HTMLElement> {
  ref: React.RefObject<E | null>;
  /** True when content is scrolled past the start (leading) edge. */
  showStart: boolean;
  /** True when there's still content scrollable toward the end edge. */
  showEnd: boolean;
}

export function useScrollEdgeShadow<
  E extends HTMLElement = HTMLDivElement,
>(): UseScrollEdgeShadowResult<E> {
  const ref = useRef<E | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // `scrollLeft` is negative in RTL on some browsers (Firefox legacy) and
    // positive in others. Math.abs flattens the difference.
    const x = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;

    // Use a 1px slop so subpixel rounding doesn't toggle the flags forever.
    setShowStart(x > 1);
    setShowEnd(max - x > 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    recompute();
    el.addEventListener('scroll', recompute, { passive: true });

    // Re-check when the container or its content resizes (e.g. columns
    // shown/hidden, density toggled).
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    // Observe the inner table too, since its width is what overflows.
    const inner = el.firstElementChild as HTMLElement | null;
    if (inner) ro.observe(inner);

    return () => {
      el.removeEventListener('scroll', recompute);
      ro.disconnect();
    };
  }, [recompute]);

  return { ref, showStart, showEnd };
}
