'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
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
 * Reusable Modal component with escape key and scroll lock handling
 * Reduces boilerplate across all modal implementations
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
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Animated close handler
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      onClose();
    }, 150); // Match animation duration
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !shouldRender) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [shouldRender, isClosing, handleClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${
          isClosing ? 'animate-modal-backdrop-exit' : 'animate-modal-backdrop-enter'
        }`}
        onClick={closeOnBackdrop && !isClosing ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} mx-4 bg-white dark:bg-dark rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${
          isClosing ? 'animate-modal-content-exit' : 'animate-modal-content-enter'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ld shrink-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            <h3 className="text-lg font-semibold text-ld">{title}</h3>
          </div>
          {showCloseButton && (
            <Button
              type="button"
              variant="circleHover"
              size="circle"
              onClick={handleClose}
              disabled={isClosing}
              aria-label="Fermer"
            >
              <IconX size={20} />
            </Button>
          )}
        </div>

        {/* Body - scrollable when content overflows */}
        <div className="p-6 flex flex-col flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
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
