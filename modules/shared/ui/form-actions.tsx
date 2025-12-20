'use client';

import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

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
 * Uses the Button component with primary/secondaryAction variants
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
      <Button
        type="submit"
        variant="primary"
        disabled={isPending || !isDirty}
      >
        {submitIcon}
        {isPending ? (submitLabelPending || submitLabel) : submitLabel}
      </Button>
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="secondaryAction"
          onClick={onCancel}
          disabled={isPending}
        >
          <IconX size={18} />
          {cancelLabel}
        </Button>
      )}
    </div>
  );
}
