'use client';

import { IconX } from '@tabler/icons-react';
import { bulkAssignLeads } from '../lib/actions';
import { AssignDropdown } from '../ui/assign-dropdown';
import type { SalesUser } from '../types';

interface BulkActionsBarProps {
  selectedIds: string[];
  salesUsers: SalesUser[];
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedIds,
  salesUsers,
  onClearSelection,
}: BulkActionsBarProps) {
  const handleAssign = (userIds: string | string[] | null) => {
    if (selectedIds.length === 0) return;

    // Optimistic: clear immediately
    const idsToAssign = [...selectedIds];
    onClearSelection();

    // Handle single user assignment (including unassign with null)
    if (userIds === null || typeof userIds === 'string') {
      bulkAssignLeads(idsToAssign, userIds);
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

    // Fire assignments in parallel
    Object.entries(assignmentsByUser).forEach(([assigneeId, leadIds]) => {
      bulkAssignLeads(leadIds, assigneeId);
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-darkgray border border-ld rounded-full shadow-xl dark:shadow-dark-lg">
        {/* Selection indicator */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">
            {selectedIds.length}
          </span>
          <span className="text-sm font-medium text-ld">
            lead{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-bordergray dark:bg-darkborder" />

        {/* Assign dropdown with multi-select for distribution */}
        <AssignDropdown
          salesUsers={salesUsers}
          onAssign={handleAssign}
          enableMultiSelect
        />

        {/* Divider */}
        <div className="w-px h-6 bg-bordergray dark:bg-darkborder" />

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center justify-center w-8 h-8 rounded-full text-darklink hover:bg-lighterror hover:text-error transition-colors"
          title="Annuler la sélection"
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}
