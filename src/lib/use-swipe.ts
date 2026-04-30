import { useEffect } from 'react';

const SWIPE_THRESHOLD = 80;
const MAX_VERTICAL_DRIFT = 100;

const IGNORED_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

function hasOverflowScroll(el: Element | null): boolean {
  while (el && el !== document.body) {
    if (el instanceof HTMLElement) {
      const style = getComputedStyle(el);
      if (
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        el.scrollWidth > el.clientWidth
      ) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

export function useSwipeNavigation(
  onSwipeLeft: (() => void) | null,
  onSwipeRight: (() => void) | null,
) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      const target = e.target as Element;
      if (IGNORED_TAGS.has(target.tagName)) return;
      if (hasOverflowScroll(target)) return;

      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (!tracking) return;
      tracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = Math.abs(endY - startY);

      if (dy > MAX_VERTICAL_DRIFT) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
