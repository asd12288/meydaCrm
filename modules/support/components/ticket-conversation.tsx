'use client';

import { useEffect, useRef } from 'react';
import { TicketCommentBubble } from './ticket-comment-bubble';
import type { SupportTicketCommentWithAuthor, SupportTicketWithDetails } from '../types';

interface TicketConversationProps {
  ticket: SupportTicketWithDetails;
  comments: SupportTicketCommentWithAuthor[];
  currentUserId: string | null;
}

/**
 * Conversation thread for ticket messages
 * Shows the initial ticket description as the first message
 */
export function TicketConversation({
  ticket,
  comments,
  currentUserId,
}: TicketConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  // Handle both camelCase and snake_case for ticket created_at
  const ticketData = ticket as { createdAt?: Date | string; created_at?: string };
  const ticketCreatedAt = ticketData.createdAt || ticketData.created_at || new Date();

  // Create a virtual "first message" from the ticket description
  const initialMessage: SupportTicketCommentWithAuthor = {
    id: `ticket-desc-${ticket.id}`,
    ticketId: ticket.id,
    authorId: ticket.createdBy,
    body: ticket.description,
    isInternal: false,
    createdAt: typeof ticketCreatedAt === 'string' ? new Date(ticketCreatedAt) : ticketCreatedAt,
    updatedAt: typeof ticketCreatedAt === 'string' ? new Date(ticketCreatedAt) : ticketCreatedAt,
    author: ticket.createdByProfile,
  };

  // Combine initial message with comments
  const allMessages = [initialMessage, ...comments];

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="p-5">
        {allMessages.map((comment) => (
          <TicketCommentBubble
            key={comment.id}
            comment={comment}
            isCurrentUser={comment.authorId === currentUserId}
          />
        ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
