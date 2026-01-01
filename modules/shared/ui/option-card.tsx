'use client';

import type { ReactNode } from 'react';

export interface OptionCardProps {
  /** Option label */
  label: string;
  /** Optional description */
  description?: string;
  /** Icon component */
  icon?: ReactNode;
  /** Whether this option is selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Selectable option card with icon, label, and description
 * Used for single/multi selection in forms and wizards
 */
export function OptionCard({
  label,
  description,
  icon,
  isSelected,
  onClick,
  disabled = false,
  size = 'md',
  className = '',
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${SIZE_CLASSES[size]} rounded-xl border text-left transition-all
        ${isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/30 bg-white dark:bg-dark'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && (
        <div className={`mb-2 ${isSelected ? 'text-primary' : 'text-darklink'}`}>
          {icon}
        </div>
      )}
      <div className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-ld'}`}>
        {label}
      </div>
      {description && (
        <div className="text-xs text-darklink mt-0.5">{description}</div>
      )}
    </button>
  );
}

// ============ Grid wrapper for option cards ============

export interface OptionCardGroupProps {
  children: ReactNode;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

/**
 * Grid container for option cards
 */
export function OptionCardGroup({
  children,
  columns = 3,
  className = '',
}: OptionCardGroupProps) {
  return (
    <div className={`grid ${COLUMN_CLASSES[columns]} gap-3 ${className}`}>
      {children}
    </div>
  );
}


