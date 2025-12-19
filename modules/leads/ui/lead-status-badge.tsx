'use client';

import { useOptimistic, startTransition } from 'react';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { IconChevronDown } from '@tabler/icons-react';
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
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  const currentOption = LEAD_STATUS_OPTIONS.find((o) => o.value === optimisticStatus);
  const currentLabel = currentOption?.label || statusLabel;
  const colorClass = STATUS_COLORS[optimisticStatus] || 'badge-primary';

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (newStatus === optimisticStatus) return;

    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateLeadStatus(leadId, newStatus);
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
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
        >
          {currentLabel}
          <IconChevronDown size={12} />
        </button>
      )}
    >
      {LEAD_STATUS_OPTIONS.map((option) => (
        <DropdownItem
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          className={`flex items-center gap-2 ${
            option.value === optimisticStatus ? 'font-medium bg-lightgray dark:bg-darkborder' : ''
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
