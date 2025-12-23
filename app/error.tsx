'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Capture error to PostHog
    posthog.captureException(error, {
      source: 'error_boundary',
      digest: error.digest,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightgray dark:bg-dark px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <Image
            src="/error-illustration.png"
            alt="Erreur système"
            width={400}
            height={400}
            className="w-full max-w-[400px] h-auto"
            priority
          />
        </div>
        <h1 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Une erreur s&apos;est produite</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Désolé, une erreur inattendue s&apos;est produite. Veuillez réessayer.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary-action"
          >
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="btn-secondary-action"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
