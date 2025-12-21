'use client';

import { useOptimistic, useTransition } from 'react';
import { IconArrowLeft, IconMessageCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { FilterDropdown, type FilterOption, useToast } from '@/modules/shared';
import { TicketConversation } from './ticket-conversation';
import { TicketReplyInput } from './ticket-reply-input';
import { TicketDetailSkeleton } from '../ui/ticket-detail-skeleton';
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
  const { toast } = useToast();

  // Optimistic updates for comments
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    ticket?.comments || [],
    (
      state: SupportTicketCommentWithAuthor[],
      newComment: SupportTicketCommentWithAuthor
    ) => [...state, newComment]
  );

  // Optimistic updates for status
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<SupportTicketStatus>(
    ticket?.status || 'open'
  );

  // Status options for dropdown
  const statusOptions: FilterOption[] = TICKET_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Empty state - no ticket selected
  if (!ticket && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-lightgray dark:bg-darkgray">
        <IconMessageCircle size={48} className="text-darklink opacity-40 mb-3" />
        <p className="text-base font-medium text-ld mb-1">Sélectionnez un ticket</p>
        <p className="text-sm text-darklink">
          Choisissez un ticket dans la liste pour voir la conversation
        </p>
      </div>
    );
  }

  // Loading state - show skeleton
  if (isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (!ticket) return null;

  // Handle both camelCase and snake_case field names from API
  const ticketData = ticket as { createdAt?: Date | string; created_at?: string };
  const createdAt = ticketData.createdAt || ticketData.created_at || new Date();
  const categoryLabel = TICKET_CATEGORY_LABELS[ticket.category] || ticket.category;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      // Optimistic: update immediately
      setOptimisticStatus(newStatus as SupportTicketStatus);

      const result = await updateTicketStatus({
        ticketId: ticket.id,
        status: newStatus as SupportTicketStatus,
      });

      if (result.error) {
        toast.error(result.error);
        // Revalidation will restore correct state
      } else {
        onUpdate?.();
      }
    });
  };

  // Get optimistic status label
  const optimisticStatusLabel = TICKET_STATUS_LABELS[optimisticStatus] || optimisticStatus;

  const handleAddComment = (body: string) => {
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
        toast.error(result.error);
        // Revalidation will restore correct state
      } else {
        onUpdate?.();
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Clean and minimal */}
      <div className="ticket-header shrink-0">
        <div className="flex items-start gap-3">
          {/* Mobile back button */}
          {showMobileBack && (
            <Button
              variant="circleHover"
              size="icon"
              onClick={onMobileBack}
              className="shrink-0 lg:hidden -ml-2"
            >
              <IconArrowLeft size={20} />
            </Button>
          )}

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <h2 className="ticket-header-title truncate">
              {ticket.subject}
            </h2>
            <div className="ticket-header-meta">
              <span>{categoryLabel}</span>
              <span className="ticket-header-meta-dot" />
              <span className={`status-dot status-dot-${optimisticStatus}`} />
              <span>{optimisticStatusLabel}</span>
              <span className="ticket-header-meta-dot" />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>

          {/* Status dropdown for admin */}
          {isAdmin && (
            <div className="shrink-0">
              <FilterDropdown
                options={statusOptions}
                value={optimisticStatus}
                onChange={handleStatusChange}
                placeholder="Statut"
              />
            </div>
          )}
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <TicketConversation
          ticket={ticket}
          comments={optimisticComments}
          currentUserId={currentUserId}
        />
      </div>

      {/* Reply input - always at bottom */}
      <div className="shrink-0">
        <TicketReplyInput
          onSubmit={handleAddComment}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
