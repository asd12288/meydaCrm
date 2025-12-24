'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import SimpleBar from 'simplebar-react';
import { IconSearch, IconTicket, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { TicketListItem } from './ticket-list-item';
import type { SupportTicketWithDetails } from '../types';

const SEARCH_DEBOUNCE_MS = 300;
const SCROLL_THRESHOLD = 100; // px from bottom to trigger load more

interface TicketListPanelProps {
  tickets: SupportTicketWithDetails[];
  selectedTicketId: string | null;
  onTicketSelect: (ticket: SupportTicketWithDetails) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function TicketListPanel({
  tickets,
  selectedTicketId,
  onTicketSelect,
  searchValue,
  onSearchChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: TicketListPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange(value);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollableElement = container.querySelector('.simplebar-content-wrapper');
    if (!scrollableElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < SCROLL_THRESHOLD) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Attach scroll listener to SimpleBar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollableElement = container.querySelector('.simplebar-content-wrapper');
    if (!scrollableElement) return;

    scrollableElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search header */}
      <div className="shrink-0 p-4 border-b border-ld bg-white dark:bg-dark">
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={localSearch}
            onChange={handleSearchChange}
            className="w-full h-10 pl-9 pr-3 text-sm border border-ld rounded-lg bg-white dark:bg-darkgray focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Tickets list */}
      <div className="flex-1 min-h-0" ref={scrollContainerRef}>
        {tickets.length === 0 ? (
          <div className="ticket-empty-state h-full">
            <IconTicket size={40} className="ticket-empty-icon" />
            <p className="ticket-empty-title">Aucun ticket</p>
            <p className="ticket-empty-text">
              {searchValue
                ? 'Aucun ticket ne correspond à votre recherche'
                : 'Aucun ticket pour le moment'}
            </p>
          </div>
        ) : (
          <SimpleBar className="h-full">
            {tickets.map((ticket) => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicketId === ticket.id}
                onClick={() => onTicketSelect(ticket)}
              />
            ))}
            
            {/* Load more indicator */}
            {hasMore && (
              <div className="py-4 flex justify-center border-t border-ld">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-darklink">
                    <IconLoader2 size={16} className="animate-spin text-primary" />
                    <span>Chargement des tickets...</span>
                  </div>
                ) : (
                  <Button
                    variant="link"
                    onClick={onLoadMore}
                  >
                    Charger plus de tickets
                  </Button>
                )}
              </div>
            )}
          </SimpleBar>
        )}
      </div>
    </div>
  );
}
