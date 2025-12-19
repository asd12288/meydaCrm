'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { IconDots, IconEye, IconEdit } from '@tabler/icons-react';
import { LeadStatusBadge } from '../ui/lead-status-badge';
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

  // Name column with link
  columns.push(
    columnHelper.accessor(
      (row) =>
        `${row.last_name || ''} ${row.first_name || ''}`.trim() || 'Sans nom',
      {
        id: 'name',
        header: () => COLUMN_LABELS.name,
        cell: (info) => (
          <Link
            href={`/leads/${info.row.original.id}`}
            className="text-primary hover:underline font-medium"
          >
            {info.getValue()}
          </Link>
        ),
        size: 180,
      }
    )
  );

  // Email
  columns.push(
    columnHelper.accessor('email', {
      header: () => COLUMN_LABELS.email,
      cell: (info) => (
        <span className="text-darklink text-sm">{info.getValue() || '-'}</span>
      ),
      size: 200,
    })
  );

  // Phone
  columns.push(
    columnHelper.accessor('phone', {
      header: () => COLUMN_LABELS.phone,
      cell: (info) => (
        <span className="text-darklink text-sm">{info.getValue() || '-'}</span>
      ),
      size: 130,
    })
  );

  // Company
  columns.push(
    columnHelper.accessor('company', {
      header: () => COLUMN_LABELS.company,
      cell: (info) => (
        <span className="text-darklink text-sm">{info.getValue() || '-'}</span>
      ),
      size: 150,
    })
  );

  // Status badge (clickable)
  columns.push(
    columnHelper.accessor('status', {
      header: () => COLUMN_LABELS.status,
      cell: (info) => (
        <LeadStatusBadge
          leadId={info.row.original.id}
          status={info.getValue()}
          statusLabel={info.row.original.status_label}
        />
      ),
      size: 140,
    })
  );

  // Assignee
  columns.push(
    columnHelper.accessor('assignee', {
      header: () => COLUMN_LABELS.assignee,
      cell: (info) => (
        <span className="text-darklink text-sm">
          {info.getValue()?.display_name || 'Non assigne'}
        </span>
      ),
      size: 140,
    })
  );

  // Updated at
  columns.push(
    columnHelper.accessor('updated_at', {
      header: () => COLUMN_LABELS.updatedAt,
      cell: (info) => (
        <span className="text-sm text-darklink">
          {new Date(info.getValue()).toLocaleDateString('fr-FR')}
        </span>
      ),
      size: 110,
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
