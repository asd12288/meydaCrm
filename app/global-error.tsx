'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Global error boundary - catches errors in root layout and during SSR
 * This is a REQUIRED file for production error handling in Next.js App Router
 *
 * Note: This component renders its own <html> and <body> tags
 * because it replaces the entire page when a root-level error occurs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture critical error to PostHog
    posthog.captureException(error, {
      source: 'global_error_boundary',
      digest: error.digest,
      severity: 'critical',
    });
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            <div className="mb-8">
              <svg
                className="mx-auto h-24 w-24 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">
              Erreur critique
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Une erreur inattendue s&apos;est produite au niveau de l&apos;application.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6 font-mono">
                Code: {error.digest}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
              <a
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
