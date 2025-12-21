'use client';

import { useState, useTransition } from 'react';
import { CardBox, UserAvatar, useToast } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { IconEdit, IconCheck, IconX, IconCamera } from '@tabler/icons-react';
import type { NormalizedProfile } from '@/lib/auth';
import { getRoleLabel } from '@/lib/constants';
import { updateProfile } from '../lib/actions';
import { AvatarPickerModal } from './avatar-picker-modal';

interface ProfileInfoCardProps {
  profile: NormalizedProfile;
  email: string;
}

export function ProfileInfoCard({ profile, email }: ProfileInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    profile.avatar
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Extract username from email (before @crm.local)
  const username = email.split('@')[0];

  // Format date
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : 'Inconnu';

  const handleSave = () => {
    const previousName = profile.displayName;
    const newName = displayName;

    // Exit edit mode immediately (optimistic)
    setIsEditing(false);

    const formData = new FormData();
    formData.set('displayName', newName);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
        // Rollback on error
        setDisplayName(previousName);
      }
    });
  };

  const handleCancel = () => {
    setDisplayName(profile.displayName);
    setIsEditing(false);
  };

  const handleAvatarChange = (newAvatar: string | null) => {
    setCurrentAvatar(newAvatar);
  };

  return (
    <>
      <CardBox>
        <div className="flex items-center justify-between mb-6">
          <h3 className="card-title">Informations du profil</h3>
          {!isEditing && (
            <Button
              variant="circleHover"
              size="circleSm"
              onClick={() => setIsEditing(true)}
              title="Modifier"
            >
              <IconEdit size={18} />
            </Button>
          )}
        </div>

        <div className="flex items-start gap-4">
          {/* Clickable Avatar */}
          <Button
            variant="ghost"
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative group shrink-0 p-0 h-auto"
            title="Changer l'avatar"
          >
            <UserAvatar
              name={profile.displayName}
              avatar={currentAvatar}
              size="xl"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <IconCamera size={24} className="text-white" />
            </div>
          </Button>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {/* Display Name */}
            <div>
              <label className="text-xs text-darklink uppercase tracking-wide">
                Nom complet
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-control-input flex-1"
                    autoFocus
                  />
                  <Button
                    variant="circleHover"
                    size="circleSm"
                    onClick={handleSave}
                    disabled={isPending}
                    className="text-success hover:bg-lightsuccess"
                    title="Enregistrer"
                  >
                    <IconCheck size={18} />
                  </Button>
                  <Button
                    variant="circleHover"
                    size="circleSm"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="text-error hover:bg-lighterror"
                    title="Annuler"
                  >
                    <IconX size={18} />
                  </Button>
                </div>
              ) : (
                <p className="text-ld font-medium">{displayName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="text-xs text-darklink uppercase tracking-wide">
                Identifiant
              </label>
              <p className="text-ld">{username}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs text-darklink uppercase tracking-wide">
                Rôle
              </label>
              <div className="mt-1">
                <span
                  className={`badge-${profile.role === 'admin' ? 'primary' : 'secondary'}`}
                >
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            </div>

            {/* Member since */}
            <div>
              <label className="text-xs text-darklink uppercase tracking-wide">
                Membre depuis
              </label>
              <p className="text-ld capitalize">{memberSince}</p>
            </div>
          </div>
        </div>
      </CardBox>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={currentAvatar}
        onAvatarChange={handleAvatarChange}
      />
    </>
  );
}
