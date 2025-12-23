/**
 * Preview Issue Table Component
 *
 * Generic table for displaying rows with issues (invalid, file duplicates, DB duplicates)
 */

'use client';

import { IconAlertCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import type { InvalidRowV2, FileDuplicateRowV2, DbDuplicateRowV2 } from '../types/preview';
import type { DuplicateStrategyV2 } from '../config/constants';
import { Badge } from '@/modules/shared';

// =============================================================================
// TYPES
// =============================================================================

export type IssueRow = InvalidRowV2 | FileDuplicateRowV2 | DbDuplicateRowV2;

interface PreviewIssueTableProps<T extends IssueRow> {
  /** Rows to display */
  rows: T[];
  /** Type of issues being displayed */
  issueType: 'invalid' | 'file_duplicate' | 'db_duplicate';
  /** Max rows to show initially (for expandable list) */
  maxRows?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Callback for action changes (DB duplicates only) */
  onRowActionChange?: (rowNumber: number, action: DuplicateStrategyV2) => void;
  /** Callback to open comparison modal (DB duplicates only) */
  onCompareClick?: (row: DbDuplicateRowV2) => void;
  /** Current row actions (DB duplicates only) */
  rowActions?: Map<number, DuplicateStrategyV2>;
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

const ACTION_OPTIONS: { value: DuplicateStrategyV2; label: string }[] = [
  { value: 'skip', label: 'Ignorer' },
  { value: 'update', label: 'Mettre à jour' },
  { value: 'create', label: 'Créer nouveau' },
];

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function RowData({ row }: { row: IssueRow }) {
  const { displayData } = row;
  const name = [displayData.firstName, displayData.lastName].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-0.5">
      {name && <span className="font-medium text-ld">{name}</span>}
      {displayData.email && (
        <span className="text-xs text-darklink">{displayData.email}</span>
      )}
      {displayData.phone && (
        <span className="text-xs text-darklink">{displayData.phone}</span>
      )}
      {displayData.company && (
        <span className="text-xs text-darklink italic">{displayData.company}</span>
      )}
    </div>
  );
}

function InvalidRowDetails({ row }: { row: InvalidRowV2 }) {
  return (
    <div className="flex flex-col gap-1">
      {row.errors.map((error, idx) => (
        <div key={idx} className="flex items-start gap-1.5 text-error text-xs">
          <IconAlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>{FIELD_LABELS[error.field] || error.field}:</strong> {error.message}
            {error.value && (
              <span className="text-darklink ml-1">({error.value})</span>
            )}
          </span>
        </div>
      ))}
      {row.warnings?.map((warning, idx) => (
        <div key={`w-${idx}`} className="flex items-start gap-1.5 text-warning text-xs">
          <IconAlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>{FIELD_LABELS[warning.field] || warning.field}:</strong> {warning.message}
          </span>
        </div>
      ))}
    </div>
  );
}

function FileDuplicateDetails({ row }: { row: FileDuplicateRowV2 }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="warning" size="sm">
        {FIELD_LABELS[row.matchedField] || row.matchedField}
      </Badge>
      <span className="text-xs text-darklink">
        {row.isFirstOccurrence ? (
          'Première occurrence'
        ) : (
          <>Doublon de la ligne {row.firstOccurrenceRow}</>
        )}
      </span>
    </div>
  );
}

interface DbDuplicateDetailsProps {
  row: DbDuplicateRowV2;
  currentAction: DuplicateStrategyV2;
  onActionChange?: (action: DuplicateStrategyV2) => void;
  onCompareClick?: () => void;
}

function DbDuplicateDetails({
  row,
  currentAction,
  onActionChange,
  onCompareClick,
}: DbDuplicateDetailsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Match info */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="info" size="sm">
          {FIELD_LABELS[row.matchedField] || row.matchedField}
        </Badge>
        <span className="text-xs text-darklink">
          Correspond à: {row.matchedValue}
        </span>
      </div>

      {/* Changed fields */}
      {row.changedFields.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-darklink">Champs différents:</span>
          {row.changedFields.slice(0, 3).map((field) => (
            <Badge key={field} variant="secondary" size="sm">
              {FIELD_LABELS[field] || field}
            </Badge>
          ))}
          {row.changedFields.length > 3 && (
            <span className="text-xs text-darklink">
              +{row.changedFields.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-1">
        <select
          value={currentAction}
          onChange={(e) => onActionChange?.(e.target.value as DuplicateStrategyV2)}
          className="select-md text-xs py-1"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onCompareClick}
          className="text-xs text-primary hover:underline"
        >
          Comparer
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PreviewIssueTable<T extends IssueRow>({
  rows,
  issueType,
  maxRows = 10,
  emptyMessage = 'Aucune donnée',
  onRowActionChange,
  onCompareClick,
  rowActions,
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

  return (
    <div>
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld w-16">
              Ligne
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld w-48">
              Données
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld">
              {issueType === 'invalid' && 'Erreurs'}
              {issueType === 'file_duplicate' && 'Doublon'}
              {issueType === 'db_duplicate' && 'Doublon existant'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {displayRows.map((row) => (
            <tr
              key={row.rowNumber}
              className="hover:bg-lighthover dark:hover:bg-darkgray transition-colors"
            >
              <td className="px-4 py-3 text-sm text-ld font-mono">
                {row.rowNumber}
              </td>
              <td className="px-4 py-3 text-sm">
                <RowData row={row} />
              </td>
              <td className="px-4 py-3 text-sm">
                {issueType === 'invalid' && (
                  <InvalidRowDetails row={row as InvalidRowV2} />
                )}
                {issueType === 'file_duplicate' && (
                  <FileDuplicateDetails row={row as FileDuplicateRowV2} />
                )}
                {issueType === 'db_duplicate' && (
                  <DbDuplicateDetails
                    row={row as DbDuplicateRowV2}
                    currentAction={
                      rowActions?.get(row.rowNumber) ||
                      (row as DbDuplicateRowV2).rowAction ||
                      'skip'
                    }
                    onActionChange={(action) =>
                      onRowActionChange?.(row.rowNumber, action)
                    }
                    onCompareClick={() =>
                      onCompareClick?.(row as DbDuplicateRowV2)
                    }
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Show more / less toggle */}
      {hasMore && (
        <div className="flex justify-center py-3 border-t border-border dark:border-darkborder">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {expanded ? (
              <>
                <IconChevronUp size={16} />
                Afficher moins
              </>
            ) : (
              <>
                <IconChevronDown size={16} />
                Afficher {rows.length - maxRows} de plus
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

export function PreviewIssueTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="animate-pulse">
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-4 py-3 border-b border-ld w-16">
              <div className="h-3 w-10 bg-border dark:bg-darkborder rounded" />
            </th>
            <th className="px-4 py-3 border-b border-ld w-48">
              <div className="h-3 w-16 bg-border dark:bg-darkborder rounded" />
            </th>
            <th className="px-4 py-3 border-b border-ld">
              <div className="h-3 w-20 bg-border dark:bg-darkborder rounded" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {Array.from({ length: rowCount }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <div className="h-4 w-8 bg-border dark:bg-darkborder rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 bg-border dark:bg-darkborder rounded" />
                  <div className="h-3 w-32 bg-border dark:bg-darkborder rounded" />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-48 bg-border dark:bg-darkborder rounded" />
                  <div className="h-3 w-36 bg-border dark:bg-darkborder rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
