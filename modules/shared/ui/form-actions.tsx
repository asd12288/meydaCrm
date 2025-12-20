'use client';

import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export interface FormActionsProps {
  /** Loading state - disables buttons */
  isPending?: boolean;
  /** Dirty state - can be used to disable submit when no changes */
  isDirty?: boolean;
  /** Submit button label */
  submitLabel: string;
  /** Submit button label when loading */
  submitLabelPending?: string;
  /** Icon for submit button */
  submitIcon?: ReactNode;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel button label */
  cancelLabel?: string;
  /** Cancel button callback */
  onCancel?: () => void;
  /** Use border-top styling */
  withBorder?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Reusable form action buttons component (submit + optional cancel)
 * Uses the DRY CSS classes: .form-actions, .btn-primary-action, .btn-secondary-action
 */
export function FormActions({
  isPending = false,
  isDirty = true,
  submitLabel,
  submitLabelPending,
  submitIcon,
  showCancel = true,
  cancelLabel = 'Annuler',
  onCancel,
  withBorder = true,
  className = '',
}: FormActionsProps) {
  const containerClass = withBorder ? 'form-actions' : 'form-actions-plain';

  return (
    <div className={`${containerClass} ${className}`}>
      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="btn-primary-action"
      >
        {submitIcon}
        {isPending ? (submitLabelPending || submitLabel) : submitLabel}
      </button>
      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="btn-secondary-action"
        >
          <IconX size={18} />
          {cancelLabel}
        </button>
      )}
    </div>
  );
}
