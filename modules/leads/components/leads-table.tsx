'use client';

import { useState, useMemo, useTransition, useOptimistic, useRef, memo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableEmptyState, ConfirmDialog, useToast } from '@/modules/shared';
import { getLeadColumns } from '../config/columns';
import { BulkActionsBar } from './bulk-actions-bar';
import { deleteLead } from '../lib/actions';
import type { LeadWithAssignee, SalesUser } from '../types';

// Row height for virtualization (must match CSS)
const ROW_HEIGHT = 45;

interface LeadsTableProps {
  leads: LeadWithAssignee[];
  isAdmin: boolean;
  salesUsers: SalesUser[];
}

/**
 * LeadsTable component with virtualization and memoization
 * Optimized: Wrapped with React.memo to prevent unnecessary re-renders
 * when parent state changes but leads/isAdmin/salesUsers props remain the same
 */
export const LeadsTable = memo(function LeadsTable({ leads, isAdmin, salesUsers }: LeadsTableProps) {
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic leads state for instant delete feedback
  const [optimisticLeads, removeOptimisticLead] = useOptimistic(
    leads,
    (state, deletedId: string) => state.filter((lead) => lead.id !== deletedId)
  );

  // Memoized callbacks to prevent unnecessary re-renders
  const handleDeleteClick = useCallback((leadId: string) => {
    setDeleteLeadId(leadId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteLeadId) return;

    const idToDelete = deleteLeadId;
    setDeleteLeadId(null); // Close dialog immediately

    startTransition(async () => {
      // Optimistic: remove from UI immediately
      removeOptimisticLead(idToDelete);

      const result = await deleteLead(idToDelete);
      if (result.error) {
        toast.error(result.error);
        // The page will revalidate and restore the lead if delete failed
      } else {
        toast.success('Lead supprimé');
      }
    });
  }, [deleteLeadId, removeOptimisticLead, toast]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteLeadId(null);
  }, []);

  const columns = useMemo(
    () =>
      getLeadColumns({
        isAdmin,
        includeSelection: isAdmin,
        onDelete: isAdmin ? handleDeleteClick : undefined,
      }),
    [isAdmin, handleDeleteClick]
  );

  const table = useReactTable({
    data: optimisticLeads,
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

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

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
                      className={`border-b border-ld last:border-b-0 table-row-animated ${
                        row.getIsSelected() ? 'table-row-selected' : ''
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
});
