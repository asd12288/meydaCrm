'use client';

import { IconEdit } from '@tabler/icons-react';
import { Modal } from '@/modules/shared';
import { LeadEditForm } from './lead-edit-form';
import type { LeadWithFullDetails } from '../types';

interface LeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithFullDetails;
}

export function LeadEditModal({ isOpen, onClose, lead }: LeadEditModalProps) {
  const displayName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    lead.company ||
    'Lead';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier: ${displayName}`}
      icon={<IconEdit size={20} />}
      size="full"
    >
      <LeadEditForm lead={lead} onSuccess={onClose} />
    </Modal>
  );
}
