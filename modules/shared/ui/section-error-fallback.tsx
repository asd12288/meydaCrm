'use client';

import { FallbackProps } from 'react-error-boundary';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

/**
 * Compact error fallback for dashboard sections/cards
 * Smaller footprint, designed to fit inside CardBox components
 */
export function SectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 dark:bg-darkgray/30 min-h-25"
    >
      <div className="flex items-center gap-2 text-darklink mb-2">
        <IconAlertTriangle size={16} className="text-warning" />
        <span className="text-sm">Erreur de chargement</span>
      </div>

      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-lightgray dark:bg-dark text-darklink hover:text-ld transition-colors border border-border"
      >
        <IconRefresh size={14} />
        <span>Réessayer</span>
      </button>
    </div>
  );
}
