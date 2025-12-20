'use client';

import { useState, useTransition } from 'react';
import { CardBox, UserAvatar } from '@/modules/shared';
import { IconEdit, IconCheck, IconX, IconCamera } from '@tabler/icons-react';
import type { Profile } from '@/db/types';
import { getRoleLabel } from '@/lib/constants';
import { updateProfile } from '../lib/actions';
import { AvatarPickerModal } from './avatar-picker-modal';

interface ProfileInfoCardProps {
  profile: Profile;
  email: string;
}

export function ProfileInfoCard({ profile, email }: ProfileInfoCardProps) {
  // Handle snake_case from Supabase vs camelCase from types
  const profileDisplayName =
    ((profile as Record<string, unknown>).display_name as string) ||
    profile.displayName;
  const initialAvatar =
    ((profile as Record<string, unknown>).avatar as string | null) ||
    profile.avatar ||
    null;

  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profileDisplayName);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    initialAvatar
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Extract username from email (before @crm.local)
  const username = email.split('@')[0];

  // Format date - Supabase returns snake_case, handle both cases
  const createdAtValue =
    (profile as Record<string, unknown>).created_at || profile.createdAt;
  const memberSince = createdAtValue
    ? new Date(createdAtValue as string).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : 'Inconnu';

  const handleSave = () => {
    setError(null);
    const formData = new FormData();
    formData.set('displayName', displayName);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  };

  const handleCancel = () => {
    setDisplayName(profileDisplayName);
    setIsEditing(false);
    setError(null);
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
            <button
              onClick={() => setIsEditing(true)}
              className="btn-circle-hover"
              title="Modifier"
            >
              <IconEdit size={18} />
            </button>
          )}
        </div>

        <div className="flex items-start gap-4">
          {/* Clickable Avatar */}
          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative group shrink-0"
            title="Changer l'avatar"
          >
            <UserAvatar
              name={profileDisplayName}
              avatar={currentAvatar}
              size="xl"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <IconCamera size={24} className="text-white" />
            </div>
          </button>

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
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="btn-circle text-success hover:bg-lightsuccess"
                    title="Enregistrer"
                  >
                    <IconCheck size={18} />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="btn-circle text-error hover:bg-lighterror"
                    title="Annuler"
                  >
                    <IconX size={18} />
                  </button>
                </div>
              ) : (
                <p className="text-ld font-medium">{profileDisplayName}</p>
              )}
              {error && <p className="text-error text-sm mt-1">{error}</p>}
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
