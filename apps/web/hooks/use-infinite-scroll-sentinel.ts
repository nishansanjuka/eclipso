"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Drives an infinite query from a sentinel element scrolling into view.
 *
 * Returns a **callback ref** to spread onto the sentinel: `<div ref={sentinelRef} />`.
 *
 * Two things this gets right that the hand-rolled version on the player profile
 * did not, both of which made scrolling load nothing at all:
 *
 * 1. **`hasNextPage` is a dependency, not a ref.** The old code deliberately
 *    kept `hasNextPage` in a ref so the observer never had to be rebuilt. But
 *    an `IntersectionObserver` only invokes its callback when the intersection
 *    *changes* — plus once on `observe()`. On a short first page the sentinel is
 *    already on screen, so that one initial callback fires while the query is
 *    still in flight and `hasNextPage` is still false. It does nothing, the flag
 *    flips to true a moment later, and no further callback ever comes because
 *    the sentinel never stopped being visible. Rebuilding the observer when the
 *    flag flips re-runs that initial check against the real value.
 *
 * 2. **A callback ref, not `useRef` + a mount-time effect.** The sentinel lives
 *    inside a conditionally rendered tab. Switching away unmounts the node and
 *    switching back mounts a *different* one; an effect keyed on anything but
 *    the node itself keeps observing the detached original.
 */
export function useInfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  /** Set false to leave the observer detached (e.g. the tab is hidden). */
  enabled?: boolean;
}) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  const sentinelRef = useCallback((node: HTMLElement | null) => {
    setSentinel(node);
  }, []);

  useEffect(() => {
    if (!sentinel || !enabled || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      // No negative rootMargin: the sentinel sits at the very bottom of the
      // page, and trimming the root's bottom edge can leave a short list's
      // sentinel permanently non-intersecting, which is another way to load
      // nothing forever.
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, enabled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return sentinelRef;
}
