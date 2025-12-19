'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
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
      {error && (
        <div className="mb-4 p-3 rounded-md bg-lighterror text-error text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="username"
          className="block mb-2 text-sm font-medium text-ld"
        >
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
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-ld"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="form-control-input w-full"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
