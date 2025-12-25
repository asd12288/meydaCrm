'use client';

import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import {
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconTransfer,
  IconChevronLeft,
} from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import {
  CopyableText,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { LeadStatusBadge } from '../ui/lead-status-badge';
import { SortableHeader } from '../ui/sortable-header';
import { TransferLeadSubmenu } from '../ui/transfer-lead-submenu';
import { COLUMN_LABELS } from './constants';
import { ROLES } from '@/lib/constants';
import type { LeadWithAssignee, SalesUser } from '../types';

const columnHelper = createColumnHelper<LeadWithAssignee>();

interface ColumnOptions {
  isAdmin: boolean;
  includeSelection: boolean;
  currentUserId?: string;
  salesUsers?: SalesUser[];
  onDelete?: (leadId: string) => void;
  onCreateMeeting?: (leadId: string) => void;
  onTransferSuccess?: () => void;
  onTransferError?: (error: string) => void;
}

// Row actions dropdown component
function RowActionsDropdown({
  leadId,
  isAdmin,
  currentUserId,
  salesUsers,
  onDelete,
  onCreateMeeting,
  onTransferSuccess,
  onTransferError,
}: {
  leadId: string;
  isAdmin: boolean;
  currentUserId?: string;
  salesUsers?: SalesUser[];
  onDelete?: (leadId: string) => void;
  onCreateMeeting?: (leadId: string) => void;
  onTransferSuccess?: () => void;
  onTransferError?: (error: string) => void;
}) {
  const [showTransferSubmenu, setShowTransferSubmenu] = useState(false);

  // Check if transfer option should be shown (non-admin with valid data)
  const otherSalesUsers = salesUsers?.filter((u) => u.id !== currentUserId && u.role === ROLES.SALES) || [];
  const canTransfer = !isAdmin && !!currentUserId && salesUsers && otherSalesUsers.length > 0;

  // Reset submenu state when dropdown closes (via click outside)
  const handleTriggerClick = () => {
    // Reset submenu state for next open
    setShowTransferSubmenu(false);
  };

  return (
    <DropdownMenu
      position="bottom-right"
      widthClass="w-60"
      closeOnClick={!showTransferSubmenu}
      portal
      autoFlip
      trigger={
        <div onClick={handleTriggerClick}>
          <Button variant="circleHover" size="circle">
            <IconDots size={20} />
          </Button>
        </div>
      }
    >
      <DropdownMenuContent>
        {showTransferSubmenu ? (
          <>
            {/* Back button + Transfer header */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTransferSubmenu(false)}
              className="w-full justify-start rounded-none px-4 py-2 text-xs font-medium text-darklink uppercase tracking-wide border-b border-ld"
            >
              <IconChevronLeft size={14} />
              Transférer à
            </Button>
            <TransferLeadSubmenu
              leadId={leadId}
              currentUserId={currentUserId!}
              salesUsers={salesUsers!}
              onSuccess={onTransferSuccess}
              onError={onTransferError}
            />
          </>
        ) : (
          <>
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
            {onCreateMeeting && (
              <DropdownMenuItem
                onClick={() => onCreateMeeting(leadId)}
                icon={<IconCalendar size={16} />}
              >
                Planifier un rendez-vous
              </DropdownMenuItem>
            )}

            {/* Transfer option - only for sales users */}
            {canTransfer && (
              <>
                <DropdownMenuDivider />
                {/* Custom button without data-menu-item to prevent dropdown close */}
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransferSubmenu(true);
                  }}
                  className="w-full justify-start rounded-none px-4 py-2.5 text-sm"
                >
                  <span className="text-darklink"><IconTransfer size={16} /></span>
                  Transférer le lead
                </Button>
              </>
            )}

            {/* Delete option - admin only */}
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getLeadColumns({
  isAdmin,
  includeSelection,
  currentUserId,
  salesUsers,
  onDelete,
  onCreateMeeting,
  onTransferSuccess,
  onTransferError,
}: ColumnOptions) {
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
            className="text-primary hover:underline font-medium truncate block max-w-32"
            title={info.getValue()}
          >
            {info.getValue()}
          </Link>
        ),
        size: 120,
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

  // Assignee (admin only - sales users only see their own leads)
  if (isAdmin) {
    columns.push(
      columnHelper.accessor('assignee', {
        header: () => COLUMN_LABELS.assignee,
        cell: (info) => (
          <span className="text-darklink text-sm truncate max-w-25 block">
            {info.getValue()?.display_name || 'Non assigné'}
          </span>
        ),
        size: 110,
      })
    );
  }

  // Created at (sortable)
  columns.push(
    columnHelper.accessor('created_at', {
      header: () => <SortableHeader columnId="created_at" label={COLUMN_LABELS.createdAt} />,
      cell: (info) => (
        <span className="text-sm text-darklink whitespace-nowrap">
          {new Date(info.getValue()).toLocaleDateString('fr-FR')}
        </span>
      ),
      size: 90,
    })
  );

  // Updated at / Last modified (sortable)
  columns.push(
    columnHelper.accessor('updated_at', {
      header: () => <SortableHeader columnId="updated_at" label={COLUMN_LABELS.updatedAt} />,
      cell: (info) => (
        <span className="text-sm text-darklink whitespace-nowrap">
          {new Date(info.getValue()).toLocaleDateString('fr-FR')}
        </span>
      ),
      size: 90,
    })
  );

  // Notes/Description (truncated for responsive design)
  columns.push(
    columnHelper.accessor('notes', {
      header: () => COLUMN_LABELS.notes,
      cell: (info) => {
        const notes = info.getValue();
        if (!notes) return <span className="text-darklink/50 text-sm italic">-</span>;
        return (
          <span
            className="text-darklink text-sm line-clamp-1 max-w-40"
            title={notes}
          >
            {notes}
          </span>
        );
      },
      size: 160,
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
          currentUserId={currentUserId}
          salesUsers={salesUsers}
          onDelete={onDelete}
          onCreateMeeting={onCreateMeeting}
          onTransferSuccess={onTransferSuccess}
          onTransferError={onTransferError}
        />
      ),
      size: 50,
    })
  );

  return columns;
}
