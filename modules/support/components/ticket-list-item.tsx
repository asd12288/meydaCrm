'use client';

import { IconMessageCircle } from '@tabler/icons-react';
import { formatRelativeTime } from '../lib/format';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '../config/constants';
import type { SupportTicketWithDetails, SupportTicketStatus } from '../types';

interface TicketListItemProps {
  ticket: SupportTicketWithDetails;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Ticket list item with category, subject, status, and time
 */
export function TicketListItem({
  ticket,
  isSelected,
  onClick,
}: TicketListItemProps) {
  // Handle both camelCase and snake_case field names from API
  const ticketData = ticket as { createdAt?: Date | string; created_at?: string };
  const createdAt = ticketData.createdAt || ticketData.created_at || new Date();
  
  const categoryLabel = TICKET_CATEGORY_LABELS[ticket.category] || ticket.category;
  const statusLabel = TICKET_STATUS_LABELS[ticket.status] || ticket.status;

  return (
    <div
      onClick={onClick}
      className={`ticket-list-item-v2 ${isSelected ? 'ticket-list-item-v2-selected' : ''}`}
    >
      {/* Top row: Category badge + Time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`ticket-category-tag ticket-category-tag-${ticket.category}`}>
          {categoryLabel}
        </span>
        <span className="text-xs text-darklink">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      {/* Subject */}
      <h4 className="text-sm font-medium text-ld line-clamp-2 mb-2">
        {ticket.subject}
      </h4>

      {/* Bottom row: Status + Comments */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <StatusDot status={ticket.status} />
          <span className="text-xs text-darklink">{statusLabel}</span>
        </div>
        
        {ticket.commentCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-darklink">
            <IconMessageCircle size={14} />
            {ticket.commentCount}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Status indicator dot
 */
function StatusDot({ status }: { status: SupportTicketStatus }) {
  return <span className={`status-dot status-dot-${status}`} />;
}
