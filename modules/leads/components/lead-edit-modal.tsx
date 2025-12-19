'use client';

import { useEffect } from 'react';
import { IconEdit, IconX } from '@tabler/icons-react';
import { LeadEditForm } from './lead-edit-form';
import type { LeadWithFullDetails } from '../types';

interface LeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithFullDetails;
}

export function LeadEditModal({
  isOpen,
  onClose,
  lead,
}: LeadEditModalProps) {
  // Build display name for title
  const displayName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    lead.company ||
    'Lead';

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-dark rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ld shrink-0">
          <div className="flex items-center gap-2">
            <IconEdit size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-ld">
              Modifier: {displayName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-circle-hover"
            aria-label="Fermer"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <LeadEditForm
            lead={lead}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
