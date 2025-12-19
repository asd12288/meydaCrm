'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from '@/lib/theme';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-circle-hover ${className}`}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? (
        <IconSun size={20} className="text-warning" />
      ) : (
        <IconMoon size={20} />
      )}
    </button>
  );
}
