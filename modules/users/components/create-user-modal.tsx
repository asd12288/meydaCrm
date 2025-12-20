'use client';

import { IconUserPlus } from '@tabler/icons-react';
import { Modal } from '@/modules/shared';
import { CreateUserForm } from './create-user-form';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un utilisateur"
      icon={<IconUserPlus size={20} />}
      size="md"
    >
      <CreateUserForm onSuccess={onClose} onCancel={onClose} />
    </Modal>
  );
}
