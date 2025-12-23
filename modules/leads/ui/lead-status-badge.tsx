'use client';

import { useOptimistic, startTransition } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/modules/shared';
import {
  STATUS_COLORS,
  LEAD_STATUS_OPTIONS,
  STATUS_ICON_MAP,
  BADGE_TO_COLOR,
} from '../config/constants';
import { updateLeadStatus } from '../lib/actions';
import type { LeadStatus } from '@/db/types';

interface LeadStatusBadgeProps {
  leadId: string;
  status: LeadStatus;
  statusLabel: string;
  editable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Size configuration for badges
const SIZE_CONFIG = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 14, chevron: 10 },
  md: { badge: 'px-2.5 py-0.5 text-xs', icon: 14, chevron: 12 },
  lg: { badge: 'px-4 py-1.5 text-sm', icon: 18, chevron: 14 },
};

export function LeadStatusBadge({
  leadId,
  status,
  statusLabel,
  editable = true,
  size = 'md',
}: LeadStatusBadgeProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  const currentOption = LEAD_STATUS_OPTIONS.find((o) => o.value === optimisticStatus);
  const currentLabel = currentOption?.label || statusLabel;
  const colorClass = STATUS_COLORS[optimisticStatus] || 'badge-primary';
  const StatusIcon = STATUS_ICON_MAP[optimisticStatus];
  const sizeConfig = SIZE_CONFIG[size];

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
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeConfig.badge} ${colorClass}`}
      >
        {StatusIcon && <StatusIcon size={sizeConfig.icon} />}
        {statusLabel}
      </span>
    );
  }

  return (
    <DropdownMenu
      position="bottom-left"
      widthClass="w-48"
      portal
      trigger={
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold cursor-pointer hover:opacity-80 transition-opacity ${sizeConfig.badge} ${colorClass}`}
        >
          {StatusIcon && <StatusIcon size={sizeConfig.icon} />}
          {currentLabel}
          <IconChevronDown size={sizeConfig.chevron} />
        </button>
      }
    >
      <DropdownMenuContent maxHeight="300px">
        {LEAD_STATUS_OPTIONS.map((option) => {
          const OptionIcon = STATUS_ICON_MAP[option.value];
          const badgeClass = STATUS_COLORS[option.value] || 'badge-primary';
          const iconColor = BADGE_TO_COLOR[badgeClass] || 'var(--color-primary)';

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={
                option.value === optimisticStatus ? 'font-medium bg-lightgray dark:bg-darkborder' : ''
              }
            >
              <span className="flex items-center gap-2">
                {OptionIcon ? (
                  <OptionIcon size={14} style={{ color: iconColor }} />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[option.value]}`} />
                )}
                {option.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
