'use client';

import { useState, useTransition } from 'react';
import { IconArrowRight, IconLoader2 } from '@tabler/icons-react';
import { UserAvatar } from '@/modules/shared';
import { transferLead } from '../lib/actions';
import type { SalesUser } from '../types';

interface TransferLeadSubmenuProps {
  leadId: string;
  currentUserId: string;
  salesUsers: SalesUser[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function TransferLeadSubmenu({
  leadId,
  currentUserId,
  salesUsers,
  onSuccess,
  onError,
}: TransferLeadSubmenuProps) {
  const [isPending, startTransition] = useTransition();
  const [transferringTo, setTransferringTo] = useState<string | null>(null);

  // Filter out current user and non-sales users
  const transferableUsers = salesUsers.filter(
    (user) => user.id !== currentUserId && user.role === 'sales'
  );

  const handleTransfer = (userId: string) => {
    setTransferringTo(userId);
    startTransition(async () => {
      const result = await transferLead(leadId, userId);
      if (result.error) {
        onError?.(result.error);
      } else {
        onSuccess?.();
      }
      setTransferringTo(null);
    });
  };

  if (transferableUsers.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-darklink italic">
        Aucun commercial disponible
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto scrollbar-thin">
      {transferableUsers.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => handleTransfer(user.id)}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ld hover:bg-lightgray dark:hover:bg-darkmuted transition-colors disabled:opacity-50"
        >
          <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
          <span className="flex-1 truncate text-left">
            {user.display_name || 'Sans nom'}
          </span>
          {transferringTo === user.id ? (
            <IconLoader2 size={16} className="animate-spin text-primary" />
          ) : (
            <IconArrowRight size={16} className="text-darklink" />
          )}
        </button>
      ))}
    </div>
  );
}
