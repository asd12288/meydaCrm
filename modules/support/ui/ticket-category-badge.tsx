'use client';

import type { SupportTicketCategory } from '@/db/types';
import { Badge } from '@/modules/shared';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_ICONS,
} from '../config/constants';

interface TicketCategoryBadgeProps {
  category: SupportTicketCategory;
  className?: string;
}

export function TicketCategoryBadge({
  category,
  className = '',
}: TicketCategoryBadgeProps) {
  const label = TICKET_CATEGORY_LABELS[category];
  const Icon = TICKET_CATEGORY_ICONS[category];

  return (
    <Badge variant="secondary" className={`flex items-center gap-1.5 ${className}`}>
      <Icon size={14} />
      <span>{label}</span>
    </Badge>
  );
}
