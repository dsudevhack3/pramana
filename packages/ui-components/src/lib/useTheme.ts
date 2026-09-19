import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
const KEY = 'pramana.theme';

/**
 * Writes data-theme onto <html>. tokens.css defines the dark palette under
 * both [data-theme="dark"] and the OS preference, so "system" means removing
 * the attribute entirely rather than computing a value here.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme | null) ?? 'system',
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  const resolved: 'light' | 'dark' =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;

  return { theme, resolved, setTheme };
}
