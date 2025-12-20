'use client';

import { useState, useMemo, useTransition, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableEmptyState, ConfirmDialog } from '@/modules/shared';
import { getLeadColumns } from '../config/columns';
import { BulkActionsBar } from './bulk-actions-bar';
import { deleteLead } from '../lib/actions';
import { useRouter } from 'next/navigation';
import type { LeadWithAssignee, SalesUser } from '../types';

// Row height for virtualization (must match CSS)
const ROW_HEIGHT = 45;

interface LeadsTableProps {
  leads: LeadWithAssignee[];
  isAdmin: boolean;
  salesUsers: SalesUser[];
}

export function LeadsTable({ leads, isAdmin, salesUsers }: LeadsTableProps) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteClick = (leadId: string) => {
    setDeleteLeadId(leadId);
  };

  const handleDeleteConfirm = () => {
    if (!deleteLeadId) return;

    startTransition(async () => {
      const result = await deleteLead(deleteLeadId);
      if (result.success) {
        setDeleteLeadId(null);
        router.refresh();
      } else {
        // TODO: Show error toast
        console.error(result.error);
      }
    });
  };

  const handleDeleteCancel = () => {
    setDeleteLeadId(null);
  };

  const columns = useMemo(
    () =>
      getLeadColumns({
        isAdmin,
        includeSelection: isAdmin,
        onDelete: isAdmin ? handleDeleteClick : undefined,
      }),
    [isAdmin]
  );

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: isAdmin,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
  });

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [rowSelection]);

  const clearSelection = () => {
    setRowSelection({});
  };

  // Virtualization setup
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => tableContainerRef.current,
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  });

  return (
    <>
      {/* Table container with virtualization */}
      <div
        ref={tableContainerRef}
        className="border rounded-md border-ld overflow-auto max-h-[calc(100vh-320px)]"
      >
        <table className="w-full table-auto">
          <thead className="bg-lightgray dark:bg-darkgray sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-dark">
            {rows.length === 0 ? (
              <TableEmptyState
                colSpan={columns.length}
                message="Aucun lead trouve"
                className="px-3"
              />
            ) : (
              <>
                {/* Spacer for virtualization - pushes content to correct position */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: rowVirtualizer.getVirtualItems()[0]?.start || 0 }}>
                    <td colSpan={columns.length} />
                  </tr>
                )}
                {/* Virtualized rows - only render visible rows */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={(node) => rowVirtualizer.measureElement(node)}
                      className={`border-b border-ld last:border-b-0 hover:bg-lighthover dark:hover:bg-darkgray transition-colors ${
                        row.getIsSelected() ? 'bg-lightprimary dark:bg-darkborder' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2.5 whitespace-nowrap text-sm"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {/* Bottom spacer for virtualization */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height:
                        rowVirtualizer.getTotalSize() -
                        (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0),
                    }}
                  >
                    <td colSpan={columns.length} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating bulk actions bar (admin only, shows when rows selected) */}
      {isAdmin && selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          salesUsers={salesUsers}
          onClearSelection={clearSelection}
        />
      )}

      {/* Delete confirmation dialog */}
      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteLeadId !== null}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le lead"
          message="Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          isPending={isPending}
        />
      )}
    </>
  );
}
