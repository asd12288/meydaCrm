'use client';

import {
  IconCheck,
  IconX,
  IconLoader2,
} from '@tabler/icons-react';
import type { ImportProgress } from '../types';

interface ProgressStepProps {
  progress: ImportProgress;
  fileName?: string;
}

export function ProgressStep({ progress, fileName }: ProgressStepProps) {
  const percentage =
    progress.totalRows > 0
      ? Math.round((progress.processedRows / progress.totalRows) * 100)
      : 0;

  const getPhaseLabel = () => {
    if (progress.phase === 'parsing') return 'Validation des données';
    if (progress.phase === 'importing') return 'Création des leads';
    return '';
  };

  // Success state
  if (progress.phase === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <IconCheck className="w-8 h-8 text-primary" strokeWidth={2} />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-ld mb-1">Import terminé</h3>
          <p className="text-darklink">
            <span className="font-semibold text-primary">
              {progress.importedRows.toLocaleString('fr-FR')}
            </span>{' '}
            leads importés avec succès
          </p>
          {progress.skippedRows > 0 && (
            <p className="text-sm text-darklink mt-1">
              {progress.skippedRows.toLocaleString('fr-FR')} doublons ignorés
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (progress.phase === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <IconX className="w-8 h-8 text-error" strokeWidth={2} />
        </div>

        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-ld mb-1">Import échoué</h3>
          {progress.errorMessage && (
            <p className="text-error text-sm">{progress.errorMessage}</p>
          )}
          <p className="text-sm text-darklink mt-2">
            {progress.processedRows.toLocaleString('fr-FR')} lignes traitées avant l&apos;erreur
          </p>
        </div>
      </div>
    );
  }

  // Active import state - minimalistic design
  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-ld mb-1">
          {progress.phase === 'parsing' ? 'Analyse en cours' : 'Import en cours'}
        </h3>
        {fileName && (
          <p className="text-sm text-darklink">{fileName}</p>
        )}
        {getPhaseLabel() && (
          <p className="text-xs text-primary mt-1">{getPhaseLabel()}</p>
        )}
      </div>

      {/* Compact progress circle */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-border"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 * (1 - percentage / 100)}
              className="text-primary transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <IconLoader2 className="w-5 h-5 text-primary animate-spin mb-1" />
            <p className="text-2xl font-bold text-ld">{percentage}%</p>
          </div>
        </div>
      </div>

      {/* Row count */}
      <div className="text-center">
        <p className="text-sm text-darklink">
          {progress.processedRows.toLocaleString('fr-FR')} / {progress.totalRows.toLocaleString('fr-FR')} lignes
        </p>
      </div>
    </div>
  );
}
