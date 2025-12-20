'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { IconDots, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  CopyableText,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { LeadStatusBadge } from '../ui/lead-status-badge';
import { SortableHeader } from '../ui/sortable-header';
import { COLUMN_LABELS } from './constants';
import type { LeadWithAssignee } from '../types';

const columnHelper = createColumnHelper<LeadWithAssignee>();

interface ColumnOptions {
  isAdmin: boolean;
  includeSelection: boolean;
  onDelete?: (leadId: string) => void;
}

// Row actions dropdown component
function RowActionsDropdown({
  leadId,
  isAdmin,
  onDelete,
}: {
  leadId: string;
  isAdmin: boolean;
  onDelete?: (leadId: string) => void;
}) {
  return (
    <DropdownMenu
      position="bottom-right"
      widthClass="w-48"
      trigger={
        <Button variant="circleHover" size="circle">
          <IconDots size={20} />
        </Button>
      }
    >
      <DropdownMenuContent>
        <DropdownMenuItem
          href={`/leads/${leadId}`}
          icon={<IconEye size={16} />}
        >
          Voir détails
        </DropdownMenuItem>
        <DropdownMenuItem
          href={`/leads/${leadId}`}
          icon={<IconEdit size={16} />}
        >
          Modifier
        </DropdownMenuItem>
        {isAdmin && onDelete && (
          <>
            <DropdownMenuDivider />
            <DropdownMenuItem
              onClick={() => onDelete(leadId)}
              icon={<IconTrash size={16} />}
              variant="danger"
            >
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getLeadColumns({ isAdmin, includeSelection, onDelete }: ColumnOptions) {
  const columns = [];

  // Selection column (admin only)
  if (includeSelection) {
    columns.push(
      columnHelper.display({
        id: 'selection',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="checkbox"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="checkbox"
          />
        ),
        size: 40,
      })
    );
  }

  // Name column with link (sortable by last_name)
  columns.push(
    columnHelper.accessor(
      (row) =>
        `${row.last_name || ''} ${row.first_name || ''}`.trim() || 'Sans nom',
      {
        id: 'name',
        header: () => <SortableHeader columnId="last_name" label={COLUMN_LABELS.name} />,
        cell: (info) => (
          <Link
            href={`/leads/${info.row.original.id}`}
            className="text-primary hover:underline font-medium"
          >
            {info.getValue()}
          </Link>
        ),
        size: 150,
      }
    )
  );

  // Email (with click to copy - inline variant for compact table)
  columns.push(
    columnHelper.accessor('email', {
      header: () => COLUMN_LABELS.email,
      cell: (info) => (
        <CopyableText
          text={info.getValue() || ''}
          variant="inline"
          className="text-darklink text-sm max-w-40"
        />
      ),
      size: 180,
    })
  );

  // Phone (with click to copy - inline variant for compact table)
  columns.push(
    columnHelper.accessor('phone', {
      header: () => COLUMN_LABELS.phone,
      cell: (info) => (
        <CopyableText
          text={info.getValue() || ''}
          variant="inline"
          className="text-darklink text-sm max-w-32"
        />
      ),
      size: 120,
    })
  );

  // Company (sortable)
  columns.push(
    columnHelper.accessor('company', {
      header: () => <SortableHeader columnId="company" label={COLUMN_LABELS.company} />,
      cell: (info) => (
        <span className="text-darklink text-sm truncate max-w-30 block">{info.getValue() || '-'}</span>
      ),
      size: 130,
    })
  );

  // Status badge (clickable, sortable)
  columns.push(
    columnHelper.accessor('status', {
      header: () => <SortableHeader columnId="status" label={COLUMN_LABELS.status} />,
      cell: (info) => (
        <LeadStatusBadge
          leadId={info.row.original.id}
          status={info.getValue()}
          statusLabel={info.row.original.status_label}
        />
      ),
      size: 155,
    })
  );

  // Assignee
  columns.push(
    columnHelper.accessor('assignee', {
      header: () => COLUMN_LABELS.assignee,
      cell: (info) => (
        <span className="text-darklink text-sm truncate max-w-25 block">
          {info.getValue()?.display_name || 'Non assigne'}
        </span>
      ),
      size: 110,
    })
  );

  // Updated at (sortable)
  columns.push(
    columnHelper.accessor('updated_at', {
      header: () => <SortableHeader columnId="updated_at" label={COLUMN_LABELS.updatedAt} />,
      cell: (info) => (
        <span className="text-sm text-darklink">
          {new Date(info.getValue()).toLocaleDateString('fr-FR')}
        </span>
      ),
      size: 100,
    })
  );

  // Actions dropdown
  columns.push(
    columnHelper.display({
      id: 'actions',
      header: () => '',
      cell: (info) => (
        <RowActionsDropdown
          leadId={info.row.original.id}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      ),
      size: 50,
    })
  );

  return columns;
}
