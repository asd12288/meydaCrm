'use client';

import { IconEdit } from '@tabler/icons-react';
import { Modal } from '@/modules/shared';
import { EditUserForm } from './edit-user-form';
import type { UserProfile } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isSelf?: boolean;
}

export function EditUserModal({ isOpen, onClose, user, isSelf = false }: EditUserModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier l'utilisateur"
      icon={<IconEdit size={20} />}
      size="md"
    >
      <EditUserForm user={user} isSelf={isSelf} onSuccess={onClose} onCancel={onClose} />
    </Modal>
  );
}
