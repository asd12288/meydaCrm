'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'crm-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  // Initialize state with lazy initializer to avoid hydration mismatch
  const [theme, setThemeState] = useState<ThemeMode>(() => defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount - use layout effect for sync
  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = stored === 'system' ? getSystemTheme() : stored;

    // Batch state updates - this is intentional for hydration sync
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedTheme(resolved);
    applyTheme(resolved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Handle theme changes after mount
  useEffect(() => {
    if (!mounted) return;

    const resolved = theme === 'system' ? getSystemTheme() : theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedTheme(resolved);
    applyTheme(resolved);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      // If system, toggle to the opposite of current resolved theme
      if (prev === 'system') {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [resolvedTheme]);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
