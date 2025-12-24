'use client';

import { useRouter } from 'next/navigation';
import { IconPhone, IconBuilding, IconMessage, IconDotsVertical } from '@tabler/icons-react';
import {
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardCardDescription,
  KanbanBoardCardButton,
} from './board-primitives';
import { UserAvatar } from '@/modules/shared';
import type { LeadForKanban } from '../../types';
import { formatLeadName } from '../../lib/kanban-utils';
import { QuickCommentPopover } from './quick-comment-popover';

interface KanbanCardProps {
  lead: LeadForKanban;
}

export function KanbanCard({ lead }: KanbanCardProps) {
  const router = useRouter();
  const name = formatLeadName(lead);

  // Navigate to lead detail
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card drag
    router.push(`/leads/${lead.id}`);
  };

  // Truncate comment to 60 chars
  const truncatedComment = lead.last_comment?.body
    ? lead.last_comment.body.length > 60
      ? lead.last_comment.body.substring(0, 60) + '...'
      : lead.last_comment.body
    : null;

  return (
    <KanbanBoardCard
      data={{ id: lead.id }}
      className="hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-150"
    >
      {/* Card title - Lead name */}
      <KanbanBoardCardTitle className="truncate pr-6">
        {name}
      </KanbanBoardCardTitle>

      {/* Card content - Phone and company */}
      <div className="space-y-1 mt-1">
        {lead.phone && (
          <KanbanBoardCardDescription className="flex items-center gap-1.5 text-darklink">
            <IconPhone size={12} className="flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </KanbanBoardCardDescription>
        )}
        {lead.company && (
          <KanbanBoardCardDescription className="flex items-center gap-1.5 text-darklink">
            <IconBuilding size={12} className="flex-shrink-0" />
            <span className="truncate">{lead.company}</span>
          </KanbanBoardCardDescription>
        )}
      </div>

      {/* Footer - Last comment with avatar OR no comment message */}
      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
        {lead.last_comment ? (
          <>
            <UserAvatar
              name={lead.last_comment.author?.display_name}
              avatar={lead.last_comment.author?.avatar}
              size="xs"
              className="flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-darklink line-clamp-2 flex-1">
              {truncatedComment}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-darklink/60 italic">
            <IconMessage size={12} />
            <span>Aucun commentaire</span>
          </div>
        )}
      </div>

      {/* Comment button (top right, visible on hover) */}
      <div className="absolute top-2.5 right-2.5 z-40">
        <QuickCommentPopover leadId={lead.id} leadName={name} />
      </div>

      {/* View details button (bottom right, visible on hover) */}
      <KanbanBoardCardButton
        onClick={handleViewDetails}
        tooltip="Voir les détails"
        className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100"
      >
        <IconDotsVertical size={14} />
      </KanbanBoardCardButton>
    </KanbanBoardCard>
  );
}
