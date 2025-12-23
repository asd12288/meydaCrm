/**
 * Import Step Component (Step 3)
 *
 * Shows import progress and final results with full transparency
 */

'use client';

import { useState } from 'react';
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertCircle,
  IconDownload,
  IconUsers,
  IconFileImport,
} from '@tabler/icons-react';
import { CardBox, Badge, Spinner } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { PROGRESS_PHASE_LABELS } from '../config/constants';
import type { ImportProgressV2, ImportResultsSummaryV2 } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface ImportStepProps {
  /** Current progress (while importing) */
  progress: ImportProgressV2 | null;
  /** Final results (when complete) */
  results: ImportResultsSummaryV2 | null;
  /** Error message (if failed) */
  error: string | null;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Callback to view imported leads */
  onViewLeads: () => void;
  /** Callback to start new import */
  onNewImport: () => void;
  /** Callback to download report */
  onDownloadReport?: () => void;
  /** Callback to cancel import */
  onCancel?: () => void;
}

// =============================================================================
// PROGRESS VIEW
// =============================================================================

interface ProgressViewProps {
  progress: ImportProgressV2;
  onCancel?: () => void;
}

function ProgressView({ progress, onCancel }: ProgressViewProps) {
  const percentage = progress.totalRows > 0
    ? Math.round((progress.processedRows / progress.totalRows) * 100)
    : 0;

  return (
    <CardBox>
      <div className="flex flex-col items-center py-8">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-lightgray dark:text-darkgray"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${percentage * 3.27} 327`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-ld">{percentage}%</span>
          </div>
        </div>

        {/* Phase Label */}
        <p className="text-lg font-medium text-ld mb-2">
          {PROGRESS_PHASE_LABELS[progress.phase]}
        </p>

        {/* Progress Details */}
        <p className="text-sm text-darklink mb-6">
          {progress.processedRows.toLocaleString('fr-FR')} /{' '}
          {progress.totalRows.toLocaleString('fr-FR')} lignes
        </p>

        {/* Live Counters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-success">
              {progress.counters.imported}
            </span>
            <p className="text-xs text-darklink mt-1">Importés</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-warning">
              {progress.counters.updated}
            </span>
            <p className="text-xs text-darklink mt-1">Mis à jour</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-darklink">
              {progress.counters.skipped}
            </span>
            <p className="text-xs text-darklink mt-1">Ignorés</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-error">
              {progress.counters.errors}
            </span>
            <p className="text-xs text-darklink mt-1">Erreurs</p>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </CardBox>
  );
}

// =============================================================================
// RESULTS VIEW
// =============================================================================

interface ResultsViewProps {
  results: ImportResultsSummaryV2;
  onViewLeads: () => void;
  onNewImport: () => void;
  onDownloadReport?: () => void;
}

function ResultsView({
  results,
  onViewLeads,
  onNewImport,
  onDownloadReport,
}: ResultsViewProps) {
  const durationSeconds = Math.round(results.durationMs / 1000);

  return (
    <div className="flex flex-col gap-6">
      {/* Success Header */}
      <CardBox>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-lightsuccess dark:bg-success/20 flex items-center justify-center">
            <IconCheck size={28} className="text-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ld">Import terminé avec succès</h2>
            <p className="text-sm text-darklink">
              Durée: {durationSeconds} seconde{durationSeconds !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-lightsuccess/30 dark:bg-success/10 rounded-lg text-center">
            <span className="text-3xl font-bold text-success">
              {results.importedCount}
            </span>
            <p className="text-sm text-darklink mt-1">Importés</p>
          </div>
          <div className="p-4 bg-lightwarning/30 dark:bg-warning/10 rounded-lg text-center">
            <span className="text-3xl font-bold text-warning">
              {results.updatedCount}
            </span>
            <p className="text-sm text-darklink mt-1">Mis à jour</p>
          </div>
          <div className="p-4 bg-lightgray dark:bg-darkgray rounded-lg text-center">
            <span className="text-3xl font-bold text-darklink">
              {results.skippedCount}
            </span>
            <p className="text-sm text-darklink mt-1">Ignorés</p>
          </div>
          <div className="p-4 bg-lighterror/30 dark:bg-error/10 rounded-lg text-center">
            <span className="text-3xl font-bold text-error">
              {results.errorCount}
            </span>
            <p className="text-sm text-darklink mt-1">Erreurs</p>
          </div>
        </div>
      </CardBox>

      {/* Detailed Results - Expandable Sections */}
      {results.importedRows.length > 0 && (
        <ResultSection
          title="Leads importés"
          count={results.importedCount}
          variant="success"
          icon={<IconCheck size={18} />}
          rows={results.importedRows}
        />
      )}

      {results.updatedRows.length > 0 && (
        <ResultSection
          title="Leads mis à jour"
          count={results.updatedCount}
          variant="warning"
          icon={<IconRefresh size={18} />}
          rows={results.updatedRows}
        />
      )}

      {results.skippedRows.length > 0 && (
        <ResultSection
          title="Ignorés"
          count={results.skippedCount}
          variant="secondary"
          icon={<IconX size={18} />}
          rows={results.skippedRows}
        />
      )}

      {results.errorRows.length > 0 && (
        <ResultSection
          title="Erreurs"
          count={results.errorCount}
          variant="error"
          icon={<IconAlertCircle size={18} />}
          rows={results.errorRows}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {onDownloadReport && (
          <Button variant="outline" onClick={onDownloadReport} className="gap-2">
            <IconDownload size={18} />
            Télécharger le rapport
          </Button>
        )}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onNewImport} className="gap-2">
            <IconFileImport size={18} />
            Nouvel import
          </Button>
          <Button onClick={onViewLeads} className="gap-2">
            <IconUsers size={18} />
            Voir les leads
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RESULT SECTION (Expandable)
// =============================================================================

interface ResultSectionProps {
  title: string;
  count: number;
  variant: 'success' | 'warning' | 'error' | 'secondary';
  icon: React.ReactNode;
  rows: ImportResultsSummaryV2['importedRows'];
}

function ResultSection({ title, count, variant, icon, rows }: ResultSectionProps) {
  // Auto-expand errors and skipped by default
  const defaultExpanded = variant === 'error' || variant === 'secondary';
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const displayRows = rows.slice(0, 50); // Show max 50 rows
  const hasMore = rows.length > 50;

  const variantClasses = {
    success: 'border-success/30 bg-lightsuccess/20 dark:bg-success/5',
    warning: 'border-warning/30 bg-lightwarning/20 dark:bg-warning/5',
    error: 'border-error/30 bg-lighterror/20 dark:bg-error/5',
    secondary: 'border-border dark:border-darkborder bg-lightgray/50 dark:bg-darkgray/50',
  };

  return (
    <CardBox className={variantClasses[variant]}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-ld">{title}</span>
          <Badge variant={variant} size="sm">
            {count}
          </Badge>
        </div>
        <span className="text-sm text-primary">
          {isExpanded ? 'Masquer' : 'Afficher'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {displayRows.map((row) => (
            <div
              key={row.rowNumber}
              className="flex items-center gap-3 p-2 bg-white/50 dark:bg-dark/50 rounded text-sm"
            >
              <span className="text-darklink font-mono w-12">L.{row.rowNumber}</span>
              <span className="text-ld flex-1">
                {[row.displayData.firstName, row.displayData.lastName]
                  .filter(Boolean)
                  .join(' ') || row.displayData.email || row.displayData.phone || '-'}
              </span>
              {row.displayData.email && (
                <span className="text-xs text-darklink">{row.displayData.email}</span>
              )}
              {row.reason && (
                <span className="text-xs text-error">{row.reason}</span>
              )}
            </div>
          ))}
          {hasMore && (
            <p className="text-xs text-darklink text-center py-2">
              +{rows.length - 50} lignes supplémentaires...
            </p>
          )}
        </div>
      )}
    </CardBox>
  );
}

// =============================================================================
// ERROR VIEW
// =============================================================================

interface ErrorViewProps {
  error: string;
  onNewImport: () => void;
}

function ErrorView({ error, onNewImport }: ErrorViewProps) {
  return (
    <CardBox>
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-lighterror dark:bg-error/20 flex items-center justify-center mb-4">
          <IconX size={32} className="text-error" />
        </div>
        <h2 className="text-xl font-semibold text-ld mb-2">Échec de l&apos;import</h2>
        <p className="text-sm text-error mb-6 text-center max-w-md">{error}</p>
        <Button onClick={onNewImport} className="gap-2">
          <IconFileImport size={18} />
          Réessayer
        </Button>
      </div>
    </CardBox>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ImportStep({
  progress,
  results,
  error,
  isImporting,
  onViewLeads,
  onNewImport,
  onDownloadReport,
  onCancel,
}: ImportStepProps) {
  // Show error state
  if (error && !isImporting) {
    return <ErrorView error={error} onNewImport={onNewImport} />;
  }

  // Show results when complete
  if (results && !isImporting) {
    return (
      <ResultsView
        results={results}
        onViewLeads={onViewLeads}
        onNewImport={onNewImport}
        onDownloadReport={onDownloadReport}
      />
    );
  }

  // Show progress while importing
  if (progress) {
    return <ProgressView progress={progress} onCancel={onCancel} />;
  }

  // Loading state (waiting for progress)
  return (
    <CardBox>
      <div className="flex flex-col items-center py-8">
        <Spinner size="lg" />
        <p className="text-sm text-darklink mt-4">Préparation de l&apos;import...</p>
      </div>
    </CardBox>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function ImportStepSkeleton() {
  return (
    <CardBox>
      <div className="flex flex-col items-center py-8 animate-pulse">
        <div className="w-32 h-32 rounded-full bg-border dark:bg-darkborder mb-6" />
        <div className="h-5 w-48 bg-border dark:bg-darkborder rounded mb-2" />
        <div className="h-4 w-32 bg-border dark:bg-darkborder rounded" />
      </div>
    </CardBox>
  );
}
