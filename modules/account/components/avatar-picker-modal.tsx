'use client';

import { useTransition, useState } from 'react';
import Image from 'next/image';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { Modal, useToast } from '@/modules/shared';
import { AVATARS, getAvatarPath } from '@/lib/constants';
import { updateAvatar } from '../lib/actions';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onAvatarChange?: (avatar: string | null) => void;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onAvatarChange,
}: AvatarPickerModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    currentAvatar
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSelect = (avatarId: string) => {
    // Toggle selection - click again to deselect
    const newAvatar = selectedAvatar === avatarId ? null : avatarId;
    setSelectedAvatar(newAvatar);
  };

  const handleSave = () => {
    const previousAvatar = currentAvatar;
    const newAvatar = selectedAvatar;

    // Optimistic: update immediately and close
    onAvatarChange?.(newAvatar);
    onClose();

    startTransition(async () => {
      const result = await updateAvatar(newAvatar);
      if (result.error) {
        toast.error(result.error);
        // Rollback on error
        onAvatarChange?.(previousAvatar);
      }
    });
  };

  const handleClose = () => {
    setSelectedAvatar(currentAvatar); // Reset to original
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Choisir un avatar">
      <div className="space-y-4">
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-100 overflow-y-auto p-1">
          {AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.id;
            return (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar.id)}
                disabled={isPending}
                className={`
                  relative aspect-square rounded-lg overflow-hidden
                  border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent hover:border-primary/50'
                  }
                `}
                title={avatar.label}
              >
                <Image
                  src={getAvatarPath(avatar.id)}
                  alt={avatar.label}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-white rounded-full p-1">
                      <IconCheck size={14} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedAvatar && (
          <p className="text-sm text-darklink text-center">
            Sélectionné:{' '}
            <span className="font-medium text-ld">
              {AVATARS.find((a) => a.id === selectedAvatar)?.label}
            </span>
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-ld">
          <Button
            type="button"
            variant="secondaryAction"
            onClick={handleClose}
            disabled={isPending}
          >
            <IconX size={18} />
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isPending}
          >
            <IconCheck size={18} />
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
