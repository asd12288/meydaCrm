/**
 * Preview Issue Table Component
 *
 * Unified table for displaying rows with issues (invalid, file duplicates, DB duplicates)
 * Uses UnifiedRowActions for consistent action controls
 */

'use client';

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { UnifiedRowActions } from './unified-row-actions';
import type { InvalidRowV2, FileDuplicateRowV2, DbDuplicateRowV2 } from '../types/preview';
import type { UnifiedRowAction, PreviewIssueType } from '../config/constants';
import { DEFAULT_ACTION_BY_TYPE } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

export type IssueRow = InvalidRowV2 | FileDuplicateRowV2 | DbDuplicateRowV2;

interface PreviewIssueTableProps<T extends IssueRow> {
  /** Rows to display */
  rows: T[];
  /** Type of issues being displayed */
  issueType: PreviewIssueType;
  /** Max rows to show initially (for expandable list) */
  maxRows?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Unified row decisions map */
  rowDecisions: Map<number, UnifiedRowAction>;
  /** Edited rows map */
  editedRows: Map<number, Record<string, string>>;
  /** Callback when row action changes */
  onRowActionChange: (rowNumber: number, action: UnifiedRowAction) => void;
  /** Callback to open view/edit modal */
  onViewEdit: (row: IssueRow) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Téléphone',
  external_id: 'ID externe',
  first_name: 'Prénom',
  last_name: 'Nom',
  company: 'Société',
  job_title: 'Fonction',
  address: 'Adresse',
  city: 'Ville',
  postal_code: 'Code postal',
  country: 'Pays',
  source: 'Source',
  notes: 'Notes',
  status: 'Statut',
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface RowDataProps {
  row: IssueRow;
  edits?: Record<string, string>;
}

function RowData({ row, edits }: RowDataProps) {
  const { displayData } = row;

  // Merge edits into display data (edits take precedence)
  const firstName = edits?.first_name ?? displayData.firstName;
  const lastName = edits?.last_name ?? displayData.lastName;
  const email = edits?.email ?? displayData.email;
  const phone = edits?.phone ?? displayData.phone;

  const name = [firstName, lastName].filter(Boolean).join(' ');
  const contact = email || phone;
  const hasEdits = edits && Object.keys(edits).length > 0;

  return (
    <div className="text-xs">
      {name && (
        <div className={`font-medium truncate ${hasEdits ? 'text-warning' : 'text-ld'}`}>
          {name}
        </div>
      )}
      {contact && (
        <div className={`truncate ${hasEdits ? 'text-warning' : 'text-darklink'}`}>
          {contact}
        </div>
      )}
    </div>
  );
}

// Issue-specific info display (compact, no actions)
function IssueInfo({ row, issueType }: { row: IssueRow; issueType: PreviewIssueType }) {
  if (issueType === 'invalid') {
    const invalidRow = row as InvalidRowV2;
    const firstError = invalidRow.errors[0];
    const moreCount = invalidRow.errors.length - 1 + (invalidRow.warnings?.length || 0);

    return (
      <span className="text-xs text-error truncate">
        {FIELD_LABELS[firstError.field] || firstError.field}: {firstError.message}
        {moreCount > 0 && <span className="text-darklink ml-1">+{moreCount}</span>}
      </span>
    );
  }

  if (issueType === 'file_duplicate') {
    const fileDupRow = row as FileDuplicateRowV2;
    return (
      <span className="text-xs text-darklink">
        <span className="font-medium">{FIELD_LABELS[fileDupRow.matchedField] || fileDupRow.matchedField}</span>
        {' · '}
        {fileDupRow.isFirstOccurrence
          ? 'Première occurrence'
          : `Doublon ligne ${fileDupRow.firstOccurrenceRow}`}
      </span>
    );
  }

  if (issueType === 'db_duplicate') {
    const dbDupRow = row as DbDuplicateRowV2;
    return (
      <span className="text-xs text-darklink">
        <span className="font-medium">{FIELD_LABELS[dbDupRow.matchedField] || dbDupRow.matchedField}</span>
        {dbDupRow.changedFields.length > 0 && (
          <span className="ml-1">· {dbDupRow.changedFields.length} diff.</span>
        )}
      </span>
    );
  }

  return null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreviewIssueTable<T extends IssueRow>({
  rows,
  issueType,
  maxRows = 10,
  emptyMessage = 'Aucune donnée',
  rowDecisions,
  editedRows,
  onRowActionChange,
  onViewEdit,
}: PreviewIssueTableProps<T>) {
  const [expanded, setExpanded] = useState(false);

  const displayRows = useMemo(() => {
    if (expanded || rows.length <= maxRows) {
      return rows;
    }
    return rows.slice(0, maxRows);
  }, [rows, maxRows, expanded]);

  const hasMore = rows.length > maxRows;

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-darklink text-sm">
        {emptyMessage}
      </div>
    );
  }

