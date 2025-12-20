'use client';

import { forwardRef } from 'react';
import { PasswordInput } from './password-input';

export interface FormPasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Reusable password field component with label and error message
 * Uses the DRY CSS classes: .form-label, .form-error
 * Wraps PasswordInput component to reduce duplication across forms
 */
export const FormPasswordField = forwardRef<HTMLInputElement, FormPasswordFieldProps>(
  function FormPasswordField({ label, error, hint, className = '', ...props }, ref) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <PasswordInput
          ref={ref}
          {...props}
          error={!!error}
          className={className}
        />
        {hint && !error && (
          <p className="form-warning">{hint}</p>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
