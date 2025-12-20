'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { Modal } from './modal';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Close callback (called when user cancels or closes) */
  onClose: () => void;
  /** Confirm callback (called when user confirms) */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Variant: 'danger' (red) or 'warning' (yellow) */
  variant?: 'danger' | 'warning';
  /** Show loading state on confirm button */
  isPending?: boolean;
  /** Optional icon (defaults to warning icon) */
  icon?: React.ReactNode;
}

/**
 * Reusable confirmation dialog component
 * Replaces window.confirm() with a modern, accessible dialog
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isPending = false,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!isPending) {
      onConfirm();
    }
  };

  const defaultIcon = <IconAlertTriangle size={24} className={variant === 'danger' ? 'text-error' : 'text-warning'} />;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon || defaultIcon}
      size="md"
      closeOnBackdrop={!isPending}
      closeOnEscape={!isPending}
      showCloseButton={!isPending}
    >
      <div className="space-y-4">
        {/* Message */}
        <p className="text-sm text-ld">{message}</p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ld">
          <Button
            type="button"
            variant="secondaryAction"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'warning'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Traitement...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
