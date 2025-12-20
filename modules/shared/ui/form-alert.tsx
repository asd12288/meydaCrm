'use client';

export type FormAlertType = 'error' | 'success' | 'warning' | 'info';

export interface FormAlertProps {
  type: FormAlertType;
  message: string;
  className?: string;
}

/**
 * Reusable alert component for form error/success/warning/info messages
 * Uses the DRY CSS classes: .alert-error, .alert-success, .alert-warning, .alert-info
 */
export function FormAlert({ type, message, className = '' }: FormAlertProps) {
  const alertClass = `alert-${type}`;

  return <div className={`${alertClass} ${className}`}>{message}</div>;
}

/**
 * Convenience wrapper for conditionally rendering error alerts
 */
export function FormErrorAlert({
  error,
  className = '',
}: {
  error: string | null | undefined;
  className?: string;
}) {
  if (!error) return null;
  return <FormAlert type="error" message={error} className={className} />;
}

/**
 * Convenience wrapper for conditionally rendering success alerts
 */
export function FormSuccessAlert({
  show,
  message,
  className = '',
}: {
  show: boolean;
  message: string;
  className?: string;
}) {
  if (!show) return null;
  return <FormAlert type="success" message={message} className={className} />;
}
