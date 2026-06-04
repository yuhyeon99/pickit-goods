import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContext';
import type { ThemeMode } from './types';

const themeStorageKey = 'pickit-goods-theme';

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);

  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
