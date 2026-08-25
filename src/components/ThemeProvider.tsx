import React, { createContext, useContext } from 'react';
import { Theme, useTheme } from '../hooks/useTheme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Holds the theme once for the whole app.
 *
 * Both routes render a toggle, and calling useTheme in each would create two
 * independent states writing to the same <html> class and the same localStorage
 * key — they would disagree the moment one of them changed.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useTheme();

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeControl(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useThemeControl must be used inside a ThemeProvider.');
  }

  return context;
}
