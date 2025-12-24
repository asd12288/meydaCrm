/**
 * Preview Step Component (Step 2)
 *
 * Main component for the preview step showing:
 * - Summary cards (Total, Valid, Invalid, File Dup, DB Dup)
 * - Tabbed issue tables with unified actions
 * - Bulk actions for all issue types
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { IconCheck, IconRefresh, IconX, IconReplace, IconPlus, IconAlertTriangle } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import { Button } from '@/modules/shared';
import { PreviewSummaryCards, PreviewSummaryCardsSkeleton } from './preview-summary-cards';
import { PreviewIssueTable, PreviewIssueTableSkeleton, type IssueRow } from './preview-issue-table';
import { AssignmentConfig } from './assignment-config';
import type { SalesUser } from '@/modules/leads/types';
import type {
  DetailedPreviewDataV2,
  PreviewTabV2,
} from '../types/preview';
import type { UnifiedRowAction, PreviewIssueType, AssignmentModeV2 } from '../config/constants';
import { UNIFIED_ROW_ACTION_LABELS, AVAILABLE_ACTIONS_BY_TYPE } from '../config/constants';
import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// TYPES
// =============================================================================

interface PreviewStepProps {
  /** Preview data */
  preview: DetailedPreviewDataV2;
  /** Loading state */
  isLoading?: boolean;
  /** Unified row decisions map */
  rowDecisions: Map<number, UnifiedRowAction>;
  /** Edited rows map */
  editedRows: Map<number, Partial<Record<LeadFieldKey, string>>>;
  /** Callback when row action changes */
  onRowActionChange: (rowNumber: number, action: UnifiedRowAction) => void;
  /** Callback for bulk action */
  onBulkAction: (issueType: PreviewIssueType, action: UnifiedRowAction) => void;
  /** Callback to view/edit a row */
  onViewEdit: (row: IssueRow, issueType: PreviewIssueType) => void;
  /** Callback to start import */
  onStartImport: () => void;
  /** Callback to go back */
  onBack: () => void;
  /** Whether import can start */
  canImport: boolean;
  /** Import button loading state */
  isImporting?: boolean;
  /** Sales users for assignment */
  salesUsers: SalesUser[];
  /** Assignment mode */
  assignmentMode: AssignmentModeV2;
  /** Selected user IDs for assignment */
  assignmentUserIds: string[];
  /** Toggle assignment on/off */
  onAssignmentToggle: (enabled: boolean) => void;
  /** Update selected users for assignment */
  onAssignmentUsersChange: (userIds: string[]) => void;
  /** Warning message for DB duplicate check failures */
  dbCheckWarning?: string | null;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

const TABS: { id: PreviewTabV2; label: string; issueType: PreviewIssueType }[] = [
  { id: 'invalid', label: 'Invalides', issueType: 'invalid' },
  { id: 'file_duplicates', label: 'Doublons fichier', issueType: 'file_duplicate' },
  { id: 'db_duplicates', label: 'Doublons base', issueType: 'db_duplicate' },
];

// Map tab id to issue type
const TAB_TO_ISSUE_TYPE: Record<PreviewTabV2, PreviewIssueType> = {
  invalid: 'invalid',
  file_duplicates: 'file_duplicate',
  db_duplicates: 'db_duplicate',
};

// =============================================================================
// UNIFIED BULK ACTION BAR
// =============================================================================

interface BulkActionBarProps {
  issueType: PreviewIssueType;
  count: number;
  onApplyAll: (action: UnifiedRowAction) => void;
}

