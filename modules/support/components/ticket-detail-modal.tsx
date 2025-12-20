'use client';

import { useState, useMemo, useEffect, useRef, useOptimistic } from 'react';
import { IconTicket, IconMessageCircle, IconSend, IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import {
  Modal,
  FormErrorAlert,
  FormSuccessAlert,
  useFormState,
  FilterDropdown,
  type FilterOption,
} from '@/modules/shared';
import type { SupportTicketWithDetails, SupportTicketCommentWithAuthor } from '../types';
import { TicketCategoryBadge } from '../ui/ticket-category-badge';
import { TicketStatusBadge } from '../ui/ticket-status-badge';
import { TicketCommentBubble } from './ticket-comment-bubble';
import { updateTicketStatus, addComment } from '../lib/actions';
import { TICKET_STATUS_OPTIONS, TICKET_STATUS_COLORS } from '../config/constants';
import { getCurrentUser } from '@/modules/auth';

// Map badge classes to text color classes
const BADGE_TO_TEXT_COLOR: Record<string, string> = {
  'badge-success': 'text-success',
  'badge-warning': 'text-warning',
  'badge-error': 'text-error',
  'badge-info': 'text-info',
  'badge-primary': 'text-primary',
  'badge-secondary': 'text-secondary',
};

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicketWithDetails | null;
  onUpdate?: () => void;
}

export function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  onUpdate,
}: TicketDetailModalProps) {
  const [commentBody, setCommentBody] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  // Check if user is admin on mount
  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsAdminUser(user?.profile?.role === 'admin');
      setCurrentUserId(user?.profile?.id || null);
    });
  }, []);

  // Optimistic updates for comments
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    ticket?.comments || [],
    (
      state: SupportTicketCommentWithAuthor[],
      action: { type: 'add'; comment: SupportTicketCommentWithAuthor }
    ) => {
      if (action.type === 'add') {
        return [...state, action.comment];
      }
      return state;
    }
  );

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (optimisticComments.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [optimisticComments.length]);

  // Convert status options to FilterOption format with colors
  const statusOptions: FilterOption[] = useMemo(
    () =>
      TICKET_STATUS_OPTIONS.map((opt) => {
        const color = TICKET_STATUS_COLORS[opt.value];
        const badgeClass = `badge-${color}`;
        const textColorClass = BADGE_TO_TEXT_COLOR[badgeClass] || 'text-primary';
        return {
          value: opt.value,
          label: opt.label,
          iconColorClass: textColorClass,
        };
      }),
    []
  );

  if (!ticket) return null;

  const handleStatusChange = (newStatus: string) => {
    resetAll();
    startTransition(async () => {
      const result = await updateTicketStatus({
        ticketId: ticket.id,
        status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
      });

      if (result.error) {
        setError(result.error);
      } else {
        handleFormSuccess({ onSuccess: onUpdate, onSuccessDelay: 500 });
      }
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || isPending) return;

    const commentText = commentBody.trim();
    setCommentBody('');

    resetAll();
    startTransition(async () => {
      // Optimistic update (inside transition)
      if (currentUserId) {
        const tempComment: SupportTicketCommentWithAuthor = {
          id: `temp-${Date.now()}`,
          ticketId: ticket.id,
          authorId: currentUserId,
          body: commentText,
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
        addOptimisticComment({ type: 'add', comment: tempComment });
      }

      const result = await addComment({
        ticketId: ticket.id,
        body: commentText,
        isInternal: false,
      });

      if (result.error) {
        setError(result.error);
        setCommentBody(commentText); // Restore on error
      } else {
        handleFormSuccess({ onSuccess: onUpdate, onSuccessDelay: 500 });
      }
    });
  };

  const formatTicketDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return '-';
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return isNaN(date.getTime())
        ? '-'
        : date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return '-';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticket.subject}
      icon={<IconTicket size={20} />}
      size="full"
    >
      <div className="flex flex-col h-full min-h-0 -mx-6 -my-6">
        {/* Fixed Header Section - Ticket Details */}
        <div className="shrink-0 border-b border-ld pb-4 mb-4 px-6 pt-0">
          {/* Collapsible Details Section */}
          <button
            type="button"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <h4 className="text-sm font-semibold text-ld">Détails du ticket</h4>
            {isDetailsExpanded ? (
              <IconChevronUp size={18} className="text-darklink" />
            ) : (
              <IconChevronDown size={18} className="text-darklink" />
            )}
          </button>

          {isDetailsExpanded && (
            <div className="space-y-4">
              {/* Ticket metadata */}
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-darklink mb-1">Catégorie</p>
                  <TicketCategoryBadge category={ticket.category} />
                </div>
                <div>
                  <p className="text-xs text-darklink mb-1">Statut</p>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <div>
                  <p className="text-xs text-darklink mb-1">Créé par</p>
                  <p className="text-sm text-ld">
                    {ticket.createdByProfile?.displayName || (ticket.createdByProfile as { display_name?: string })?.display_name || 'Inconnu'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-darklink mb-1">Date de création</p>
                  <p className="text-sm text-ld">
                    {formatTicketDate(ticket.createdAt || (ticket as { created_at?: string }).created_at)}
                  </p>
                </div>
              </div>

              {/* Status update - Admin only */}
              {isAdminUser && (
                <div>
                  <label className="form-label mb-2 block">Changer le statut</label>
                  <FilterDropdown
                    options={statusOptions}
                    value={ticket.status}
                    onChange={(value) => handleStatusChange(value)}
                    placeholder="Sélectionner un statut"
                    icon={IconFilter}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h5 className="text-xs font-semibold text-darklink mb-2 uppercase tracking-wide">
                  Description
                </h5>
                <div className="p-4 bg-lightgray dark:bg-darkgray rounded-lg text-sm text-ld whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6">
          {optimisticComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-darklink">
              <IconMessageCircle size={48} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">Aucun commentaire</p>
              <p className="text-xs">Soyez le premier à commenter</p>
            </div>
          ) : (
            <div className="py-2">
              {optimisticComments.map((comment) => (
                <TicketCommentBubble
                  key={comment.id}
                  comment={comment}
                  isCurrentUser={comment.authorId === currentUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Input Section */}
        <div className="shrink-0 border-t border-ld pt-4 mt-4 px-6 pb-6">
          <FormErrorAlert error={error} />
          <FormSuccessAlert show={success} message="Commentaire ajouté" />

          <form onSubmit={handleAddComment} className="flex gap-3 items-end">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={2}
              className="form-control-input flex-1 resize-none"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !commentBody.trim()}
              className="ui-button bg-primary text-white h-10 w-10 p-0 shrink-0 disabled:opacity-50"
              title="Envoyer"
            >
              <IconSend size={18} />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
