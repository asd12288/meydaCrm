/**
 * Preview Summary Stats Component
 *
 * Compact inline stats row showing import preview summary
 */

'use client';

import { IconAlertTriangle, IconCopy, IconDatabase } from '@tabler/icons-react';
import type { PreviewSummaryV2, PreviewTabV2 } from '../types/preview';

// =============================================================================
// TYPES
// =============================================================================

interface PreviewSummaryCardsProps {
  /** Summary data */
  summary: PreviewSummaryV2;
  /** Currently active tab (for highlighting) */
  activeTab?: PreviewTabV2 | null;
  /** Callback when a card is clicked */
  onCardClick?: (tab: PreviewTabV2 | null) => void;
  /** Whether cards are clickable */
  interactive?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PreviewSummaryCards({
  summary,
  activeTab,
  onCardClick,
  interactive = true,
}: PreviewSummaryCardsProps) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  // Check if there are any issues to show tabs for
  const hasIssues = summary.invalid > 0 || summary.fileDuplicates > 0 || summary.dbDuplicates > 0;

  return (
    <div className="space-y-3">
      {/* Summary stats row */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-darklink">
          <span className="font-semibold text-ld">{fmt(summary.total)}</span> lignes
        </span>
        <span className="text-darklink">
          <span className="font-semibold text-success">{fmt(summary.valid)}</span> valides
        </span>
        {summary.invalid > 0 && (
          <span className="text-darklink">
            <span className="font-semibold text-error">{fmt(summary.invalid)}</span> invalides
          </span>
        )}
        {summary.fileDuplicates > 0 && (
          <span className="text-darklink">
            <span className="font-semibold text-warning">{fmt(summary.fileDuplicates)}</span> doublons fichier
          </span>
        )}
        {summary.dbDuplicates > 0 && (
          <span className="text-darklink">
            <span className="font-semibold text-warning">{fmt(summary.dbDuplicates)}</span> doublons base
          </span>
        )}
      </div>

      {/* Issue tabs - only show if there are issues */}
      {hasIssues && interactive && (
        <div className="flex items-center gap-1 border-b border-border dark:border-darkborder">
          {summary.invalid > 0 && (
            <button
              type="button"
              onClick={() => onCardClick?.('invalid')}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                border-b-2 -mb-px transition-colors
                ${activeTab === 'invalid'
                  ? 'border-error text-error'
                  : 'border-transparent text-darklink hover:text-ld hover:border-border'
                }
              `}
            >
              <IconAlertTriangle size={14} />
              Invalides ({fmt(summary.invalid)})
            </button>
          )}

          {summary.fileDuplicates > 0 && (
            <button
              type="button"
              onClick={() => onCardClick?.('file_duplicates')}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                border-b-2 -mb-px transition-colors
                ${activeTab === 'file_duplicates'
                  ? 'border-warning text-warning'
                  : 'border-transparent text-darklink hover:text-ld hover:border-border'
                }
              `}
            >
              <IconCopy size={14} />
              Doublons fichier ({fmt(summary.fileDuplicates)})
            </button>
          )}

          {summary.dbDuplicates > 0 && (
            <button
              type="button"
              onClick={() => onCardClick?.('db_duplicates')}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                border-b-2 -mb-px transition-colors
                ${activeTab === 'db_duplicates'
                  ? 'border-warning text-warning'
                  : 'border-transparent text-darklink hover:text-ld hover:border-border'
                }
              `}
            >
              <IconDatabase size={14} />
              Doublons base ({fmt(summary.dbDuplicates)})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function PreviewSummaryCardsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Stats row skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-4 w-20 bg-border dark:bg-darkborder rounded" />
        <div className="h-4 w-16 bg-border dark:bg-darkborder rounded" />
        <div className="h-4 w-24 bg-border dark:bg-darkborder rounded" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex items-center gap-1 border-b border-border dark:border-darkborder pb-2">
        <div className="h-5 w-24 bg-border dark:bg-darkborder rounded" />
        <div className="h-5 w-32 bg-border dark:bg-darkborder rounded" />
        <div className="h-5 w-28 bg-border dark:bg-darkborder rounded" />
      </div>
    </div>
  );
}
