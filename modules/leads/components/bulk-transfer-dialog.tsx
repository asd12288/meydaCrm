'use client';

import { useState, useTransition } from 'react';
import { IconTransfer } from '@tabler/icons-react';
import { Modal, useToast, FormActions, UserAvatar } from '@/modules/shared';
import { bulkTransferLeads } from '../lib/actions';
import type { SalesUser } from '../types';

interface BulkTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  salesUsers: SalesUser[];
  currentUserId: string;
  onSuccess: () => void;
}

export function BulkTransferDialog({
  isOpen,
  onClose,
  selectedIds,
  salesUsers,
  currentUserId,
  onSuccess,
}: BulkTransferDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Filter out current user and non-sales users
  const transferableUsers = salesUsers.filter(
    (u) => u.id !== currentUserId && u.role === 'sales'
  );

  const handleTransfer = () => {
    if (!selectedUserId || selectedIds.length === 0) return;

    startTransition(async () => {
      const result = await bulkTransferLeads(selectedIds, selectedUserId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${result.count} lead${result.count !== 1 ? 's' : ''} transféré${result.count !== 1 ? 's' : ''}`
        );
        onSuccess();
        onClose();
      }
    });
  };

  const handleClose = () => {
    setSelectedUserId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Transférer les leads"
      icon={<IconTransfer size={20} className="text-primary" />}
      size="md"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleTransfer(); }} className="space-y-4">
        {/* User selection */}
        <div>
          <label className="form-label mb-2 block">Transférer à</label>
          {transferableUsers.length === 0 ? (
            <p className="text-sm text-darklink italic">Aucun commercial disponible</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transferableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedUserId === user.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-lightgray dark:hover:bg-darkmuted'
                  }`}
                >
                  <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
                  <span className="text-sm font-medium text-ld">{user.display_name}</span>
                  {selectedUserId === user.id && (
                    <span className="ml-auto text-primary text-xs font-medium">Sélectionné</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <FormActions
          isPending={isPending}
          submitLabel="Transférer"
          submitIcon={<IconTransfer size={18} />}
          onCancel={handleClose}
          isDirty={!!selectedUserId && transferableUsers.length > 0}
        />
      </form>
    </Modal>
  );
}
