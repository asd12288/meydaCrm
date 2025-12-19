'use client';

import { useTransition } from 'react';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { IconChevronDown } from '@tabler/icons-react';
import { toast } from '@/modules/shared';
import { STATUS_COLORS, LEAD_STATUS_OPTIONS } from '../config/constants';
import { updateLeadStatus } from '../lib/actions';
import type { LeadStatus } from '@/db/types';

interface LeadStatusBadgeProps {
  leadId: string;
  status: LeadStatus;
  statusLabel: string;
  editable?: boolean;
}

export function LeadStatusBadge({
  leadId,
  status,
  statusLabel,
  editable = true,
}: LeadStatusBadgeProps) {
  const [isPending, startTransition] = useTransition();
  const colorClass = STATUS_COLORS[status] || 'badge-primary';

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (newStatus === status) return;

    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.error) {
        toast.error('Erreur', result.error);
      } else {
        toast.success('Statut mis a jour');
      }
    });
  };

  // Non-editable badge
  if (!editable) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
      >
        {statusLabel}
      </span>
    );
  }

  return (
    <Dropdown
      label=""
      dismissOnClick
      renderTrigger={() => (
        <button
          type="button"
          disabled={isPending}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${colorClass} ${
            isPending ? 'opacity-50' : ''
          }`}
        >
          {isPending ? 'Mise a jour...' : statusLabel}
          <IconChevronDown size={12} />
        </button>
      )}
    >
      {LEAD_STATUS_OPTIONS.map((option) => (
        <DropdownItem
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          className={`flex items-center gap-2 ${
            option.value === status ? 'font-medium bg-lightgray dark:bg-darkborder' : ''
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${STATUS_COLORS[option.value]}`}
          />
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
