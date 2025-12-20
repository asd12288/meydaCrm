'use client';

import type { SupportTicketStatus } from '@/db/types';
import { TICKET_STATUS_LABELS } from '../config/constants';

interface TicketCounts {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface TicketStatsCardsProps {
  counts: TicketCounts;
  activeFilter: SupportTicketStatus | null;
  onFilterChange: (status: SupportTicketStatus | null) => void;
}

interface StatCard {
  key: SupportTicketStatus | 'total';
  label: string;
  count: number;
  dotClass: string;
}

export function TicketStatsCards({
  counts,
  activeFilter,
  onFilterChange,
}: TicketStatsCardsProps) {
  const cards: StatCard[] = [
    {
      key: 'total',
      label: 'Total',
      count: counts.total,
      dotClass: 'bg-darklink',
    },
    {
      key: 'open',
      label: TICKET_STATUS_LABELS.open,
      count: counts.open,
      dotClass: 'bg-info',
    },
    {
      key: 'in_progress',
      label: TICKET_STATUS_LABELS.in_progress,
      count: counts.in_progress,
      dotClass: 'bg-warning',
    },
    {
      key: 'resolved',
      label: TICKET_STATUS_LABELS.resolved,
      count: counts.resolved,
      dotClass: 'bg-success',
    },
    {
      key: 'closed',
      label: TICKET_STATUS_LABELS.closed,
      count: counts.closed,
      dotClass: 'bg-secondary',
    },
  ];

  const handleClick = (key: SupportTicketStatus | 'total') => {
    if (key === 'total') {
      onFilterChange(null);
    } else {
      // Toggle filter if clicking same card
      onFilterChange(activeFilter === key ? null : key);
    }
  };

  const isActive = (key: SupportTicketStatus | 'total') => {
    if (key === 'total') {
      return activeFilter === null;
    }
    return activeFilter === key;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => handleClick(card.key)}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border transition-all
            ${isActive(card.key)
              ? 'border-primary bg-lightprimary dark:bg-primary/20 text-primary font-medium'
              : 'border-ld bg-white dark:bg-dark text-darklink hover:border-primary hover:text-primary'
            }
          `}
        >
          <span className={`w-2 h-2 rounded-full ${card.dotClass}`} />
          <span>{card.label}</span>
          <span className="font-semibold text-ld">{card.count}</span>
        </button>
      ))}
    </div>
  );
}
