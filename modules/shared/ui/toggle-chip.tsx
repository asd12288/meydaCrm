'use client';

import { IconCheck } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export interface ToggleChipProps {
  /** Chip label */
  label: string;
  /** Whether the chip is selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show check icon when selected */
  showCheck?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class name */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

/**
 * Toggle chip/tag for multi-selection
 * Pill-shaped button with optional check icon
 */
export function ToggleChip({
  label,
  isSelected,
  onClick,
  disabled = false,
  showCheck = true,
  size = 'md',
  className = '',
}: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 rounded-full transition-colors
        ${SIZE_CLASSES[size]}
        ${isSelected
          ? 'bg-primary/10 text-primary'
          : 'bg-white dark:bg-dark text-darklink hover:text-ld hover:bg-muted'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {showCheck && isSelected && <IconCheck size={size === 'sm' ? 12 : 14} />}
      {label}
    </button>
  );
}

// ============ Group wrapper ============

export interface ToggleChipGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * Flex wrapper for toggle chips
 */
export function ToggleChipGroup({ children, className = '' }: ToggleChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}
