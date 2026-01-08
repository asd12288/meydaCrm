'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconUserPlus } from '@tabler/icons-react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import {
  Modal,
  Button,
  FormErrorAlert,
  PasswordInput,
} from '@/modules/shared';
import { useAccountSwitcher, addStoredAccount } from '@/lib/account-switcher';

const loginSchema = z.object({
  username: z
    .string()
    .min(2, 'Identifiant trop court')
    .max(50, 'Identifiant trop long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Caractères non valides'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export function AddAccountModal() {
  const router = useRouter();
  const { isAddModalOpen, closeAddModal, accounts } = useAccountSwitcher();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Validate
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Données invalides');
      setIsLoading(false);
      return;
    }

    // Convert to email format
    const email = `${validation.data.username.toLowerCase().replace(/\s+/g, '.')}@crm.local`;

    try {
      // Sign in with Supabase
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError('Identifiant ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      if (!authData.session || !authData.user) {
        setError('Erreur de connexion');
        setIsLoading(false);
        return;
      }

      // Check if this account is already in the list
      const existingAccount = accounts.find(
        (a) => a.userId === authData.user.id
      );
      if (existingAccount) {
        closeAddModal();
        // Refresh to switch to this account
        window.location.reload();
        return;
      }

      // Fetch profile for this user
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role, avatar')
        .eq('id', authData.user.id)
        .single();

      // Add to storage
      const success = addStoredAccount({
        userId: authData.user.id,
        displayName: profile?.display_name || username,
        role: profile?.role || 'sales',
        avatar: profile?.avatar || null,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      });

      if (!success) {
        setError('Limite de comptes atteinte');
        setIsLoading(false);
        return;
      }

      closeAddModal();

      // Refresh the page to load the new user
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch {
      setError('Erreur de connexion');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      closeAddModal();
    }
  };

  return (
    <Modal
      isOpen={isAddModalOpen}
      onClose={handleClose}
      title="Ajouter un compte"
      icon={<IconUserPlus size={20} />}
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <FormErrorAlert error={error} />

        <div>
          <label htmlFor="add-username" className="form-label">
            Identifiant
          </label>
          <input
            id="add-username"
            name="username"
            type="text"
            required
            autoComplete="username"
            className="form-control-input w-full"
            placeholder="Votre identifiant"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="add-password" className="form-label">
            Mot de passe
          </label>
          <PasswordInput
            id="add-password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
