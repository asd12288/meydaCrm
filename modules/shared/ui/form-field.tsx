'use client';

import { forwardRef } from 'react';

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Reusable form field component with label and error message
 * Uses the DRY CSS classes: .form-label, .form-error
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, className = '', ...props }, ref) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <input
          ref={ref}
          {...props}
          className={`form-control-input w-full ${error ? 'border-error' : ''} ${className}`}
        />
        {hint && !error && (
          <p className="form-warning">{hint}</p>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
