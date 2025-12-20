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
      className="flex flex-col items-center justify-center p-6 rounded-lg bg-lighterror/30 dark:bg-error/5 min-h-[120px]"
    >
      <div className="flex items-center gap-2 text-error mb-3">
        <IconAlertTriangle size={20} />
        <span className="font-medium">Erreur de chargement</span>
      </div>

      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors"
      >
        <IconRefresh size={16} />
        <span>Réessayer</span>
      </button>
    </div>
  );
}
