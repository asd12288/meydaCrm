'use client';

import { IconKey } from '@tabler/icons-react';
import { Modal } from '@/modules/shared';
import { ResetPasswordForm } from './reset-password-form';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  userId,
  userName,
}: ResetPasswordModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Réinitialiser le mot de passe"
      icon={<IconKey size={20} />}
      size="md"
    >
      <ResetPasswordForm
        userId={userId}
        userName={userName}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </Modal>
  );
}
