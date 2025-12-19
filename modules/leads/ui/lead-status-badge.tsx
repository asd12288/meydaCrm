'use client';

import { useOptimistic, startTransition } from 'react';
import { Dropdown, DropdownItem } from 'flowbite-react';
import {
  IconChevronDown,
  IconCalendarEvent,
  IconPhoneOff,
  IconPhoneX,
  IconBan,
  IconThumbDown,
  IconCash,
  IconPhoneCall,
  IconRefresh,
  IconMail,
} from '@tabler/icons-react';
import { STATUS_COLORS, LEAD_STATUS_OPTIONS } from '../config/constants';
import { updateLeadStatus } from '../lib/actions';
import type { LeadStatus } from '@/db/types';

// Map status to icon component
const STATUS_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  rdv: IconCalendarEvent,
  no_answer_1: IconPhoneOff,
  no_answer_2: IconPhoneX,
  wrong_number: IconBan,
  not_interested: IconThumbDown,
  deposit: IconCash,
  callback: IconPhoneCall,
  relance: IconRefresh,
  mail: IconMail,
};

// Map badge classes to actual CSS color values for inline styles
const BADGE_TO_COLOR: Record<string, string> = {
  'badge-success': 'var(--color-success)',
  'badge-warning': 'var(--color-warning)',
  'badge-error': 'var(--color-error)',
  'badge-info': 'var(--color-info)',
  'badge-primary': 'var(--color-primary)',
  'badge-secondary': 'var(--color-secondary)',
};

interface LeadStatusBadgeProps {
  leadId: string;
  status: LeadStatus;
  statusLabel: string;
  editable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Size configuration for badges
const SIZE_CONFIG = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 12, chevron: 10 },
  md: { badge: 'px-2.5 py-0.5 text-xs', icon: 12, chevron: 12 },
  lg: { badge: 'px-4 py-1.5 text-sm', icon: 16, chevron: 14 },
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
    <Dropdown
      label=""
      dismissOnClick
      theme={{
        floating: {
          base: 'z-[9999] w-fit rounded-lg divide-y divide-gray-100 shadow-lg focus:outline-none',
        },
      }}
      renderTrigger={() => (
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold cursor-pointer hover:opacity-80 transition-opacity ${sizeConfig.badge} ${colorClass}`}
        >
          {StatusIcon && <StatusIcon size={sizeConfig.icon} />}
          {currentLabel}
          <IconChevronDown size={sizeConfig.chevron} />
        </button>
      )}
    >
      {LEAD_STATUS_OPTIONS.map((option) => {
        const OptionIcon = STATUS_ICON_MAP[option.value];
        const badgeClass = STATUS_COLORS[option.value] || 'badge-primary';
        const iconColor = BADGE_TO_COLOR[badgeClass] || 'var(--color-primary)';
        const hoverClass = `hover-${badgeClass.replace('badge-', 'text-')}`;

        return (
          <DropdownItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={`flex items-center gap-2 ${hoverClass} ${
              option.value === optimisticStatus ? 'font-medium bg-lightgray dark:bg-darkborder' : ''
            }`}
          >
            {OptionIcon ? (
              <OptionIcon size={14} style={{ color: iconColor }} />
            ) : (
              <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[option.value]}`} />
            )}
            {option.label}
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
