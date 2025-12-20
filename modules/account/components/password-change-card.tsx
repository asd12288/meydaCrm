'use client';

import { useState, useTransition } from 'react';
import {
  CardBox,
  PasswordInput,
  FormErrorAlert,
  FormSuccessAlert,
  SectionHeader,
} from '@/modules/shared';
import { IconLock } from '@tabler/icons-react';
import { changePassword } from '../lib/actions';

export function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set('currentPassword', currentPassword);
    formData.set('newPassword', newPassword);
    formData.set('confirmPassword', confirmPassword);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword === newPassword;

  return (
    <CardBox>
      <SectionHeader
        title="Changer le mot de passe"
        icon={<IconLock size={20} />}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Mot de passe actuel</label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="form-label">Nouveau mot de passe</label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="form-warning">Minimum 6 caractères</p>
          )}
        </div>

        <div>
          <label className="form-label">Confirmer le mot de passe</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={confirmPassword.length > 0 && confirmPassword !== newPassword}
          />
          {confirmPassword.length > 0 && confirmPassword !== newPassword && (
            <p className="form-error">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <FormErrorAlert error={error} />
        <FormSuccessAlert show={success} message="Mot de passe modifié avec succès" />

        <button
          type="submit"
          disabled={!isValid || isPending}
          className="ui-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </CardBox>
  );
}
