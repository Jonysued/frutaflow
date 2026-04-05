import { useState, useEffect, useRef } from "react";

const THRESHOLD = 75;

/**
 * usePullToRefresh — listens to touch events on the nearest scrollable parent
 * (or <main> if none found) and fires `onRefresh` when the user pulls down past THRESHOLD.
 *
 * Returns { refreshing } — use to show a spinner at the top of the page.
 */
export function usePullToRefresh(onRefresh) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const getScrollEl = () => document.querySelector("main") || document.documentElement;

    const onTouchStart = (e) => {
      if (getScrollEl().scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchEnd = async (e) => {
      if (startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      startY.current = null;
      if (delta > THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh]);

  return { refreshing };
}