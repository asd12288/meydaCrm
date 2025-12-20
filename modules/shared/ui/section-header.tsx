import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  iconColor?: 'primary' | 'secondary' | 'darklink' | 'success' | 'warning' | 'error';
  action?: ReactNode;
}

const ICON_COLORS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  darklink: 'text-darklink',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const;

/**
 * Reusable section header with optional icon and action
 * Used for card headers with consistent flex layout
 */
export function SectionHeader({
  title,
  icon,
  iconColor = 'primary',
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {icon && <div className={ICON_COLORS[iconColor]}>{icon}</div>}
        <h3 className="card-title">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
