export type ThemeMode = 'light' | 'dark';

export type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};
