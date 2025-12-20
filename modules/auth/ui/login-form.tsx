'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { PasswordInput, FormErrorAlert } from '@/modules/shared';
import { login } from '../lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Connexion...' : 'Se connecter'}
    </button>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit} className="mt-6">
      <div className="mb-4">
        <FormErrorAlert error={error} />
      </div>

      <div className="mb-4">
        <label htmlFor="username" className="form-label">
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="form-control-input w-full"
          placeholder="Votre identifiant"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="form-label">
          Mot de passe
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
