'use client';

import { useRef, useEffect, useState } from 'react';
import {
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
} from './board-primitives';
import type { LeadForKanban } from '../../types';
import type { LeadStatus } from '@/db/types';
import { STATUS_COLORS, STATUS_ICON_MAP, BADGE_TO_COLOR } from '../../config/constants';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  status: LeadStatus;
  label: string;
  leads: LeadForKanban[];
  onCardDrop: (leadId: string, newStatus: LeadStatus) => void;
}

export function KanbanColumn({
  status,
  label,
  leads,
  onCardDrop,
}: KanbanColumnProps) {
  // Track count changes for animation
  const prevCountRef = useRef(leads.length);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (leads.length !== prevCountRef.current) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setShouldPulse(true);
      });
      prevCountRef.current = leads.length;
      // Remove pulse animation after it completes
      const timer = setTimeout(() => setShouldPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [leads.length]);

  // Handle drop on the column (empty area or bottom of list)
  const handleDropOverColumn = (dataTransferData: string) => {
    try {
      const data = JSON.parse(dataTransferData);
      if (data.id) {
        onCardDrop(data.id, status);
      }
    } catch (e) {
      console.error('Failed to parse drop data:', e);
    }
  };

  // Handle drop on a specific card
  const handleDropOverCard = (dataTransferData: string) => {
    try {
      const data = JSON.parse(dataTransferData);
      if (data.id) {
        onCardDrop(data.id, status);
      }
    } catch (e) {
      console.error('Failed to parse drop data:', e);
    }
  };

  // Get status icon and color
  const StatusIcon = STATUS_ICON_MAP[status];
  const colorClass = STATUS_COLORS[status] || 'badge-primary';
  const iconColor = BADGE_TO_COLOR[colorClass] || 'var(--color-primary)';

  return (
    <KanbanBoardColumn
      columnId={status}
      onDropOverColumn={handleDropOverColumn}
      className="h-[calc(100vh-200px)] min-h-[500px]"
    >
      <KanbanBoardColumnHeader>
        <KanbanBoardColumnTitle columnId={status} className="gap-2">
          {StatusIcon && (
            <StatusIcon size={16} className="flex-shrink-0 transition-transform duration-200" style={{ color: iconColor }} />
          )}
          <span>{label}</span>
          <span 
            className={`text-xs text-darklink transition-all duration-200 ${shouldPulse ? 'animate-count-pulse text-primary font-semibold' : ''}`}
          >
            ({leads.length})
          </span>
        </KanbanBoardColumnTitle>
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList className="px-1">
        {leads.map((lead) => (
          <KanbanBoardColumnListItem
            key={lead.id}
            cardId={lead.id}
            onDropOverListItem={handleDropOverCard}
          >
            <KanbanCard lead={lead} />
          </KanbanBoardColumnListItem>
        ))}
      </KanbanBoardColumnList>
    </KanbanBoardColumn>
  );
}
