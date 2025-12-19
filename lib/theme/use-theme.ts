'use client';

import { useThemeContext } from './theme-context';

/**
 * Hook to access and control the theme.
 *
 * @returns {Object} Theme utilities
 * @property {ThemeMode} theme - Current theme setting ('light' | 'dark' | 'system')
 * @property {ResolvedTheme} resolvedTheme - Actual applied theme ('light' | 'dark')
 * @property {function} setTheme - Set the theme mode
 * @property {function} toggleTheme - Toggle between light and dark
 * @property {boolean} isDark - Whether the resolved theme is dark
 */
export function useTheme() {
  return useThemeContext();
}
