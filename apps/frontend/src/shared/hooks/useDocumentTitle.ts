import { useEffect } from 'react';

/** Each portal keeps the tab title its standalone app had. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
