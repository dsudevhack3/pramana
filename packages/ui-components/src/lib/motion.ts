import { useEffect, useState } from 'react';

/**
 * SS7 motion tokens, mirrored from packages/config/tokens.css for the cases
 * where JS needs the numeric value (a timer that must match a CSS transition,
 * the Web Animations API). CSS always uses the var(--...) form instead.
 */
export const EASE = {
  out: [0.2, 0.75, 0.3, 1.0],
  in: [0.4, 0.0, 1.0, 1.0],
  seal: [0.3, 1.5, 0.5, 1.0],
  smooth: [0.4, 0.0, 0.2, 1.0],
} as const;

export const DUR = {
  instant: 120,
  quick: 200,
  base: 320,
  slow: 620,
  fill: 1300,
} as const;

export const cssEase = (k: keyof typeof EASE) => `cubic-bezier(${EASE[k].join(',')})`;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reduced motion collapses every variant to an opacity-only crossfade. The
 * seal moment still occurs - it simply stops flying in.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
