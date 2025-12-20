'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { SupportTicketWithDetails } from '../types';
import { TicketCategoryBadge } from '../ui/ticket-category-badge';
import { TicketStatusBadge } from '../ui/ticket-status-badge';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function getTicketColumns(): ColumnDef<SupportTicketWithDetails>[] {
  return [
    {
      accessorKey: 'subject',
      header: 'Sujet',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-ld truncate">{row.original.subject}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <TicketCategoryBadge category={row.original.category} />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <TicketStatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: 'createdByProfile',
      header: 'Créé par',
      cell: ({ row }) => (
        <span className="text-sm text-ld">
          {row.original.createdByProfile?.displayName || (row.original.createdByProfile as { display_name?: string })?.display_name || 'Inconnu'}
        </span>
      ),
    },
    {
      accessorKey: 'commentCount',
      header: 'Commentaires',
      cell: ({ row }) => (
        <span className="text-sm text-darklink">
          {row.original.commentCount || 0}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date de création',
      cell: ({ row }) => {
        const date = row.original.createdAt || (row.original as { created_at?: string }).created_at;
        return (
          <span className="text-sm text-darklink">
            {formatDate(date)}
          </span>
        );
      },
    },
  ];
}
