'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { IconArrowLeft, IconMessageCircle } from '@tabler/icons-react';
import { FilterDropdown, type FilterOption } from '@/modules/shared';
import { TicketConversation } from './ticket-conversation';
import { TicketReplyInput } from './ticket-reply-input';
import { formatRelativeTime } from '../lib/format';
import { addComment, updateTicketStatus } from '../lib/actions';
import { 
  TICKET_STATUS_OPTIONS, 
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS 
} from '../config/constants';
import type { 
  SupportTicketWithDetails, 
  SupportTicketCommentWithAuthor, 
  SupportTicketStatus 
} from '../types';

interface TicketDetailPanelProps {
  ticket: SupportTicketWithDetails | null;
  isLoading: boolean;
  isAdmin: boolean;
  currentUserId: string | null;
  onUpdate?: () => void;
  onMobileBack?: () => void;
  showMobileBack?: boolean;
}

/**
 * Ticket detail panel with Intercom-style conversation
 */
export function TicketDetailPanel({
  ticket,
  isLoading,
  isAdmin,
  currentUserId,
  onUpdate,
  onMobileBack,
  showMobileBack = false,
}: TicketDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Optimistic updates for comments
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    ticket?.comments || [],
    (
      state: SupportTicketCommentWithAuthor[],
      newComment: SupportTicketCommentWithAuthor
    ) => [...state, newComment]
  );

  // Status options for dropdown
  const statusOptions: FilterOption[] = TICKET_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Empty state
  if (!ticket && !isLoading) {
    return (
      <div className="ticket-empty-state h-full">
        <IconMessageCircle size={48} className="ticket-empty-icon" />
        <p className="ticket-empty-title">Sélectionnez un ticket</p>
        <p className="ticket-empty-text">
          Choisissez un ticket dans la liste pour voir la conversation
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ticket) return null;

  // Handle both camelCase and snake_case field names from API
  const ticketData = ticket as { createdAt?: Date | string; created_at?: string };
  const createdAt = ticketData.createdAt || ticketData.created_at || new Date();
  const categoryLabel = TICKET_CATEGORY_LABELS[ticket.category] || ticket.category;
  const statusLabel = TICKET_STATUS_LABELS[ticket.status] || ticket.status;

  const handleStatusChange = (newStatus: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTicketStatus({
        ticketId: ticket.id,
        status: newStatus as SupportTicketStatus,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onUpdate?.();
      }
    });
  };

  const handleAddComment = (body: string) => {
    setError(null);

    startTransition(async () => {
      // Optimistic update
      if (currentUserId) {
        const tempComment: SupportTicketCommentWithAuthor = {
          id: `temp-${Date.now()}`,
          ticketId: ticket.id,
          authorId: currentUserId,
          body: body,
          isInternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: currentUserId,
            displayName: 'Vous',
            avatar: null,
            role: 'admin' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        addOptimisticComment(tempComment);
      }

      const result = await addComment({
        ticketId: ticket.id,
        body: body,
        isInternal: false,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onUpdate?.();
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Clean and minimal */}
      <div className="ticket-header">
        <div className="flex items-start gap-3">
          {/* Mobile back button */}
          {showMobileBack && (
            <button
              onClick={onMobileBack}
              className="btn-circle-hover shrink-0 lg:hidden -ml-2"
            >
              <IconArrowLeft size={20} />
            </button>
          )}

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <h2 className="ticket-header-title truncate">
              {ticket.subject}
            </h2>
            <div className="ticket-header-meta">
              <span>{categoryLabel}</span>
              <span className="ticket-header-meta-dot" />
              <span className={`status-dot status-dot-${ticket.status}`} />
              <span>{statusLabel}</span>
              <span className="ticket-header-meta-dot" />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>

          {/* Status dropdown for admin */}
          {isAdmin && (
            <div className="shrink-0">
              <FilterDropdown
                options={statusOptions}
                value={ticket.status}
                onChange={handleStatusChange}
                placeholder="Statut"
              />
            </div>
          )}
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TicketConversation
          comments={optimisticComments}
          currentUserId={currentUserId}
        />
      </div>

      {/* Reply input */}
      <TicketReplyInput
        onSubmit={handleAddComment}
        isPending={isPending}
        error={error}
      />
    </div>
  );
}
