'use client';

import { useState, useTransition } from 'react';
import { IconX, IconUserPlus } from '@tabler/icons-react';
import { bulkAssignLeads } from '../lib/actions';
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
  const [assigneeId, setAssigneeId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAssign = () => {
    if (!assigneeId) return;

    setError(null);
    startTransition(async () => {
      const result = await bulkAssignLeads(selectedIds, assigneeId);
      if (result.error) {
        setError(result.error);
      } else {
        setAssigneeId('');
        onClearSelection();
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-lightprimary dark:bg-darkborder rounded-md mb-4">
      {/* Selection count */}
      <span className="text-sm font-medium text-primary dark:text-white">
        {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selectionne
        {selectedIds.length > 1 ? 's' : ''}
      </span>

      {/* Assign controls */}
      <div className="flex items-center gap-2">
        <IconUserPlus size={18} className="text-primary dark:text-white" />
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="select-md"
          disabled={isPending}
        >
          <option value="">Assigner a...</option>
          {salesUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.display_name || 'Sans nom'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={!assigneeId || isPending}
          className="ui-button-small bg-primary text-white hover:bg-primaryemphasis disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Assignation...' : 'Assigner'}
        </button>
      </div>

      {/* Error message */}
      {error && <span className="text-sm text-error">{error}</span>}

      {/* Clear selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-darklink hover:text-error transition-colors ml-auto"
      >
        <IconX size={16} />
        Annuler
      </button>
    </div>
  );
}
