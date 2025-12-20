'use client';

import { useEffect, useRef } from 'react';
import { IconMessageCircle } from '@tabler/icons-react';
import { TicketCommentBubble } from './ticket-comment-bubble';
import type { SupportTicketCommentWithAuthor } from '../types';

interface TicketConversationProps {
  comments: SupportTicketCommentWithAuthor[];
  currentUserId: string | null;
}

/**
 * Conversation thread for ticket messages
 */
export function TicketConversation({
  comments,
  currentUserId,
}: TicketConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (comments.length === 0) {
    return (
      <div className="ticket-empty-state h-full">
        <IconMessageCircle size={40} className="ticket-empty-icon" />
        <p className="ticket-empty-title">Aucun message</p>
        <p className="ticket-empty-text">Soyez le premier à répondre</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="p-5">
        {comments.map((comment) => (
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
