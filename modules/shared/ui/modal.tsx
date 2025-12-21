'use client';

import { useState, useCallback, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
};

export interface ModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional icon for header */
  icon?: ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Modal content */
  children: ReactNode;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Allow closing by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing with Escape key */
  closeOnEscape?: boolean;
}

/**
 * Reusable Modal component using shadcn Dialog (Radix UI)
 * Only renders when open to prevent infinite re-render loops
 */
export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  // Don't render anything when closed - prevents infinite re-render loops
  if (!isOpen) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} bg-white dark:bg-dark border-ld`}
        showCloseButton={showCloseButton}
        onPointerDownOutside={closeOnBackdrop ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ld">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing modal state
 */
export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
}
