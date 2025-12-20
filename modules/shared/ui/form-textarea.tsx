'use client';

import { forwardRef } from 'react';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Reusable textarea field component with label and error message
 * Uses the DRY CSS classes: .form-label, .form-error
 * Matches FormField API for consistency
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ label, error, hint, className = '', ...props }, ref) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <textarea
          ref={ref}
          {...props}
          className={`form-control-input w-full resize-none ${error ? 'border-error' : ''} ${className}`}
        />
        {hint && !error && (
          <p className="form-warning">{hint}</p>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
