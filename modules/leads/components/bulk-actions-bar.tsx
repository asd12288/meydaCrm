'use client';

import { useState, useTransition } from 'react';
import { IconX, IconTransfer } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { useToast } from '@/modules/shared';
import { bulkAssignLeads } from '../lib/actions';
import { AssignDropdown } from '../ui/assign-dropdown';
import { BulkTransferDialog } from './bulk-transfer-dialog';
import type { SalesUser } from '../types';

interface BulkActionsBarProps {
  selectedIds: string[];
  salesUsers: SalesUser[];
  onClearSelection: () => void;
  /** If true, shows admin actions (assign). If false, shows sales actions (transfer) */
  isAdmin?: boolean;
  /** Current user ID (required for transfer feature) */
  currentUserId?: string;
}

export function BulkActionsBar({
  selectedIds,
  salesUsers,
  onClearSelection,
  isAdmin = true,
  currentUserId,
}: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const { toast } = useToast();

  const handleAssign = (userIds: string | string[] | null) => {
    if (selectedIds.length === 0) return;

    // Save IDs before clearing
    const idsToAssign = [...selectedIds];
    const totalLeads = idsToAssign.length;

    // Optimistic: clear selection immediately
    onClearSelection();

    startTransition(async () => {
      try {
        // Handle single user assignment (including unassign with null)
        if (userIds === null || typeof userIds === 'string') {
          const result = await bulkAssignLeads(idsToAssign, userIds);
          if (result.error) {
            toast.error(result.error);
          } else {
            const count = result.count ?? 0;
            const action = userIds === null ? 'désassignés' : 'assignés';
            toast.success(`${count} lead${count > 1 ? 's' : ''} ${action}`);
          }
          return;
        }

        // Multi-user: distribute leads evenly (round-robin)
        const assigneeIds = userIds;
        if (assigneeIds.length === 0) return;

        // Group leads by assignee for efficient batch calls
        const assignmentsByUser: Record<string, string[]> = {};
        for (let i = 0; i < idsToAssign.length; i++) {
          const assigneeId = assigneeIds[i % assigneeIds.length];
          if (!assignmentsByUser[assigneeId]) {
            assignmentsByUser[assigneeId] = [];
          }
          assignmentsByUser[assigneeId].push(idsToAssign[i]);
        }

        // Fire assignments in parallel and wait for all
        const results = await Promise.all(
          Object.entries(assignmentsByUser).map(([assigneeId, leadIds]) =>
            bulkAssignLeads(leadIds, assigneeId)
          )
        );

        // Calculate totals
        const totalAssigned = results.reduce((sum, r) => sum + (r.count || 0), 0);
        const errors = results.filter((r) => r.error);

        if (errors.length > 0) {
          if (totalAssigned > 0) {
            toast.warning(`${totalAssigned}/${totalLeads} leads assignés`);
          } else {
            toast.error('Erreur lors de l\'assignation');
          }
        } else {
          toast.success(`${totalAssigned} lead${totalAssigned > 1 ? 's' : ''} assigné${totalAssigned > 1 ? 's' : ''}`);
        }
      } catch {
        toast.error('Erreur lors de l\'assignation');
      }
    });
  };

  // Check if transfer is available for sales users
  const canTransfer = !isAdmin && currentUserId && salesUsers.some(
    (u) => u.id !== currentUserId && u.role === 'sales'
  );

  const handleTransferSuccess = () => {
    onClearSelection();
    setShowTransferDialog(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-darkgray border border-ld rounded-full shadow-xl dark:shadow-dark-lg hover:shadow-2xl transition-shadow duration-200">
          {/* Selection indicator */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold transition-transform duration-200 hover:scale-110">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium text-ld">
              lead{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-bordergray dark:bg-darkborder" />

          {/* Admin: Assign dropdown with multi-select for distribution */}
          {isAdmin && (
            <AssignDropdown
              salesUsers={salesUsers}
              onAssign={handleAssign}
              enableMultiSelect
              disabled={isPending}
            />
          )}

          {/* Sales: Transfer button */}
          {canTransfer && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTransferDialog(true)}
              disabled={isPending}
              className="gap-2"
            >
              <IconTransfer size={16} />
              Transférer
            </Button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-bordergray dark:bg-darkborder" />

          {/* Clear selection */}
          <Button
            type="button"
            variant="ghostDanger"
            size="iconSm"
            onClick={onClearSelection}
            className="rounded-full"
            title="Annuler la sélection"
            disabled={isPending}
          >
            <IconX size={18} />
          </Button>
        </div>
      </div>

      {/* Bulk Transfer Dialog */}
      {canTransfer && currentUserId && (
        <BulkTransferDialog
          isOpen={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
          selectedIds={selectedIds}
          salesUsers={salesUsers}
          currentUserId={currentUserId}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
}
