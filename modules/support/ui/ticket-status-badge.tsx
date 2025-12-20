'use client';

import type { SupportTicketStatus } from '@/db/types';
import { Badge } from '@/modules/shared';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
} from '../config/constants';

interface TicketStatusBadgeProps {
  status: SupportTicketStatus;
  className?: string;
}

export function TicketStatusBadge({
  status,
  className = '',
}: TicketStatusBadgeProps) {
  const label = TICKET_STATUS_LABELS[status];
  const color = TICKET_STATUS_COLORS[status];

  return (
    <Badge variant={color} className={className}>
      {label}
    </Badge>
  );
}
