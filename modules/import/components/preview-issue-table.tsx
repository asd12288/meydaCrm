'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  IconAlertCircle,
  IconCopy,
  IconDatabase,
  IconInbox,
} from '@tabler/icons-react';
import { Pagination } from '@/modules/shared';
import type { PreviewIssueRow, PreviewIssueType } from '../types';

interface PreviewIssueTableProps {
  /** Rows to display */
  rows: PreviewIssueRow[];
  /** Issue type for styling */
  issueType: PreviewIssueType;
  /** Empty state message */
  emptyMessage?: string;
}

const PAGE_SIZE = 25;

const ISSUE_BADGES: Record<PreviewIssueType, { label: string; className: string }> = {
  invalid: {
    label: 'Invalide',
    className: 'bg-lighterror/20 text-error',
  },
  file_duplicate: {
    label: 'Doublon fichier',
    className: 'bg-lightwarning/20 text-warning',
  },
  db_duplicate: {
    label: 'Existe en base',
    className: 'bg-lightinfo/20 text-info',
  },
};

const ISSUE_ICONS: Record<PreviewIssueType, typeof IconAlertCircle> = {
  invalid: IconAlertCircle,
  file_duplicate: IconCopy,
  db_duplicate: IconDatabase,
};

/**
 * Paginated table showing rows with issues (invalid, duplicates)
 */
export function PreviewIssueTable({
  rows,
  issueType,
  emptyMessage = 'Aucune ligne',
}: PreviewIssueTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);

  // Paginate rows client-side
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  // Reset page when rows change
  useEffect(() => {
    if (page > 1 && rows.length <= (page - 1) * PAGE_SIZE) {
      setPage(1);
    }
  }, [rows.length, page]);

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <IconInbox size={48} className="mx-auto text-darklink/40 mb-3" />
        <p className="text-darklink">{emptyMessage}</p>
      </div>
    );
  }

  const badge = ISSUE_BADGES[issueType];
  const Icon = ISSUE_ICONS[issueType];

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ld">
              <th className="text-left py-3 px-4 font-medium text-darklink w-20">Ligne</th>
              <th className="text-left py-3 px-4 font-medium text-darklink">Email</th>
              <th className="text-left py-3 px-4 font-medium text-darklink">Telephone</th>
              <th className="text-left py-3 px-4 font-medium text-darklink">Nom</th>
              <th className="text-left py-3 px-4 font-medium text-darklink w-48">Probleme</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.rowNumber}
                className="border-b border-ld last:border-b-0 hover:bg-muted/50 dark:hover:bg-darkmuted/50"
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-darklink">#{row.rowNumber}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-ld">{row.data.email || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-ld">{row.data.phone || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-ld">
                    {[row.data.first_name, row.data.last_name].filter(Boolean).join(' ') || '-'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.className}`}>
                      <Icon size={12} />
                      {badge.label}
                    </span>
                  </div>
                  {row.message && (
                    <p className="text-xs text-darklink mt-1">{row.message}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          total={rows.length}
          page={page}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          onPageChange={setPage}
          itemLabel="lignes"
          showPageSizeSelector={false}
          showFirstLastButtons={false}
        />
      )}
    </div>
  );
}