function BulkActionBar({ issueType, count, onApplyAll }: BulkActionBarProps) {
  if (count === 0) return null;

  const availableActions = AVAILABLE_ACTIONS_BY_TYPE[issueType];

  const btnClass = `
    inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
    border border-border dark:border-darkborder
    hover:bg-lightgray dark:hover:bg-darkgray transition-colors
  `;

  const getIcon = (action: UnifiedRowAction) => {
    switch (action) {
      case 'skip':
        return <IconX size={12} />;
      case 'import':
        return <IconPlus size={12} />;
      case 'update':
        return <IconReplace size={12} />;
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-darklink mb-3">
      <span className="text-darklink mr-1">Appliquer à tous ({count}):</span>
      {availableActions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onApplyAll(action)}
          className={btnClass}
        >
          {getIcon(action)}
          {UNIFIED_ROW_ACTION_LABELS[action]}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// EFFECTIVE COUNTS SUMMARY (compact inline)
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
    <div className="text-sm text-darklink">
      <span className="text-ld font-medium">Résultat:</span>{' '}
      {willImport} nouveaux · {willUpdate} mis à jour · {willSkip} ignorés
      {willError > 0 && <span className="text-error"> · {willError} erreurs</span>}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreviewStep({
  preview,
  isLoading = false,
  rowDecisions,
  editedRows,
  onRowActionChange,
  onBulkAction,
  onViewEdit,
  onStartImport,
  onBack,
  canImport,
  isImporting = false,
  salesUsers,
  assignmentMode,
  assignmentUserIds,
  onAssignmentToggle,
  onAssignmentUsersChange,
  dbCheckWarning,
}: PreviewStepProps) {
  // Determine default tab: first one with data (invalid > file_dup > db_dup)
  const defaultTab = useMemo((): PreviewTabV2 | null => {
    if (preview.summary.invalid > 0) return 'invalid';
    if (preview.summary.fileDuplicates > 0) return 'file_duplicates';
    if (preview.summary.dbDuplicates > 0) return 'db_duplicates';
    return null;
  }, [preview.summary]);

  // Initialize activeTab with defaultTab value (avoids useEffect setState issue)
  const [activeTab, setActiveTab] = useState<PreviewTabV2 | null>(() => defaultTab);

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

  // Get the current issue type from active tab
  const currentIssueType = activeTab ? TAB_TO_ISSUE_TYPE[activeTab] : null;

  // Handle view/edit with issue type context
  const handleViewEdit = useCallback(
    (row: IssueRow) => {
      if (currentIssueType) {
        onViewEdit(row, currentIssueType);
      }
    },
    [currentIssueType, onViewEdit]
  );

  // Handle bulk action with issue type context
  const handleBulkAction = useCallback(
    (action: UnifiedRowAction) => {
      if (currentIssueType) {
        onBulkAction(currentIssueType, action);
      }
    },
    [currentIssueType, onBulkAction]
  );

  if (isLoading) {
    return <PreviewStepSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* DB Check Warning Banner */}
      {dbCheckWarning && (
        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning">
          <IconAlertTriangle size={18} className="shrink-0" />
          <span className="text-sm">{dbCheckWarning}</span>
        </div>
      )}

      {/* Summary Stats + Effective Counts */}
      <CardBox>
        <div className="flex flex-col gap-3">
          <PreviewSummaryCards
            summary={preview.summary}
            activeTab={activeTab}
            onCardClick={handleCardClick}
          />
          <EffectiveCountsSummary {...preview.effectiveCounts} />
        </div>
      </CardBox>

      {/* Assignment Configuration */}
      <AssignmentConfig
        enabled={assignmentMode === 'round_robin'}
        selectedUserIds={assignmentUserIds}
        salesUsers={salesUsers}
        leadsToAssign={preview.effectiveCounts.willImport}
        onToggle={onAssignmentToggle}
        onUsersChange={onAssignmentUsersChange}
      />

      {/* Issue Tables (if any issues exist) */}
      {hasIssues && activeTab && currentIssueType && (
        <CardBox>
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mb-3">
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
                    text-sm transition-colors
                    ${isActive ? 'font-medium text-ld' : 'text-darklink hover:text-ld'}
                  `}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Bulk Action Bar */}
          <BulkActionBar
            issueType={currentIssueType}
            count={tabCounts[activeTab]}
            onApplyAll={handleBulkAction}
          />

          {/* Issue Table */}
          <div className="border border-border dark:border-darkborder rounded-lg overflow-visible">
            {activeTab === 'invalid' && (
              <PreviewIssueTable
                rows={preview.invalidRows}
                issueType="invalid"
                emptyMessage="Aucune ligne invalide"
                rowDecisions={rowDecisions}
                editedRows={editedRows}
                onRowActionChange={onRowActionChange}
                onViewEdit={handleViewEdit}
              />
            )}
            {activeTab === 'file_duplicates' && (
              <PreviewIssueTable
                rows={preview.fileDuplicateRows}
                issueType="file_duplicate"
                emptyMessage="Aucun doublon dans le fichier"
                rowDecisions={rowDecisions}
                editedRows={editedRows}
                onRowActionChange={onRowActionChange}
                onViewEdit={handleViewEdit}
              />
            )}
            {activeTab === 'db_duplicates' && (
              <PreviewIssueTable
                rows={preview.dbDuplicateRows}
                issueType="db_duplicate"
                emptyMessage="Aucun doublon avec la base"
                rowDecisions={rowDecisions}
                editedRows={editedRows}
                onRowActionChange={onRowActionChange}
                onViewEdit={handleViewEdit}
              />
            )}
          </div>
        </CardBox>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          Retour
        </Button>
        <Button
          size="sm"
          onClick={onStartImport}
          disabled={!canImport || isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <>
              <IconRefresh size={16} className="animate-spin" />
              Import...
            </>
          ) : (
            <>
              <IconCheck size={16} />
              Importer
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
    <div className="flex flex-col gap-4 animate-pulse">
      <CardBox>
        <div className="flex flex-col gap-3">
          <PreviewSummaryCardsSkeleton />
          <div className="h-4 w-48 bg-border dark:bg-darkborder rounded" />
        </div>
      </CardBox>

      <CardBox>
        <div className="flex gap-4 mb-3">
          <div className="h-4 w-20 bg-border dark:bg-darkborder rounded" />
          <div className="h-4 w-24 bg-border dark:bg-darkborder rounded" />
        </div>
        <PreviewIssueTableSkeleton rowCount={3} />
      </CardBox>

      <div className="flex items-center justify-between pt-2">
        <div className="h-8 w-20 bg-border dark:bg-darkborder rounded" />
        <div className="h-8 w-24 bg-border dark:bg-darkborder rounded" />
      </div>
    </div>
  );
}
