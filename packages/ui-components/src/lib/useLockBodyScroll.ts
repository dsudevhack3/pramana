import { useEffect } from 'react';

/** Prevents the page behind a modal or sheet from scrolling on touch devices. */
export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
