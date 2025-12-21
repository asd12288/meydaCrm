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
      className="flex flex-col items-center justify-center p-8 rounded-lg bg-muted dark:bg-darkgray/50 border border-border"
    >
      <div className="flex items-center gap-2 text-darklink mb-2">
        <IconAlertTriangle size={20} className="text-warning" />
        <h3 className="font-medium">Impossible de charger cette section</h3>
      </div>

      {error?.message && (
        <p className="text-sm text-darklink/70 mb-4 text-center max-w-md">
          {error.message}
        </p>
      )}

      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-lightgray dark:bg-dark text-darklink hover:text-ld hover:bg-surface transition-colors border border-border"
      >
        <IconRefresh size={16} />
        <span>Réessayer</span>
      </button>
    </div>
  );
}

export type { FallbackProps };
