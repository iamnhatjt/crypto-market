import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Also hardcoded in `public/index.html`, which reads this key before first
 * paint so dark mode does not flash white. The two cannot share a constant —
 * the inline script runs before any bundle loads — so renaming this means
 * renaming it there too. `e2e/theme.spec.ts` pins the literal to catch drift.
 */
const THEME_STORAGE_KEY = 'crypto-dashboard:theme';

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** An explicit choice wins; otherwise fall back to the OS preference. */
function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? (prefersDark() ? 'dark' : 'light');
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    // Tailwind's `darkMode: 'class'` strategy keys off this class on <html>.
    document.documentElement.classList.toggle('dark', theme === 'dark');

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persistence is a nicety; the in-session theme still works.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
