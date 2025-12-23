'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { TableEmptyState, ConfirmDialog, useToast, Modal } from '@/modules/shared';
import { MeetingForm } from '@/modules/meetings';
import { getLeadColumns } from '../config/columns';
import { BulkActionsBar } from './bulk-actions-bar';
import { deleteLead } from '../lib/actions';
import type { LeadWithAssignee, SalesUser } from '../types';

interface LeadsTableProps {
  leads: LeadWithAssignee[];
  isAdmin: boolean;
  salesUsers: SalesUser[];
  currentUserId?: string;
}

/**
 * LeadsTable component - simple table with TanStack React Table
 * No virtualization needed since we use server-side pagination
 */
export const LeadsTable = memo(function LeadsTable({
  leads,
  isAdmin,
  salesUsers,
  currentUserId,
}: LeadsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDeleteClick = useCallback((leadId: string) => {
    setDeleteLeadId(leadId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteLeadId || isPending) return;

    const idToDelete = deleteLeadId;
    setDeleteLeadId(null);
    setIsPending(true);

    try {
      const result = await deleteLead(idToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Lead supprimé');
        router.refresh();
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsPending(false);
    }
  }, [deleteLeadId, isPending, toast, router]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteLeadId(null);
  }, []);

  const handleCreateMeeting = useCallback((leadId: string) => {
    setMeetingLeadId(leadId);
  }, []);

  const handleTransferSuccess = useCallback(() => {
    toast.success('Lead transféré avec succès');
    router.refresh();
  }, [toast, router]);

  const handleTransferError = useCallback(
    (error: string) => {
      toast.error(error);
    },
    [toast]
  );

  // Check if sales user can transfer (has other sales users to transfer to)
  const canTransfer = !isAdmin && !!currentUserId && salesUsers.some(
    (u) => u.id !== currentUserId && u.role === 'sales'
  );

  // Enable selection for admin (bulk assign) or sales users who can transfer
  const enableSelection = isAdmin || canTransfer === true;

  const columns = useMemo(
    () =>
      getLeadColumns({
        isAdmin,
        includeSelection: enableSelection,
        currentUserId,
        salesUsers,
        onDelete: isAdmin ? handleDeleteClick : undefined,
        onCreateMeeting: handleCreateMeeting,
        onTransferSuccess: handleTransferSuccess,
        onTransferError: handleTransferError,
      }),
    [isAdmin, enableSelection, currentUserId, salesUsers, handleDeleteClick, handleCreateMeeting, handleTransferSuccess, handleTransferError]
  );

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: enableSelection,
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

  return (
    <>
      <div className="border rounded-md border-ld overflow-auto min-h-100 max-h-[calc(100vh-320px)]">
        <table className="w-full">
          <thead className="bg-lightgray dark:bg-darkgray sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld"
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
            {table.getRowModel().rows.length === 0 ? (
              <TableEmptyState
                colSpan={columns.length}
                message="Aucun lead trouvé"
                className="px-3"
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-ld last:border-b-0 hover:bg-lightgray dark:hover:bg-darkgray ${
                    row.getIsSelected() ? 'bg-lightprimary dark:bg-darkborder' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5 whitespace-nowrap text-sm text-left"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating bulk actions bar (shows when rows selected - admin for assign, sales for transfer) */}
      {enableSelection && selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          salesUsers={salesUsers}
          onClearSelection={clearSelection}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
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

      {/* Create meeting modal */}
      {meetingLeadId && (
        <Modal
          isOpen={!!meetingLeadId}
          onClose={() => setMeetingLeadId(null)}
          title="Planifier un rendez-vous"
        >
          <MeetingForm
            leadId={meetingLeadId}
            onSuccess={() => {
              setMeetingLeadId(null);
              toast.success('Rendez-vous créé');
            }}
            onCancel={() => setMeetingLeadId(null)}
          />
        </Modal>
      )}
    </>
  );
});
