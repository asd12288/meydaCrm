/**
 * Preview Step Component (Step 2)
 *
 * Main component for the preview step showing:
 * - Summary cards (Total, Valid, Invalid, File Dup, DB Dup)
 * - Tabbed issue tables
 * - Bulk actions for DB duplicates
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { IconCheck, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { PreviewSummaryCards, PreviewSummaryCardsSkeleton } from './preview-summary-cards';
import { PreviewIssueTable, PreviewIssueTableSkeleton } from './preview-issue-table';
import type {
  DetailedPreviewDataV2,
  PreviewTabV2,
  DbDuplicateRowV2,
} from '../types/preview';
import type { DuplicateStrategyV2 } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface PreviewStepProps {
  /** Preview data */
  preview: DetailedPreviewDataV2;
  /** Loading state */
  isLoading?: boolean;
  /** Row actions state (DB duplicates) */
  rowActions: Map<number, DuplicateStrategyV2>;
  /** Callback when row action changes */
  onRowActionChange: (rowNumber: number, action: DuplicateStrategyV2) => void;
  /** Callback for bulk action */
  onBulkAction: (action: DuplicateStrategyV2) => void;
  /** Callback to compare DB duplicate */
  onCompareClick: (row: DbDuplicateRowV2) => void;
  /** Callback to start import */
  onStartImport: () => void;
  /** Callback to go back */
  onBack: () => void;
  /** Whether import can start */
  canImport: boolean;
  /** Import button loading state */
  isImporting?: boolean;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

const TABS: { id: PreviewTabV2; label: string }[] = [
  { id: 'invalid', label: 'Invalides' },
  { id: 'file_duplicates', label: 'Doublons fichier' },
  { id: 'db_duplicates', label: 'Doublons base' },
];

// =============================================================================
// BULK ACTION BAR
// =============================================================================

interface BulkActionBarProps {
  count: number;
  onApplyAll: (action: DuplicateStrategyV2) => void;
}

function BulkActionBar({ count, onApplyAll }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-lightprimary/30 dark:bg-primary/10 rounded-lg border border-primary/20">
      <span className="text-sm text-ld">
        <strong>{count}</strong> doublons existants
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-darklink">Appliquer à tous:</span>
        <button
          type="button"
          onClick={() => onApplyAll('skip')}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-dark border border-border dark:border-darkborder hover:bg-lighthover transition-colors"
        >
          Ignorer
        </button>
        <button
          type="button"
          onClick={() => onApplyAll('update')}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 transition-colors"
        >
          Mettre à jour
        </button>
        <button
          type="button"
          onClick={() => onApplyAll('create')}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
        >
          Créer nouveau
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// EFFECTIVE COUNTS SUMMARY
// =============================================================================

interface EffectiveCountsSummaryProps {
  willImport: number;
  willUpdate: number;
  willSkip: number;
  willError: number;
}

function EffectiveCountsSummary({
  willImport,
  willUpdate,
  willSkip,
  willError,
}: EffectiveCountsSummaryProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-lightgray dark:bg-darkgray rounded-lg">
      <span className="text-sm font-medium text-ld">Résultat estimé:</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-success">
          <strong>{willImport}</strong> nouveaux
        </span>
        <span className="text-warning">
          <strong>{willUpdate}</strong> mis à jour
        </span>
        <span className="text-darklink">
          <strong>{willSkip}</strong> ignorés
        </span>
        {willError > 0 && (
          <span className="text-error">
            <strong>{willError}</strong> erreurs
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreviewStep({
  preview,
  isLoading = false,
  rowActions,
  onRowActionChange,
  onBulkAction,
  onCompareClick,
  onStartImport,
  onBack,
  canImport,
  isImporting = false,
}: PreviewStepProps) {
  const [activeTab, setActiveTab] = useState<PreviewTabV2 | null>(null);

  // Handle card click to select/deselect tab
  const handleCardClick = useCallback((tab: PreviewTabV2 | null) => {
    setActiveTab((current) => (current === tab ? null : tab));
  }, []);

  // Get tab counts
  const tabCounts = useMemo(
    () => ({
      invalid: preview.summary.invalid,
      file_duplicates: preview.summary.fileDuplicates,
      db_duplicates: preview.summary.dbDuplicates,
    }),
    [preview.summary]
  );

  // Check if there are any issues to show
  const hasIssues = useMemo(
    () =>
      preview.summary.invalid > 0 ||
      preview.summary.fileDuplicates > 0 ||
      preview.summary.dbDuplicates > 0,
    [preview.summary]
  );

  if (isLoading) {
    return <PreviewStepSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <CardBox>
        <h3 className="card-title mb-4">Aperçu de l&apos;import</h3>
        <PreviewSummaryCards
          summary={preview.summary}
          activeTab={activeTab}
          onCardClick={handleCardClick}
        />
      </CardBox>

      {/* Issue Tables (if any issues exist) */}
      {hasIssues && (
        <CardBox>
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-border dark:border-darkborder mb-4">
            {TABS.map((tab) => {
              const count = tabCounts[tab.id];
              if (count === 0) return null;

              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-darklink hover:text-ld hover:border-border'
                    }
                  `}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-lightgray dark:bg-darkgray text-darklink'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Action Bar (for DB duplicates) */}
          {activeTab === 'db_duplicates' && (
            <BulkActionBar
              count={preview.summary.dbDuplicates}
              onApplyAll={onBulkAction}
            />
          )}

          {/* Issue Table */}
          <div className="mt-4">
            {activeTab === 'invalid' && (
              <PreviewIssueTable
                rows={preview.invalidRows}
                issueType="invalid"
                emptyMessage="Aucune ligne invalide"
              />
            )}
            {activeTab === 'file_duplicates' && (
              <PreviewIssueTable
                rows={preview.fileDuplicateRows}
                issueType="file_duplicate"
                emptyMessage="Aucun doublon dans le fichier"
              />
            )}
            {activeTab === 'db_duplicates' && (
              <PreviewIssueTable
                rows={preview.dbDuplicateRows}
                issueType="db_duplicate"
                emptyMessage="Aucun doublon avec la base"
                rowActions={rowActions}
                onRowActionChange={onRowActionChange}
                onCompareClick={onCompareClick}
              />
            )}
            {activeTab === null && (
              <div className="p-8 text-center text-darklink">
                <IconAlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Cliquez sur une carte ci-dessus pour voir les détails
                </p>
              </div>
            )}
          </div>
        </CardBox>
      )}

      {/* Effective Counts */}
      <EffectiveCountsSummary {...preview.effectiveCounts} />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button
          onClick={onStartImport}
          disabled={!canImport || isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <>
              <IconRefresh size={18} className="animate-spin" />
              Importation...
            </>
          ) : (
            <>
              <IconCheck size={18} />
              Lancer l&apos;import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function PreviewStepSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <CardBox>
        <div className="h-5 w-40 bg-border dark:bg-darkborder rounded mb-4" />
        <PreviewSummaryCardsSkeleton />
      </CardBox>

      <CardBox>
        <div className="flex gap-4 mb-4">
          <div className="h-8 w-24 bg-border dark:bg-darkborder rounded" />
          <div className="h-8 w-28 bg-border dark:bg-darkborder rounded" />
          <div className="h-8 w-24 bg-border dark:bg-darkborder rounded" />
        </div>
        <PreviewIssueTableSkeleton />
      </CardBox>

      <div className="flex items-center justify-between">
        <div className="h-10 w-24 bg-border dark:bg-darkborder rounded" />
        <div className="h-10 w-36 bg-border dark:bg-darkborder rounded" />
      </div>
    </div>
  );
}
