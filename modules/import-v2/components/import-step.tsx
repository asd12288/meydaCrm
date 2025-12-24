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
  IconDownload,
  IconRefresh,
  IconBan,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { CardBox, Spinner } from '@/modules/shared';
import { Button } from '@/modules/shared';
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
      <div className="flex flex-col items-center py-6">
        {/* Circular Progress - smaller */}
        <div className="relative w-20 h-20 mb-4">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-lightgray dark:text-darkgray"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${percentage * 2.14} 214`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-ld">{percentage}%</span>
          </div>
        </div>

        {/* Phase + Progress */}
        <p className="text-sm text-ld mb-1">
          {PROGRESS_PHASE_LABELS[progress.phase]}
        </p>
        <p className="text-xs text-darklink mb-4">
          {progress.processedRows.toLocaleString('fr-FR')} / {progress.totalRows.toLocaleString('fr-FR')}
        </p>

        {/* Inline Counters */}
        <p className="text-xs text-darklink mb-4">
          {progress.counters.imported} importés · {progress.counters.updated} màj · {progress.counters.skipped} ignorés
          {progress.counters.errors > 0 && <span className="text-error"> · {progress.counters.errors} erreurs</span>}
        </p>

        {/* Cancel Button */}
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
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
    <div className="flex flex-col gap-4">
      {/* Simple Success Header + Inline Summary */}
      <CardBox>
        <div className="flex items-center gap-2 mb-2">
          <IconCheck size={18} className="text-success" />
          <span className="font-medium text-ld">Import terminé</span>
          <span className="text-xs text-darklink">({durationSeconds}s)</span>
        </div>
        <p className="text-sm text-darklink">
          <strong className="text-ld">{results.importedCount}</strong> importés
          {results.updatedCount > 0 && <> · <strong className="text-ld">{results.updatedCount}</strong> mis à jour</>}
          {results.skippedCount > 0 && <> · {results.skippedCount} ignorés</>}
          {results.errorCount > 0 && <> · <span className="text-error">{results.errorCount} erreurs</span></>}
        </p>
      </CardBox>

      {/* Expandable Sections - imported open by default */}
      {results.importedRows.length > 0 && (
        <ResultSection
          title="Importés"
          count={results.importedCount}
          rows={results.importedRows}
          defaultExpanded={true}
          variant="success"
        />
      )}

      {results.updatedRows.length > 0 && (
        <ResultSection
          title="Mis à jour"
          count={results.updatedCount}
          rows={results.updatedRows}
          defaultExpanded={false}
          variant="warning"
        />
      )}

      {results.skippedRows.length > 0 && (
        <ResultSection
          title="Ignorés"
          count={results.skippedCount}
          rows={results.skippedRows}
          defaultExpanded={false}
          variant="muted"
        />
      )}

      {results.errorRows.length > 0 && (
        <ResultSection
          title="Erreurs"
          count={results.errorCount}
          rows={results.errorRows}
          defaultExpanded={true}
          variant="error"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onDownloadReport ? (
          <Button variant="outline" size="sm" onClick={onDownloadReport} className="gap-2">
            <IconDownload size={16} />
            Rapport
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewImport}>
            Nouvel import
          </Button>
          <Button size="sm" onClick={onViewLeads}>
            Voir les leads
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RESULT SECTION (Expandable - simplified)
// =============================================================================

interface ResultSectionProps {
  title: string;
  count: number;
  rows: ImportResultsSummaryV2['importedRows'];
  defaultExpanded?: boolean;
  variant?: 'success' | 'warning' | 'error' | 'muted';
}

function ResultSection({ title, count, rows, defaultExpanded = false, variant = 'muted' }: ResultSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const displayRows = rows.slice(0, 30); // Show max 30 rows
  const hasMore = rows.length > 30;

  // Icon based on variant
  const icons = {
    success: <IconCheck size={14} className="text-success" />,
    warning: <IconRefresh size={14} className="text-warning" />,
    error: <IconAlertTriangle size={14} className="text-error" />,
    muted: <IconBan size={14} className="text-darklink" />,
  };

  // Text color based on variant
  const textColors = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    muted: 'text-darklink',
  };

  return (
    <CardBox>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm"
      >
        <span className={`inline-flex items-center gap-2 font-medium ${textColors[variant]}`}>
          {icons[variant]}
          {title}
          <span className="text-xs font-normal text-darklink">({count})</span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-darklink hover:text-ld">
          {isExpanded ? (
            <>
              <IconChevronUp size={14} />
              Masquer
            </>
          ) : (
            <>
              <IconChevronDown size={14} />
              Afficher
            </>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-1">
          {displayRows.map((row) => {
            const fullName = [row.displayData.firstName, row.displayData.lastName]
              .filter(Boolean)
              .join(' ');
            const email = row.displayData.email;
            const phone = row.displayData.phone;
            // Display: Name (or email/phone if no name)
            const primaryDisplay = fullName || email || phone || '-';
            // Secondary: email if we have a name, otherwise phone
            const secondaryDisplay = fullName ? (email || phone) : (email ? phone : null);

            return (
              <div
                key={row.rowNumber}
                className="flex items-center gap-2 text-xs py-1.5 border-b border-border dark:border-darkborder last:border-0"
              >
                <span className="text-darklink font-mono w-8">{row.rowNumber}</span>
                <span className="text-ld truncate min-w-24 max-w-40">{primaryDisplay}</span>
                {secondaryDisplay && (
                  <span className="text-darklink truncate min-w-32 max-w-48">{secondaryDisplay}</span>
                )}
                <span className="flex-1" />
                {row.reason && (
                  <span className={`truncate max-w-48 ${variant === 'error' ? 'text-error' : 'text-darklink'}`}>
                    {row.reason}
                  </span>
                )}
              </div>
            );
          })}
          {hasMore && (
            <p className="text-xs text-darklink text-center pt-2">
              +{rows.length - 30} autres
            </p>
          )}
        </div>
      )}
    </CardBox>
  );
}

// =============================================================================
// ERROR VIEW (simplified)
// =============================================================================

interface ErrorViewProps {
  error: string;
  onNewImport: () => void;
}

function ErrorView({ error, onNewImport }: ErrorViewProps) {
  return (
    <CardBox>
      <div className="flex flex-col items-center py-6">
        <IconX size={24} className="text-error mb-2" />
        <p className="text-sm font-medium text-ld mb-1">Échec de l&apos;import</p>
        <p className="text-xs text-error mb-4 text-center max-w-sm">{error}</p>
        <Button size="sm" onClick={onNewImport}>
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
      <div className="flex flex-col items-center py-6 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-border dark:bg-darkborder mb-4" />
        <div className="h-4 w-32 bg-border dark:bg-darkborder rounded mb-2" />
        <div className="h-3 w-24 bg-border dark:bg-darkborder rounded" />
      </div>
    </CardBox>
  );
}
