'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Options to display */
  options: SelectOption[];
  /** Placeholder option (value="") */
  placeholder?: string;
  /** Size variant */
  selectSize?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'minimal' | 'success' | 'error';
  /** Show custom chevron icon */
  showChevron?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3 text-sm',
};

const VARIANT_CLASSES = {
  default: 'border-ld focus:border-primary',
  minimal: 'border-transparent bg-lightgray dark:bg-darkgray focus:border-primary',
  success: 'border-success/50 text-success font-medium',
  error: 'border-error focus:border-error',
};

/**
 * Styled native select component
 * Use for simple dropdown selections (pagination, filters, forms)
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    placeholder,
    selectSize = 'md',
    variant = 'default',
    showChevron = false,
    className = '',
    ...props
  },
  ref
) {
  const sizeClass = SIZE_CLASSES[selectSize];
  const variantClass = VARIANT_CLASSES[variant];

  return (
    <div className="relative inline-block">
      <select
        ref={ref}
        className={`
          ${sizeClass}
          ${variantClass}
          appearance-none
          border rounded-md
          bg-white dark:bg-darkgray dark:text-white
          focus:outline-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${showChevron ? 'pr-8' : 'pr-3'}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {showChevron && (
        <IconChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
        />
      )}
    </div>
  );
});

// ============ Inline Select for compact spaces ============

export interface InlineSelectProps extends Omit<SelectProps, 'selectSize' | 'variant'> {
  /** Width class */
  widthClass?: string;
}

/**
 * Compact inline select for tables and pagination
 */
export const InlineSelect = forwardRef<HTMLSelectElement, InlineSelectProps>(function InlineSelect(
  { widthClass = 'w-16', className = '', ...props },
  ref
) {
  return (
    <Select
      ref={ref}
      selectSize="md"
      variant="default"
      className={`${widthClass} ${className}`}
      {...props}
    />
  );
});