  // Get the third column header based on issue type
  const getThirdColumnHeader = () => {
    switch (issueType) {
      case 'invalid':
        return 'Problème';
      case 'file_duplicate':
        return 'Doublon';
      case 'db_duplicate':
        return 'Existant';
      default:
        return 'Info';
    }
  };

  return (
    <div>
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld w-14">
              #
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld w-40">
              Contact
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld w-48">
              {getThirdColumnHeader()}
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-darklink border-b border-ld">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {displayRows.map((row) => {
            const currentAction = rowDecisions.get(row.rowNumber) || DEFAULT_ACTION_BY_TYPE[issueType];
            const rowEdits = editedRows.get(row.rowNumber);
            const hasEdits = rowEdits && Object.keys(rowEdits).length > 0;

            return (
              <tr
                key={row.rowNumber}
                className="hover:bg-lighthover dark:hover:bg-darkgray"
              >
                <td className="px-3 py-2 text-xs text-darklink font-mono">
                  {row.rowNumber}
                </td>
                <td className="px-3 py-2">
                  <RowData row={row} edits={rowEdits} />
                </td>
                <td className="px-3 py-2">
                  <IssueInfo row={row} issueType={issueType} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">
                    <UnifiedRowActions
                      rowNumber={row.rowNumber}
                      issueType={issueType}
                      currentAction={currentAction}
                      hasEdits={hasEdits}
                      onActionChange={(action) => onRowActionChange(row.rowNumber, action)}
                      onViewEdit={() => onViewEdit(row)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Show more / less toggle */}
      {hasMore && (
        <div className="flex justify-center py-2 border-t border-border dark:border-darkborder">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-darklink hover:text-ld"
          >
            {expanded ? (
              <>
                <IconChevronUp size={14} />
                Réduire
              </>
            ) : (
              <>
                <IconChevronDown size={14} />
                +{rows.length - maxRows} autres
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function PreviewIssueTableSkeleton({ rowCount = 3 }: { rowCount?: number }) {
  return (
    <div className="animate-pulse">
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-3 py-2 border-b border-ld w-14">
              <div className="h-3 w-6 bg-border dark:bg-darkborder rounded" />
            </th>
            <th className="px-3 py-2 border-b border-ld w-40">
              <div className="h-3 w-12 bg-border dark:bg-darkborder rounded" />
            </th>
            <th className="px-3 py-2 border-b border-ld w-48">
              <div className="h-3 w-16 bg-border dark:bg-darkborder rounded" />
            </th>
            <th className="px-3 py-2 border-b border-ld">
              <div className="h-3 w-20 bg-border dark:bg-darkborder rounded ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {Array.from({ length: rowCount }).map((_, i) => (
            <tr key={i}>
              <td className="px-3 py-2">
                <div className="h-3 w-6 bg-border dark:bg-darkborder rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-20 bg-border dark:bg-darkborder rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-32 bg-border dark:bg-darkborder rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-6 w-36 bg-border dark:bg-darkborder rounded ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
