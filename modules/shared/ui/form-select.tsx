'use client';

import { forwardRef } from 'react';

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: FormSelectOption[];
  error?: string;
  hint?: string;
}

/**
 * Reusable form select component with label, hint, and error message
 * Uses the DRY CSS classes: .form-label, .form-error, .form-warning
 */
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect({ label, options, error, hint, className = '', ...props }, ref) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <select
          ref={ref}
          {...props}
          className={`select-md w-full ${error ? 'border-error' : ''} ${className}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="form-warning">{hint}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
