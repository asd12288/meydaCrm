'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Size variant */
  checkboxSize?: CheckboxSize;
  /** Error state */
  error?: boolean;
}

const SIZE_CLASSES: Record<CheckboxSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * Styled checkbox with optional label
 * Supports controlled and uncontrolled modes
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    labelPosition = 'right',
    checkboxSize = 'md',
    error = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const checkbox = (
    <input
      ref={ref}
      id={inputId}
      type="checkbox"
      className={`
        ${SIZE_CLASSES[checkboxSize]} rounded cursor-pointer
        text-primary focus:ring-primary focus:ring-offset-0
        border-border bg-white dark:bg-dark
        transition-all duration-150 hover:border-primary
        checked:scale-105 active:scale-95
        ${error ? 'border-error' : ''}
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    />
  );

  if (!label) {
    return checkbox;
  }

  return (
    <label
      htmlFor={inputId}
      className={`
        flex items-start gap-3 cursor-pointer
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${labelPosition === 'left' ? 'flex-row-reverse justify-end' : ''}
      `}
    >
      {checkbox}
      <div className="flex-1">
        <span className="text-sm text-ld">{label}</span>
        {description && (
          <p className="text-xs text-darklink mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
});

// ============ Checkbox Card variant ============

export interface CheckboxCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Card fills available width */
  fullWidth?: boolean;
}

/**
 * Checkbox in a card container
 * Used for settings toggles
 */
export const CheckboxCard = forwardRef<HTMLInputElement, CheckboxCardProps>(function CheckboxCard(
  { label, description, fullWidth = true, className = '', ...props },
  ref
) {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <label
      htmlFor={inputId}
      className={`
        flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark cursor-pointer
        hover:bg-lightgray dark:hover:bg-darkgray transition-colors
        ${fullWidth ? 'w-full' : ''}
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div>
        {label && <span className="text-sm text-ld">{label}</span>}
        {description && (
          <p className="text-xs text-darklink mt-0.5">{description}</p>
        )}
      </div>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="rounded text-primary focus:ring-primary border-border"
        {...props}
      />
    </label>
  );
});
