import type { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content/label */
  children: ReactNode;
  /** Color variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Optional icon (rendered before label) */
  icon?: ReactNode;
  /** Use solid background instead of light */
  solid?: boolean;
  /** Additional class name */
  className?: string;
}

// Size classes
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

// Light variant classes (default)
const LIGHT_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
};

// Solid variant classes
const SOLID_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'badge-solid-primary',
  secondary: 'badge-solid-secondary',
  success: 'badge-solid-success',
  warning: 'badge-solid-warning',
  error: 'badge-solid-error',
  info: 'badge-solid-info',
};

/**
 * Generic reusable badge component
 * Uses CSS classes from globals.css for consistent styling
 */
export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  solid = false,
  className = '',
}: BadgeProps) {
  const variantClasses = solid ? SOLID_VARIANT_CLASSES : LIGHT_VARIANT_CLASSES;
  const badgeClass = variantClasses[variant];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${badgeClass} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
