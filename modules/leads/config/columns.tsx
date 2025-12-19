'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { IconDots, IconEye, IconEdit } from '@tabler/icons-react';
import { CopyableText } from '@/modules/shared';
import { LeadStatusBadge } from '../ui/lead-status-badge';
import { SortableHeader } from '../ui/sortable-header';
import { COLUMN_LABELS } from './constants';
import type { LeadWithAssignee } from '../types';

const columnHelper = createColumnHelper<LeadWithAssignee>();

interface ColumnOptions {
  isAdmin: boolean;
  includeSelection: boolean;
}

// Row actions dropdown component using Flowbite
function RowActionsDropdown({ leadId }: { leadId: string }) {
  return (
    <Dropdown
      label=""
      dismissOnClick
      renderTrigger={() => (
        <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-lightprimary hover:text-primary cursor-pointer transition-colors">
          <IconDots size={20} />
        </span>
      )}
    >
      <DropdownItem
        as={Link}
        href={`/leads/${leadId}`}
        className="flex items-center gap-3"
      >
        <IconEye size={16} />
        Voir details
      </DropdownItem>
      <DropdownItem
        as={Link}
        href={`/leads/${leadId}`}
        className="flex items-center gap-3"
      >
        <IconEdit size={16} />
        Modifier
      </DropdownItem>
    </Dropdown>
  );
}

export function getLeadColumns({ isAdmin, includeSelection }: ColumnOptions) {
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
      cell: (info) => <RowActionsDropdown leadId={info.row.original.id} />,
      size: 50,
    })
  );

  return columns;
}
