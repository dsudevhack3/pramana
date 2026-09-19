import { useEffect, useState } from 'react';

/**
 * Used by the drug typeahead so a registry-backed search is not fired on every
 * keystroke. 220ms: long enough to collapse a burst of typing, short enough
 * that the list still feels attached to the keyboard.
 */
export function useDebounce<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
