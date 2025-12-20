'use client';

import { UserAvatar } from '@/modules/shared';
import { formatRelativeTime } from '../lib/format';
import type { SupportTicketCommentWithAuthor } from '../types';

interface TicketCommentBubbleProps {
  comment: SupportTicketCommentWithAuthor;
  isCurrentUser: boolean;
}

/**
 * Intercom-style message bubble with avatar
 */
export function TicketCommentBubble({
  comment,
  isCurrentUser,
}: TicketCommentBubbleProps) {
  // Handle both camelCase and snake_case field names from API
  const author = comment.author as { displayName?: string; display_name?: string; avatar?: string | null } | undefined;
  const authorName = author?.displayName || author?.display_name || 'Inconnu';
  const commentData = comment as { createdAt?: Date | string; created_at?: string };
  const dateValue = commentData.createdAt || commentData.created_at;
  const formattedTime = formatMessageTime(dateValue);

  return (
    <div className={`message-row ${isCurrentUser ? 'message-row-self' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0">
        <UserAvatar
          name={authorName}
          avatar={comment.author?.avatar}
          size="md"
        />
      </div>

      {/* Message content */}
      <div className="message-content">
        {/* Header: name + time */}
        <div className="message-header">
          <span className="message-author">{authorName}</span>
          <span className="message-time">{formattedTime}</span>
        </div>

        {/* Message body */}
        <div className={`message-body ${isCurrentUser ? 'message-body-self' : 'message-body-other'}`}>
          <p className="whitespace-pre-wrap break-words m-0">
            {comment.body}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Format time for message display
 * Shows time for today, date for older messages
 */
function formatMessageTime(dateValue: string | Date | undefined): string {
  if (!dateValue) return '-';
  
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return formatRelativeTime(date);
}
