'use client';

import { FallbackProps } from 'react-error-boundary';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

/**
 * Default error fallback component for ErrorBoundary
 * Displays error message with retry button
 * Use for major sections (tables, forms, panels)
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 rounded-lg bg-lighterror/50 dark:bg-error/10 border border-error/20"
    >
      <div className="flex items-center gap-2 text-error mb-2">
        <IconAlertTriangle size={24} />
        <h3 className="font-semibold text-lg">Une erreur est survenue</h3>
      </div>

      {error?.message && (
        <p className="text-sm text-error/80 mb-4 text-center max-w-md">
          {error.message}
        </p>
      )}

      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-error text-white hover:bg-error/90 transition-colors"
      >
        <IconRefresh size={18} />
        <span>Réessayer</span>
      </button>
    </div>
  );
}

export type { FallbackProps };
