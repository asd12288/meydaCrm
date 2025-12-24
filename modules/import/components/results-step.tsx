'use client';

import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconExternalLink,
  IconRefresh,
  IconFileSpreadsheet,
  IconClock,
} from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import type { ImportJobProgress } from '../types';

interface ResultsStepProps {
  /** Final progress data from import */
  progress: ImportJobProgress;
  /** Original file name */
  fileName: string;
  /** Import job ID for navigation */
  importJobId: string;
  /** Callback to view imported leads */
  onViewLeads?: () => void;
  /** Callback to start a new import */
  onNewImport?: () => void;
}

/**
 * Step 6: Results
 * Shows the final import results with summary and actions
 */
export function ResultsStep({
  progress,
  fileName,
  importJobId,
  onViewLeads,
  onNewImport,
}: ResultsStepProps) {
  const isSuccess = progress.status === 'completed';
  const isFailed = progress.status === 'failed';
  const isCancelled = progress.status === 'cancelled';

  const importedCount = progress.importedRows || 0;
  const skippedCount = progress.skippedRows || 0;
  const invalidCount = progress.invalidRows || 0;
  const totalProcessed = progress.processedRows || 0;

  // Calculate duration
  const getDuration = () => {
    if (!progress.startedAt || !progress.completedAt) return null;
    const start = new Date(progress.startedAt);
    const end = new Date(progress.completedAt);
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds} secondes`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds}s`;
  };

  const duration = getDuration();

  return (
    <div className="space-y-6">
      {/* Header with status - no gradients, minimal colors */}
      <div className="p-6 rounded-xl text-center bg-muted/50 border border-border">
        <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-primary/10">
          {isSuccess && <IconCheck className="w-7 h-7 text-primary" />}
          {isFailed && <IconX className="w-7 h-7 text-error" />}
          {isCancelled && <IconAlertTriangle className="w-7 h-7 text-darklink" />}
        </div>

        <h2 className="text-xl font-semibold text-ld mb-1">
          {isSuccess && 'Import terminé'}
          {isFailed && 'Import échoué'}
          {isCancelled && 'Import annulé'}
        </h2>

        {isSuccess && (
          <p className="text-darklink">
            <span className="font-semibold text-primary">
              {importedCount.toLocaleString('fr-FR')}
            </span>{' '}
            leads importés
          </p>
        )}

        {isFailed && progress.errorMessage && (
          <p className="text-sm text-error mt-1">{progress.errorMessage}</p>
        )}
      </div>

      {/* Stats cards - uniform styling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Imported */}
        <div className="bg-white dark:bg-dark border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <IconCheck size={16} className="text-primary" />
            <span className="text-xs text-darklink">Importés</span>
          </div>
          <p className="text-xl font-semibold text-ld">{importedCount.toLocaleString('fr-FR')}</p>
        </div>

        {/* Skipped */}
        <div className="bg-white dark:bg-dark border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <IconAlertTriangle size={16} className="text-primary" />
            <span className="text-xs text-darklink">Ignorés</span>
          </div>
          <p className="text-xl font-semibold text-ld">{skippedCount.toLocaleString('fr-FR')}</p>
        </div>

        {/* Invalid */}
        <div className="bg-white dark:bg-dark border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <IconX size={16} className="text-primary" />
            <span className="text-xs text-darklink">Invalides</span>
          </div>
          <p className="text-xl font-semibold text-ld">{invalidCount.toLocaleString('fr-FR')}</p>
        </div>

        {/* Duration */}
        <div className="bg-white dark:bg-dark border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <IconClock size={16} className="text-primary" />
            <span className="text-xs text-darklink">Durée</span>
          </div>
          <p className="text-xl font-semibold text-ld">{duration || '-'}</p>
        </div>
      </div>

      {/* File info */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <IconFileSpreadsheet size={20} className="text-primary" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ld truncate">{fileName}</p>
          <p className="text-xs text-darklink">
            {totalProcessed.toLocaleString('fr-FR')} lignes traitées
          </p>
        </div>
        <p className="text-xs text-darklink">
          ID: {importJobId.slice(0, 8)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* View leads button */}
        {isSuccess && importedCount > 0 && onViewLeads && (
          <Button variant="primary" size="sm" onClick={onViewLeads}>
            <IconExternalLink size={16} />
            Voir les leads
          </Button>
        )}

        {/* New import button */}
        {onNewImport && (
          <Button variant="outline" size="sm" onClick={onNewImport}>
            <IconRefresh size={16} />
            Nouvel import
          </Button>
        )}
      </div>
    </div>
  );
}
